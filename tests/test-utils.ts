import supertest from "supertest";
import { app } from "../src/app.js";
import { hashPassword } from "../src/lib/crypto.js";
import { createUser } from "../src/lib/users.js";

/**
 * Creates and logs in a test user.
 * @param username The username to use
 * @param password The password to use
 * @returns session cookie
 */
export async function logInUser(
  username: string,
  password: string,
): Promise<string[]> {
  await createUser(username, await hashPassword(password));
  const loginResponse = await supertest(app)
    .post("/auth/login")
    .send({ username, password });
  return loginResponse.get("Set-Cookie");
}
