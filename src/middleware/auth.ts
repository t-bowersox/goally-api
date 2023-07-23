import { RequestHandler } from "express";
import { unauthorized } from "../lib/responses.js";

export const AuthenticationMiddleware: RequestHandler = (
  request,
  response,
  next,
) => {
  if (!request.session?.userId) {
    request.session = null;
    return unauthorized(response);
  }

  return next();
};
