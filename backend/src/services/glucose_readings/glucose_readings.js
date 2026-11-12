const supabase = require("../../config/supabase");
const AppError = require("../../utils/AppError");
const { todayIn, isValidDateString, daysBetween } = require("../../utils/date");
const {
  MAX_READINGS_PER_DAY,
  MIN_VALUE,
  MAX_VALUE,
  SLOTS,
  slotLabel,
  decorate,
} = require("./glucose");
const reportsCache = require("../reports/reportsCache");

const TABLE = "glucose_reading";
const COLUMNS = "id, reading_date, time_slot, glucose_value, created_at, updated_at";
const MAX_RANGE_DAYS = 366;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200; // a full month is at most 31 × 4 = 124 readings (used by the chart)

/* ---------- validation ---------- */

// "an After lunch", "a Morning (fasting)"
const withArticle = (label) => `${/^[aeiou]/i.test(label) ? "an" : "a"} ${label}`;

const isBlank = (v) => v === undefined || v === null || (typeof v === "string" && v.trim() === "");

// Accepts numbers or numeric strings ("120"); returns NaN for anything else.
function toNumber(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string" && /^\s*-?\d+(\.\d+)?\s*$/.test(v)) return Number(v);
  return NaN;
}

function validateValue(value) {
  if (isBlank(value)) throw new AppError("Please enter a glucose value.", 400);
  const n = toNumber(value);
  if (!Number.isInteger(n) || n < MIN_VALUE || n > MAX_VALUE) {
    throw new AppError(`Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`, 400);
  }
  return n;
}

function validateDate(date, tz) {
  if (isBlank(date)) throw new AppError("Please select a date.", 400);
  if (!isValidDateString(date)) throw new AppError("Please enter a valid date (YYYY-MM-DD).", 400);
  if (date > todayIn(tz)) throw new AppError("Date cannot be in the future.", 400);
  return date;
}

function validateSlot(slot) {
  if (isBlank(slot)) throw new AppError("Please select a time slot.", 400);
  const n = toNumber(slot);
  if (!Number.isInteger(n) || !SLOTS[n]) throw new AppError("Please select a valid time slot.", 400);
  return n;
}

function validateId(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new AppError("Reading not found.", 404);
  return n;
}

// Order follows the product's rule list: value, then date, then slot.
function validateReadingInput(body, tz) {
  return {
    glucose_value: validateValue(body.glucose_value),
    reading_date: validateDate(body.reading_date, tz),
    time_slot: validateSlot(body.time_slot),
  };
}

/* ---------- data access (always scoped by userId) ---------- */

async function findOwnReading(userId, id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMNS)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError("Reading not found.", 404);
  return data;
}

async function slotsUsedOn(userId, date, excludeId) {
  let query = supabase.from(TABLE).select("id, time_slot").eq("user_id", userId).eq("reading_date", date);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query;
  if (error) throw error;
  return data.map((r) => r.time_slot);
}

// Max 4 per day, then one per slot per day.
async function assertSlotAvailable(userId, date, slot, excludeId) {
  const used = await slotsUsedOn(userId, date, excludeId);
  if (used.length >= MAX_READINGS_PER_DAY) {
    throw new AppError(`You can add only ${MAX_READINGS_PER_DAY} readings per day.`, 409);
  }
  if (used.includes(slot)) {
    throw new AppError(`You already have ${withArticle(slotLabel(slot))} reading for this date.`, 409);
  }
}

// DB constraint backstops (e.g. two requests racing for the same slot).
function mapDbError(error, slot) {
  if (error.code === "23505") {
    return new AppError(`You already have ${withArticle(slotLabel(slot))} reading for this date.`, 409);
  }
  if (error.code === "23514") return new AppError("Reading data is invalid.", 400);
  return error;
}

/* ---------- use cases ---------- */

async function createReading(userId, body = {}, tz) {
  const input = validateReadingInput(body, tz);
  await assertSlotAvailable(userId, input.reading_date, input.time_slot);

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...input, user_id: userId })
    .select(COLUMNS)
    .single();
  if (error) throw mapDbError(error, input.time_slot);
  await reportsCache.invalidate(userId); // this patient's cached reports are now stale
  return decorate(data);
}

