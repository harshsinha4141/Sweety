// Date helpers. A "day" is the patient's local calendar day, so "today" is computed in the
// client's IANA time zone (sent as the X-Timezone header), falling back to DEFAULT_TIMEZONE, then UTC.

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

function isValidTimeZone(tz) {
  if (typeof tz !== "string" || !tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function resolveTimeZone(tz) {
  if (isValidTimeZone(tz)) return tz;
  if (isValidTimeZone(process.env.DEFAULT_TIMEZONE)) return process.env.DEFAULT_TIMEZONE;
  return "UTC";
}

// "YYYY-MM-DD" for the current day in the given time zone.
function todayIn(tz) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: resolveTimeZone(tz),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Strict YYYY-MM-DD that is a real calendar date (rejects 2026-02-30).
function isValidDateString(value) {
  if (typeof value !== "string" || !DATE_REGEX.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const isValidMonthString = (value) => typeof value === "string" && MONTH_REGEX.test(value);

const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

// Whole days from `from` to `to` (both YYYY-MM-DD).
const daysBetween = (from, to) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);

module.exports = {
  resolveTimeZone,
  todayIn,
  isValidDateString,
  isValidMonthString,
  daysInMonth,
  daysBetween,
};
