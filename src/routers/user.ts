import express from "express";
import {
  deleteVerificationTokenByUserId,
  upsertVerificationToken,
} from "../lib/account-verification-tokens.js";
import { createToken, hashPassword, verifySignature } from "../lib/crypto.js";
import { database } from "../lib/database.js";
import { EMAIL_REGEX, sendAccountVerificationEmail } from "../lib/email.js";
import {
  badRequest,
  internalServerError,
  unauthorized,
  unprocessableEntity,
} from "../lib/responses.js";
import { AuthenticatedSession } from "../lib/types.js";
import {
  createUser,
  getUserByEmail,
  getUserById,
  updateUserById,
} from "../lib/users.js";
import { AuthenticationMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", async (request, response) => {
  const body: RegistrationBody = request.body;
  const email = body.email;
  const password = body.password;

  if (!email || !EMAIL_REGEX.test(email)) {
    return unprocessableEntity(
      response,
      "email",
      "A valid email address is required.",
    );
  }

  if (!password || password.length < 8) {
    return unprocessableEntity(
      response,
      "password",
      "A password of 8 or more characters is required.",
    );
  }

  if (password !== body.passwordConfirmation) {
    return unprocessableEntity(
      response,
      "passwordConfirmation",
      "Passwords must match.",
    );
  }

  const existingUserWithEmail = await getUserByEmail(email);

  if (existingUserWithEmail) {
    return unprocessableEntity(response, "email", `${email} is unavailable.`);
  }

  const hashedPassword = await hashPassword(password);
  const userId = await createUser(email, hashedPassword);

  if (!userId) {
    return internalServerError(response, "Error creating user.");
  }

  const verificationToken = createToken(16, "base64url");
  const verificationTokenId = await upsertVerificationToken(
    userId,
    verificationToken,
  );

  if (!verificationTokenId) {
    return internalServerError(
      response,
      "Error creating account verification token.",
    );
  }

  const emailSent = await sendAccountVerificationEmail(
    email,
    verificationToken,
  );

  if (!emailSent) {
    return internalServerError(
      response,
      "Error sending account verification email.",
    );
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

router.post(
  "/verify/resend",
  AuthenticationMiddleware,
  async (request, response) => {
    const session = request.session as AuthenticatedSession;
    const userId = Number.parseInt(session.userId);
    const user = await getUserById(userId);

    if (!user) {
      return unauthorized(response);
    }

    const verificationToken = createToken(16, "base64url");
    const verificationTokenId = await upsertVerificationToken(
      userId,
      verificationToken,
    );

    if (!verificationTokenId) {
      return internalServerError(
        response,
        "Error creating account verification token.",
      );
    }

    const emailSent = await sendAccountVerificationEmail(
      user.email,
      verificationToken,
    );

    if (!emailSent) {
      return internalServerError(
        response,
        "Error sending account verification email.",
      );
    }

    return response.json(emailSent);
  },
);

router.get(
  "/verify/:token",
  AuthenticationMiddleware,
  async (request, response) => {
    const session = request.session as AuthenticatedSession;
    const userId = Number.parseInt(session.userId);
    const token = request.params.token;
    const [tokenValue, tokenSignature] = token.split(".");
    const verified = verifySignature(tokenValue, tokenSignature, "base64url");

    if (!verified) {
      return badRequest(response, "Verification token is invalid.");
    }

    const updated = await updateUserById(userId, {
      verified_at: database.fn.now(),
    });

    if (!updated) {
      return internalServerError(response, "Error updating user account.");
    }

    await deleteVerificationTokenByUserId(userId);
    return response.json(true);
  },
);

export default router;

// Local types

interface RegistrationBody {
  email: string;
  password: string;
  passwordConfirmation: string;
}
