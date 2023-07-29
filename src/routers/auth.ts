import express from "express";
import { verifyPassword } from "../lib/crypto.js";
import { unauthorized } from "../lib/responses.js";
import { getUserByUsername } from "../lib/users.js";
import { AuthenticationMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", async (request, response) => {
  const { username, password } = request.body as LoginBody;

  if (!username || !password) {
    return unauthorized(response);
  }

  const user = await getUserByUsername(username, true);

  if (!user) {
    return unauthorized(response);
  }

  const verified = await verifyPassword(password, user.password);

  if (!verified) {
    return unauthorized(response);
  }

  request.session = { userId: user.id };
  return response.json(true);
});

router.get("/logout", AuthenticationMiddleware, (request, response) => {
  request.session = null;
  return response.json(true);
});

export default router;

// Local types

interface LoginBody {
  username?: string;
  password?: string;
}
