import express from "express";
import { hashPassword } from "../lib/crypto.js";
import { internalServerError, unprocessableEntity } from "../lib/responses.js";
import { createUser, getUserById, getUserByUsername } from "../lib/users.js";

const router = express.Router();

router.post("/", async (request, response) => {
  const { username, password, passwordConfirmation } =
    request.body as RegistrationBody;

  if (!username || username.length > 50) {
    return unprocessableEntity(
      response,
      "username",
      "A username of 50 characters or less is required..",
    );
  }

  if (!password || password.length < 8) {
    return unprocessableEntity(
      response,
      "password",
      "A password of 8 or more characters is required.",
    );
  }

  if (password !== passwordConfirmation) {
    return unprocessableEntity(
      response,
      "passwordConfirmation",
      "Passwords must match.",
    );
  }

  const existingUserWithUsername = await getUserByUsername(username);

  if (existingUserWithUsername) {
    return unprocessableEntity(
      response,
      "username",
      `${username} is unavailable.`,
    );
  }

  const hashedPassword = await hashPassword(password);
  const userId = await createUser(username, hashedPassword);

  if (!userId) {
    return internalServerError(response, "Error creating user.");
  }

  request.session = { userId };

  const user = await getUserById(userId);

  return user
    ? response.status(201).json(user)
    : internalServerError(response, "Error retrieving user.");
});

router.get("/", async (request, response) => {
  if (!request.session || !request.session.userId) {
    return response.json(null);
  }

  const user = await getUserById(request.session.userId);
  return response.setHeader("Cache-Control", "max-age=0").json(user);
});

export default router;

// Local types

interface RegistrationBody {
  username: string;
  password: string;
  passwordConfirmation: string;
}
