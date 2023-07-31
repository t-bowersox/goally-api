import express from "express";
import { hashPassword, verifyPassword } from "../lib/crypto.js";
import {
  badRequest,
  internalServerError,
  unauthorized,
  unprocessableEntity,
} from "../lib/responses.js";
import { AuthenticatedSession, User } from "../lib/types.js";
import {
  createUser,
  deleteUserById,
  getUserById,
  getUserByUsername,
  updateUserById,
} from "../lib/users.js";
import { AuthenticationMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", async (request, response) => {
  const body = request.body as RegistrationBody;
  const userValidationResult = await validateUsername(body.username ?? "");

  if (userValidationResult !== true) {
    return unprocessableEntity(response, "username", userValidationResult);
  }

  const passwordValidationResult = validateNewPassword(
    body.password ?? "",
    body.passwordConfirmation ?? "",
  );

  if (passwordValidationResult !== true) {
    return unprocessableEntity(response, "password", passwordValidationResult);
  }

  const username = body.username as string;
  const password = body.password as string;
  const hashedPassword = await hashPassword(password);
  const userId = await createUser(username, hashedPassword);

  if (!userId) {
    return internalServerError(response, "Error creating user.");
  }

  request.session = { userId };
  return response.status(201).json(true);
});

router.get("/", async (request, response) => {
  if (!request.session || !request.session.userId) {
    return response.json(null);
  }

  const user = await getUserById(request.session.userId);
  return response
    .setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
    .setHeader("Pragma", "no-cache")
    .setHeader("Expires", "0")
    .json(user);
});

router.put("/", AuthenticationMiddleware, async (request, response) => {
  const { userId } = request.session as AuthenticatedSession;
  const body = request.body as UpdateUserBody;
  const user = await getUserById(Number.parseInt(userId), true);

  if (
    !user ||
    !body.currentPassword ||
    !(await verifyPassword(body.currentPassword, user.password))
  ) {
    return unauthorized(response);
  }

  const updates: Partial<User> = {};

  if (body.username && body.username !== user.username) {
    const usernameValidationResult = await validateUsername(body.username);

    if (usernameValidationResult !== true) {
      return unprocessableEntity(
        response,
        "username",
        usernameValidationResult,
      );
    }

    updates.username = body.username;
  }

  if (body.newPassword) {
    const passwordValidationResult = validateNewPassword(
      body.newPassword,
      body.newPasswordConfirmation ?? "",
    );

    if (passwordValidationResult !== true) {
      return unprocessableEntity(
        response,
        "password",
        passwordValidationResult,
      );
    }

    updates.password = await hashPassword(body.newPassword);
  }

  if (!Object.keys(updates).length) {
    return badRequest(response, "No updates were provided.");
  }

  const updated = await updateUserById(Number.parseInt(userId), updates);

  if (!updated) {
    return internalServerError(response, "Error updating user.");
  }

  return response.json(true);
});

router.delete("/", AuthenticationMiddleware, async (request, response) => {
  const { userId } = request.session as AuthenticatedSession;
  const body = request.body as DeleteUserBody;
  const user = await getUserById(Number.parseInt(userId), true);

  if (!user || !(await verifyPassword(body.password ?? "", user.password))) {
    return unauthorized(response);
  }

  const deleted = await deleteUserById(user.id);

  if (!deleted) {
    return internalServerError(response, "Error deleting user.");
  }

  request.session = null;
  return response.json(true);
});

/**
 * Validates that a username meets length and availability requirements.
 * @param username The username to validate
 * @returns `true` if valid, otherwise a string containing an error message
 */
async function validateUsername(username: string): Promise<true | string> {
  if (!username || username.length > 50) {
    return "A username of 50 characters or less is required.";
  }

  const existingUserWithUsername = await getUserByUsername(username);
  return existingUserWithUsername ? `${username} is unavailable.` : true;
}

/**
 * Validates that a new password meets length and confirmation requirements.
 * @param password The password to validate
 * @param passwordConfirmation The confirmation of that password
 * @returns `true` if valid, otherwise a string containing an error message
 */
function validateNewPassword(
  password: string,
  passwordConfirmation: string,
): true | string {
  if (!password || password.length < 8) {
    return "A password of 8 or more characters is required.";
  }

  if (password !== passwordConfirmation) {
    return "Passwords must match.";
  }

  return true;
}

export default router;

// Local types

interface RegistrationBody {
  username?: string;
  password?: string;
  passwordConfirmation?: string;
}

interface UpdateUserBody {
  currentPassword?: string;
  username?: string;
  newPassword?: string;
  newPasswordConfirmation?: string;
}

interface DeleteUserBody {
  password?: string;
}
