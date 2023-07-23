import { Response } from "express";

/**
 * Returns a 400 response for a bad request.
 * @param response The route handler's `Response` object.
 * @param reason The reason that the request is bad.
 * @returns
 */
export function badRequest(
  response: Response,
  reason: string = "Bad Request",
): Response {
  return response.status(400).json({ reason });
}

/**
 * Returns a 401 response for an unauthorized request.
 * @param response The route handler's `Response` object.
 * @param reason The reason that the request is unauthorized.
 * @returns
 */
export function unauthorized(
  response: Response,
  reason: string = "Unauthorized",
): Response {
  return response.status(401).json({ reason });
}

/**
 * Returns a 422 response for invalid request input.
 * @param response The route handler's `Response` object.
 * @param name The name of the invalid request input.
 * @param reason The reason that the input is invalid.
 * @returns
 */
export function unprocessableEntity(
  response: Response,
  name: string,
  reason: string = "Unprocessable Entity",
): Response {
  return response.status(422).json({ name, reason });
}

/**
 * Returns a 500 response for an internal server error.
 * @param response The route handler's `Response` object.
 * @param reason The reason that the error occurred.
 * @returns
 */
export function internalServerError(
  response: Response,
  reason: string = "Internal Server Error",
): Response {
  return response.status(500).json({ reason });
}