// ?page=1&limit=20 → { page, limit, offset }
function parsePagination(query) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? DEFAULT_LIMIT : Number(query.limit);
  if (!Number.isInteger(page) || page < 1) throw new AppError("page must be a positive whole number.", 400);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new AppError(`limit must be a whole number between 1 and ${MAX_LIMIT}.`, 400);
  }
  return { page, limit, offset: (page - 1) * limit };
}

// GET /api/readings?page=1&limit=20
//   optional filters: ?date=YYYY-MM-DD  or  ?from=YYYY-MM-DD&to=YYYY-MM-DD  (none = all readings)
// Newest first.
async function listReadings(userId, query = {}) {
  let from = null;
  let to = null;
  if (query.from || query.to) {
    from = query.from;
    to = query.to;
    if (!isValidDateString(from) || !isValidDateString(to)) {
      throw new AppError("from and to must be valid dates (YYYY-MM-DD).", 400);
    }
    if (from > to) throw new AppError("from must be on or before to.", 400);
    if (daysBetween(from, to) >= MAX_RANGE_DAYS) {
      throw new AppError(`Date range cannot exceed ${MAX_RANGE_DAYS} days.`, 400);
    }
  } else if (query.date) {
    if (!isValidDateString(query.date)) throw new AppError("Please enter a valid date (YYYY-MM-DD).", 400);
    from = query.date;
    to = query.date;
  }

  const { page, limit, offset } = parsePagination(query);

  let request = supabase.from(TABLE).select(COLUMNS, { count: "exact" }).eq("user_id", userId);
  if (from) request = request.gte("reading_date", from).lte("reading_date", to);

  let { data, error, count } = await request
    .order("reading_date", { ascending: false })
    .order("time_slot", { ascending: false })
    .range(offset, offset + limit - 1);

  // PostgREST answers PGRST103 when the page is past the end: return an empty page with the real total.
  if (error && error.code === "PGRST103") {
    let countRequest = supabase.from(TABLE).select("id", { count: "exact", head: true }).eq("user_id", userId);
    if (from) countRequest = countRequest.gte("reading_date", from).lte("reading_date", to);
    ({ count, error } = await countRequest);
    data = [];
  }
  if (error) throw error;

  const total = count ?? 0;
  return {
    from,
    to,
    readings: data.map(decorate),
    pagination: { page, limit, total, total_pages: Math.max(1, Math.ceil(total / limit)) },
  };
}

async function getReading(userId, id) {
  return decorate(await findOwnReading(userId, validateId(id)));
}

// Partial update: any of glucose_value, reading_date, time_slot. created_at is kept.
async function updateReading(userId, id, body = {}, tz) {
  const readingId = validateId(id);
  const existing = await findOwnReading(userId, readingId);

  const fields = ["glucose_value", "reading_date", "time_slot"];
  if (!fields.some((f) => body[f] !== undefined)) {
    throw new AppError("Nothing to update.", 400);
  }

  const merged = { ...existing };
  for (const f of fields) if (body[f] !== undefined) merged[f] = body[f];
  const input = validateReadingInput(merged, tz);

  if (input.reading_date !== existing.reading_date || input.time_slot !== existing.time_slot) {
    await assertSlotAvailable(userId, input.reading_date, input.time_slot, readingId);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", readingId)
    .eq("user_id", userId)
    .select(COLUMNS)
    .single();
  if (error) throw mapDbError(error, input.time_slot);
  await reportsCache.invalidate(userId);
  return decorate(data);
}

async function deleteReading(userId, id) {
  const readingId = validateId(id);
  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", readingId)
    .eq("user_id", userId)
    .select("id");
  if (error) throw error;
  if (!data.length) throw new AppError("Reading not found.", 404);
  await reportsCache.invalidate(userId);
  return { id: readingId };
}

const listSlots = () => SLOTS.map(({ time_slot, label }) => ({ time_slot, label }));

module.exports = {
  createReading,
  listReadings,
  getReading,
  updateReading,
  deleteReading,
  listSlots,
};
