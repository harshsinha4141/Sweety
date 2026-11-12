const supabase = require("../../config/supabase");
const AppError = require("../../utils/AppError");
const { todayIn, isValidDateString, daysInMonth } = require("../../utils/date");
const { round1, decorate } = require("../glucose_readings/glucose");
const reportsCache = require("./reportsCache");

const TABLE = "glucose_reading";
const COLUMNS = "id, reading_date, time_slot, glucose_value, created_at, updated_at";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad2 = (n) => String(n).padStart(2, "0");

/* ---------- date helpers ---------- */

// Selected date: defaults to today (patient's time zone); cannot be in the future.
function resolveSelectedDate(date, tz) {
  const today = todayIn(tz);
  if (date === undefined || date === "") return today;
  if (!isValidDateString(date)) throw new AppError("Please enter a valid date (YYYY-MM-DD).", 400);
  if (date > today) throw new AppError("Date cannot be in the future.", 400);
  return date;
}

const parts = (date) => date.split("-").map(Number); // [y, m, d]

// "15 Oct 2026"
function formatDate(date) {
  const [y, m, d] = parts(date);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// "1 Oct – 15 Oct 2026" (year shown once when both dates share it)
function formatRange(from, to) {
  const [fy, fm, fd] = parts(from);
  const start = fy === parts(to)[0] ? `${fd} ${MONTHS[fm - 1]}` : formatDate(from);
  return `${start} – ${formatDate(to)}`;
}

// Date ranges for the selected date (e.g. 2026-10-15):
const ranges = {
  daily: (date) => ({ from: date, to: date }), // 15 Oct 2026
  month_to_date: (date) => ({ from: `${date.slice(0, 7)}-01`, to: date }), // 1 Oct – 15 Oct 2026
  monthly: (date) => {
    // whole previous month: 1 Sep – 30 Sep 2026
    let [y, m] = parts(date);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
    const month = `${y}-${pad2(m)}`;
    return { from: `${month}-01`, to: `${month}-${pad2(daysInMonth(y, m))}` };
  },
};

/* ---------- data + stats ---------- */

async function fetchReadings(userId, from, to) {
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMNS)
    .eq("user_id", userId) // own readings only
    .gte("reading_date", from)
    .lte("reading_date", to)
    .order("reading_date", { ascending: true })
    .order("created_at", { ascending: true }); // exact recorded time
  if (error) throw error;
  return data.map(decorate);
}

// Highest / lowest / average (1 decimal) / count. Values are null when there are no readings.
function stats(readings) {
  const values = readings.map((r) => r.glucose_value);
  const count = values.length;
  return {
    count,
    highest: count ? Math.max(...values) : null,
    lowest: count ? Math.min(...values) : null,
    average: count ? round1(values.reduce((a, b) => a + b, 0) / count) : null,
  };
}

const EMPTY_MESSAGES = {
  daily: "No readings for this date yet.",
  month_to_date: "No readings so far this month.",
  monthly: "No readings were logged last month.",
};

async function buildReport(type, userId, date) {
  const { from, to } = ranges[type](date);
  const readings = await fetchReadings(userId, from, to);
  const summary = stats(readings);

  const report = {
    type,
    from,
    to,
    label: type === "daily" ? formatDate(from) : formatRange(from, to),
    summary,
    is_empty: summary.count === 0,
    empty_message: summary.count === 0 ? EMPTY_MESSAGES[type] : null,
  };
  // The daily report also lists each reading with its slot.
  if (type === "daily") report.readings = readings;
  return report;
}

/* ---------- cached access ---------- */

// Builds the requested report types for one date, reading from / filling the Redis cache.
// → { reports: { [type]: report }, cache: "hit" | "partial" | "miss" | "off" }
async function getReports(userId, types, date) {
  const cached = await reportsCache.read(userId, types, date);
  const reports = { ...(cached?.reports ?? {}) };
  const missing = types.filter((type) => !reports[type]);

  const built = await Promise.all(missing.map((type) => buildReport(type, userId, date)));
  const fresh = Object.fromEntries(missing.map((type, i) => [type, built[i]]));
  if (cached) await reportsCache.write(userId, cached.version, date, fresh);
  Object.assign(reports, fresh);

  let cache = "off";
  if (cached) cache = missing.length === 0 ? "hit" : missing.length === types.length ? "miss" : "partial";
  console.log(
    `[cache] ${cache.toUpperCase()} reports user=${userId} date=${date} ` +
      `cached=[${types.filter((t) => !missing.includes(t)).join(",")}] built=[${missing.join(",")}]`
  );
  return { reports, cache };
}

async function singleReport(type, userId, query, tz) {
  const date = resolveSelectedDate(query.date, tz);
  const { reports, cache } = await getReports(userId, [type], date);
  return { ...reports[type], cache };
}

/* ---------- use cases ---------- */

const dailyReport = (userId, query = {}, tz) => singleReport("daily", userId, query, tz);
const monthToDateReport = (userId, query = {}, tz) => singleReport("month_to_date", userId, query, tz);
const monthlyReport = (userId, query = {}, tz) => singleReport("monthly", userId, query, tz);

// All three reports for one selected date.
async function allReports(userId, query = {}, tz) {
  const date = resolveSelectedDate(query.date, tz);
  const { reports, cache } = await getReports(userId, ["daily", "month_to_date", "monthly"], date);
  return { date, daily: reports.daily, month_to_date: reports.month_to_date, monthly: reports.monthly, cache };
}

// "Hard reset" of this patient's cached reports (the next request rebuilds them from Supabase).
const resetCache = (userId) => reportsCache.reset(userId);

module.exports = { dailyReport, monthToDateReport, monthlyReport, allReports, resetCache };
