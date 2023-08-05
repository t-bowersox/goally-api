import { RequestHandler } from "express";
import { unauthorized } from "../lib/responses.js";
import { updateUserActivity } from "../lib/users.js";

export const AuthenticationMiddleware: RequestHandler = async (
  request,
  response,
  next,
) => {
  if (!request.session?.userId) {
    request.session = null;
    return unauthorized(response);
  }

  next();

  if (request.session?.userId) {
    await updateUserActivity(Number.parseInt(request.session.userId));
  }
};
