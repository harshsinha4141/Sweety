const { getRedis, isRedisConfigured } = require("../../config/redis");

// Redis cache for built reports (daily / month_to_date / monthly), per patient and selected date.
//
// Keys:
//   sweety:reports:<userId>:ver                       → the patient's cache version (a counter)
//   sweety:reports:<userId>:v<ver>:<type>:<date>      → one report as JSON, expires after TTL
//
// Any reading change bumps the version, so every older entry is ignored at once (no key scans
// on the write path). A request that started before the change stores its result under the old
// version, so it can never put stale data back into the cache. Old entries just expire.
//
// The cache never breaks a request: if Redis is off or fails, callers read from Supabase.

const PREFIX = "sweety:reports";
const DEFAULT_TTL_SECONDS = 3600;

const ttlSeconds = () => {
  const n = Number(process.env.REPORTS_CACHE_TTL_SECONDS);
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_TTL_SECONDS;
};

const versionKey = (userId) => `${PREFIX}:${userId}:ver`;
const reportKey = (userId, version, type, date) => `${PREFIX}:${userId}:v${version}:${type}:${date}`;

const warn = (action, error) => console.warn(`[cache] ${action} failed: ${error.message}`);

// Patients whose readings changed while Redis was unreachable. Their cached reports (from before
// the outage) must not be served once Redis is back, so they are invalidated before any other use.
// In-process only: on a fresh process the TTL is the upper bound on staleness.
const pendingInvalidations = new Set();

async function flushPending(redis) {
  for (const userId of [...pendingInvalidations]) {
    await redis.incr(versionKey(userId));
    pendingInvalidations.delete(userId);
  }
}

// → { version, reports: { [type]: report } } with only the cached types; null when the cache is unavailable.
async function read(userId, types, date) {
  const redis = getRedis();
  if (!redis) return null;
  try {
    await flushPending(redis);
    const version = Number(await redis.get(versionKey(userId))) || 0;
    const values = await redis.mGet(types.map((type) => reportKey(userId, version, type, date)));
    const reports = {};
    types.forEach((type, i) => {
      if (values[i]) reports[type] = JSON.parse(values[i]);
    });
    return { version, reports };
  } catch (error) {
    warn("read", error);
    return null;
  }
}

// Stores freshly built reports under the version that was read before building them.
async function write(userId, version, date, reports) {
  const redis = getRedis();
  const entries = Object.entries(reports);
  if (!redis || !entries.length) return;
  try {
    const multi = redis.multi();
    for (const [type, report] of entries) {
      multi.set(reportKey(userId, version, type, date), JSON.stringify(report), {
        expiration: { type: "EX", value: ttlSeconds() },
      });
    }
    await multi.exec();
  } catch (error) {
    warn("write", error);
  }
}

// Called after a reading is created, updated or deleted. → true when the cache was cleared.
async function invalidate(userId) {
  if (!isRedisConfigured()) return false;
  const redis = getRedis();
  try {
    if (!redis) throw new Error("Redis is not connected");
    await redis.incr(versionKey(userId));
    return true;
  } catch (error) {
    warn("invalidate", error);
    pendingInvalidations.add(userId); // retried before the next cache read
    return false;
  }
}

// "Hard reset": bump the version and also delete every stored report of this patient right away.
// → { cache: "enabled" | "unavailable" | "disabled", cleared, deleted_keys }
async function reset(userId) {
  if (!isRedisConfigured()) return { cache: "disabled", cleared: false, deleted_keys: 0 };
  const redis = getRedis();
  if (!redis) return { cache: "unavailable", cleared: false, deleted_keys: 0 };
  try {
    await flushPending(redis);
    await redis.incr(versionKey(userId));
    let deleted = 0;
    for await (const keys of redis.scanIterator({ MATCH: `${PREFIX}:${userId}:v[0-9]*`, COUNT: 200 })) {
      if (keys.length) deleted += await redis.del(keys);
    }
    return { cache: "enabled", cleared: true, deleted_keys: deleted };
  } catch (error) {
    warn("reset", error);
    return { cache: "unavailable", cleared: false, deleted_keys: 0 };
  }
}

module.exports = { read, write, invalidate, reset };
