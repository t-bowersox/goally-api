import redis from "redis";

// Legacy mode is needed until https://github.com/animir/node-rate-limiter-flexible/pull/176 is released
export const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
  legacyMode: true,
});
