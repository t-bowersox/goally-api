import express from "express";
import { verifyPassword } from "../lib/crypto.js";
import { unauthorized } from "../lib/responses.js";
import { getUserByEmail } from "../lib/users.js";

const router = express.Router();

router.post("/login", async (request, response) => {
  const { email, password } = request.body as LoginBody;

  if (!email || !password) {
    return unauthorized(response);
  }

  const user = await getUserByEmail(email, true);

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

export default router;

// Local types

interface LoginBody {
  email: string;
  password: string;
}
