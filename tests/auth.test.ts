import supertest from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { app } from "../src/app.js";
import { hashPassword } from "../src/lib/crypto.js";
import { database } from "../src/lib/database.js";
import { createUser } from "../src/lib/users.js";
import { logInUser } from "./test-utils.js";

describe("/auth", () => {
  const username = "foobar";
  const password = "password";

  beforeAll(async () => {
    await database.migrate.latest();
  });

  afterAll(async () => {
    await database.migrate.rollback(undefined, true);
  });

  describe("/login", () => {
    beforeAll(async () => {
      await createUser(username, await hashPassword(password));
    });

    afterAll(async () => {
      await database.table("users").delete();
    });

    test("returns 401 if username is missing", async () => {
      const response = await supertest(app)
        .post("/auth/login")
        .send({ password });

      expect(response.statusCode).toBe(401);
    });

    test("returns 401 if password is missing", async () => {
      const response = await supertest(app)
        .post("/auth/login")
        .send({ username });

      expect(response.statusCode).toBe(401);
    });

    test("returns 401 if user not found", async () => {
      const response = await supertest(app)
        .post("/auth/login")
        .send({ username: "doesnotexist", password });

      expect(response.statusCode).toBe(401);
    });

    test("returns 401 if password incorrect", async () => {
      const response = await supertest(app)
        .post("/auth/login")
        .send({ username, password: "invalid" });

      expect(response.statusCode).toBe(401);
    });

    test("returns true & starts session if login is valid", async () => {
      const response = await supertest(app)
        .post("/auth/login")
        .send({ username, password });

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(true);
      expect(
        response.get("Set-Cookie").find((c) => c.startsWith("goally-session")),
      ).toBeTruthy();
    });
  });

  describe("/logout", async () => {
    test("returns 401 if user not logged in", async () => {
      const response = await supertest(app).get("/auth/logout");
      expect(response.statusCode).toBe(401);
    });

    test("returns true & ends session", async () => {
      const sessionCookie = await logInUser(username, password);
      const response = await supertest(app)
        .get("/auth/logout")
        .set("Cookie", sessionCookie);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(true);
      expect(
        response
          .get("Set-Cookie")
          .find((c) => c.includes("expires=Thu, 01 Jan 1970 00:00:00 GMT")),
      ).toBeTruthy();
    });
  });
});
