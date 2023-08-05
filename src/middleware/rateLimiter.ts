import { RequestHandler } from "express";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { redisClient } from "../lib/redis.js";
import { tooManyRequests } from "../lib/responses.js";

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "goally:auth",
  points: 10,
  duration: 5 * 60, // 5 minutes in seconds
});

export const rateLimiterMiddleware: RequestHandler = async (
  request,
  response,
  next,
) => {
  const exemptEnvs = ["test"];
  const currentEnv = process.env.NODE_ENV ?? "production";

  if (exemptEnvs.includes(currentEnv)) {
    return next();
  }

  try {
    if (!redisClient.isReady) {
      await redisClient.connect();
    }

    await rateLimiter.consume(`${request.ip}:${request.path}`);
    next();
  } catch (error) {
    return tooManyRequests(response);
  } finally {
    redisClient.disconnect();
  }
};
