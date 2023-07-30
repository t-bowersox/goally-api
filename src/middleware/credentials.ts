import { RequestHandler } from "express";

export const credentialsMiddleware: RequestHandler = (
  request,
  response,
  next,
) => {
  response.setHeader("Access-Control-Allow-Credentials", "true");
  return next();
};
