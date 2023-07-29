import { RequestHandler } from "express";
import { safeEqual, verifySignature } from "../lib/crypto.js";
import { badRequest } from "../lib/responses.js";

const guardedMethods = ["post", "put", "patch", "delete"];

export const csrfMiddleware: RequestHandler = (request, response, next) => {
  if (!guardedMethods.includes(request.method.toLowerCase())) {
    return next();
  }

  const headerToken = request.headers["x-xsrf-token"];
  const cookieToken: string = request.cookies["XSRF-TOKEN"];

  if (!headerToken || Array.isArray(headerToken) || !cookieToken) {
    return badRequest(response);
  }

  const [headerTokenValue, headerTokenSignature] = headerToken.split(".");
  const [cookieTokenValue, cookieTokenSignature] = cookieToken.split(".");

  if (
    !headerTokenSignature ||
    !cookieTokenSignature ||
    !verifySignature(headerTokenValue, headerTokenSignature) ||
    !verifySignature(cookieTokenValue, cookieTokenSignature) ||
    !safeEqual(headerTokenValue, cookieTokenValue)
  ) {
    return badRequest(response);
  }

  return next();
};
