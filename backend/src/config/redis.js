const { createClient } = require("redis");

// Single Redis client used as a cache. Redis is optional:
//   - REDIS_URL unset  → caching is off, everything reads from Supabase.
//   - Redis down       → commands fail fast (no offline queue) and callers fall back to Supabase,
//                        while the client keeps reconnecting in the background.
const url = process.env.REDIS_URL;

let client = null;

if (url) {
  client = createClient({
    url,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 5000,
      reconnectStrategy: (retries) => Math.min(retries * 500, 10000),
    },
  });

  let lastError = null;
  client.on("error", (error) => {
    // Log each distinct error once instead of on every reconnect attempt.
    // (Connection refused arrives as an AggregateError with an empty message.)
    const message = error.message || error.code || error.errors?.[0]?.code || error.name;
    if (message !== lastError) console.warn(`[redis] ${message} (reports are served from Supabase until it reconnects)`);
    lastError = message;
  });
  client.on("ready", () => {
    lastError = null;
    console.log("[redis] connected");
  });

  client.connect().catch(() => {}); // failures are reported by the "error" listener above
} else {
  console.log("[redis] REDIS_URL not set: report caching is off");
}

// The client when it can serve commands right now, otherwise null.
const getRedis = () => (client && client.isReady ? client : null);

const isRedisConfigured = () => client !== null;

module.exports = { getRedis, isRedisConfigured };
