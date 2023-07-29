import supertest from "supertest";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
import { app } from "../src/app.js";
import { hashPassword, verifyPassword } from "../src/lib/crypto.js";
import { database } from "../src/lib/database.js";
import { createUser, getUserByUsername } from "../src/lib/users.js";
import { logInUser } from "./test-utils.js";

describe("/user", () => {
  const username = "foobar";
  const password = "password";

  beforeAll(async () => {
    await database.migrate.latest();
  });

  afterAll(async () => {
    await database.migrate.rollback(undefined, true);
  });

  afterEach(async () => {
    await database.table("users").delete();
  });

  describe("POST", () => {
    let body: Record<string, string>;

    beforeEach(() => {
      body = {
        username,
        password,
        passwordConfirmation: password,
      };
    });

    test("returns 422 if username is missing", async () => {
      delete body.username;
      const response = await supertest(app).post("/user").send(body);

      expect(response.statusCode).toBe(422);
      expect(response.body.name).toBe("username");
      expect(response.body.reason).toBe(
        "A username of 50 characters or less is required.",
      );
    });

    test("returns 422 if username is greater than 50 characters", async () => {
      body.username = "foo".padEnd(51, "o");
      const response = await supertest(app).post("/user").send(body);

      expect(response.statusCode).toBe(422);
      expect(response.body.name).toBe("username");
      expect(response.body.reason).toBe(
        "A username of 50 characters or less is required.",
      );
    });

    test("returns 422 if username is already taken", async () => {
      await supertest(app).post("/user").send(body);
      const response = await supertest(app).post("/user").send(body);

      expect(response.statusCode).toBe(422);
      expect(response.body.name).toBe("username");
      expect(response.body.reason).toBe("foobar is unavailable.");
    });

    test("returns 422 if password is missing", async () => {
      delete body.password;
      await supertest(app).post("/user").send(body);
      const response = await supertest(app).post("/user").send(body);

      expect(response.statusCode).toBe(422);
      expect(response.body.name).toBe("password");
      expect(response.body.reason).toBe(
        "A password of 8 or more characters is required.",
      );
    });

    test("returns 422 if password is less than 8 characters", async () => {
      body.password = "short";
      await supertest(app).post("/user").send(body);
      const response = await supertest(app).post("/user").send(body);

      expect(response.statusCode).toBe(422);
      expect(response.body.name).toBe("password");
      expect(response.body.reason).toBe(
        "A password of 8 or more characters is required.",
      );
    });

    test("returns 422 if password is not confirmed", async () => {
      body.passwordConfirmation = "mismatched";
      await supertest(app).post("/user").send(body);
      const response = await supertest(app).post("/user").send(body);

      expect(response.statusCode).toBe(422);
      expect(response.body.name).toBe("password");
      expect(response.body.reason).toBe("Passwords must match.");
    });

    test("returns true if user is created", async () => {
      const response = await supertest(app).post("/user").send(body);
      expect(response.statusCode).toBe(201);
      expect(response.body).toBe(true);
    });
  });

  describe("GET", () => {
    test("returns null if there is no logged-in user", async () => {
      const response = await supertest(app).get("/user");
      expect(response.statusCode).toBe(200);
      expect(response.body).toBeNull();
    });

    test("returns current user if they are logged in", async () => {
      const sessionCookie = await logInUser(username, password);
      const userResponse = await supertest(app)
        .get("/user")
        .set("Cookie", sessionCookie);

      expect(userResponse.status).toBe(200);
      expect(userResponse.body.username).toBe("foobar");
      expect(userResponse.body.password).toBeUndefined();
      expect(userResponse.get("Cache-Control")).toContain("max-age=0");
    });
  });

  describe("PUT", () => {
    let body: Record<string, string>;

    beforeEach(() => {
      body = {
        currentPassword: password,
        newPassword: "newpassword",
        newPasswordConfirmation: "newpassword",
        username: "barfoo",
      };
    });

    test("returns 401 if user not logged in", async () => {
      const response = await supertest(app).put("/user").send(body);
      expect(response.statusCode).toBe(401);
    });

    test("returns 401 if current password is missing", async () => {
      delete body.currentPassword;
      const sessionCookie = await logInUser(username, password);
      const response = await supertest(app)
        .put("/user")
        .set("Cookie", sessionCookie)
        .send(body);

      expect(response.statusCode).toBe(401);
    });

    test("returns 401 if current password is incorrect", async () => {
      body.currentPassword = "incorrectpassword";
      const sessionCookie = await logInUser(username, password);
      const response = await supertest(app)
        .put("/user")
        .set("Cookie", sessionCookie)
        .send(body);

      expect(response.statusCode).toBe(401);
    });

    test("returns 422 if new username is greater than 50 characters", async () => {
      body.username = "foo".padEnd(51, "o");
      const sessionCookie = await logInUser(username, password);
      const response = await supertest(app)
        .put("/user")
        .set("Cookie", sessionCookie)
        .send(body);

      expect(response.statusCode).toBe(422);
      expect(response.body.name).toBe("username");
      expect(response.body.reason).toBe(
        "A username of 50 characters or less is required.",
      );
    });

    test("returns 422 if new username is unavailable", async () => {
      await createUser("otheruser", await hashPassword(password));
      body.username = "otheruser";
      const sessionCookie = await logInUser(username, password);
      const response = await supertest(app)
        .put("/user")
        .set("Cookie", sessionCookie)
        .send(body);

      expect(response.statusCode).toBe(422);
      expect(response.body.name).toBe("username");
      expect(response.body.reason).toBe("otheruser is unavailable.");
    });

    test("returns 422 if new password is less than 8 characters", async () => {
      body.newPassword = "short";
      body.newPasswordConfirmation = "short";
      const sessionCookie = await logInUser(username, password);
      const response = await supertest(app)
        .put("/user")
        .set("Cookie", sessionCookie)
        .send(body);

      expect(response.statusCode).toBe(422);
      expect(response.body.name).toBe("password");
      expect(response.body.reason).toBe(
        "A password of 8 or more characters is required.",
      );
    });

    test("returns 422 if new password is not confirmed", async () => {
      body.newPasswordConfirmation = "incorrect";
      const sessionCookie = await logInUser(username, password);
      const response = await supertest(app)
        .put("/user")
        .set("Cookie", sessionCookie)
        .send(body);

      expect(response.statusCode).toBe(422);
      expect(response.body.name).toBe("password");
      expect(response.body.reason).toBe("Passwords must match.");
    });

    test("returns 400 if there are no updates", async () => {
      delete body.username;
      delete body.newPassword;
      const sessionCookie = await logInUser(username, password);
      const response = await supertest(app)
        .put("/user")
        .set("Cookie", sessionCookie)
        .send(body);

      expect(response.statusCode).toBe(400);
      expect(response.body.reason).toBe("No updates were provided.");
    });

    test("only updates the user's username if provided", async () => {
      delete body.username;
      const sessionCookie = await logInUser(username, password);
      const unchangedResponse = await supertest(app)
        .put("/user")
        .set("Cookie", sessionCookie)
        .send(body);

      expect(unchangedResponse.statusCode).toBe(200);

      const unchangedUser = await getUserByUsername(username);
      expect(unchangedUser).toBeTruthy();
    });

    test("only updates the user's password if provided", async () => {
      delete body.newPassword;
      const sessionCookie = await logInUser(username, password);
      const response = await supertest(app)
        .put("/user")
        .set("Cookie", sessionCookie)
        .send(body);

      expect(response.statusCode).toBe(200);

      const user = await getUserByUsername(body.username, true);
      expect(user).toBeTruthy();
      await expect(verifyPassword(password, user!.password)).resolves.toBe(
        true,
      );
    });

    test("updates the user's email & password", async () => {
      const sessionCookie = await logInUser(username, password);
      const response = await supertest(app)
        .put("/user")
        .set("Cookie", sessionCookie)
        .send(body);

      expect(response.statusCode).toBe(200);

      const user = await getUserByUsername(body.username, true);
      expect(user).toBeTruthy();
      await expect(
        verifyPassword(body.newPassword, user!.password),
      ).resolves.toBe(true);
    });
  });

  describe("DELETE", () => {
    test("returns 401 if user not logged in", async () => {
      const response = await supertest(app).delete("/user");
      expect(response.statusCode).toBe(401);
    });

    test("returns 401 if password incorrect", async () => {
      const sessionCooke = await logInUser(username, password);
      const response = await supertest(app)
        .delete("/user")
        .set("Cookie", sessionCooke)
        .send({ password: "incorrect" });

      expect(response.status).toBe(401);
    });

    test("returns true if user is deleted", async () => {
      const sessionCooke = await logInUser(username, password);
      const response = await supertest(app)
        .delete("/user")
        .set("Cookie", sessionCooke)
        .send({ password });

      expect(response.status).toBe(200);
      expect(response.body).toBe(true);
    });
  });
});
