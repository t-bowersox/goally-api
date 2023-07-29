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
import { database } from "../src/lib/database.js";
import { createGoal, getGoalsByUserId } from "../src/lib/goals.js";
import { Goal, UserWithoutPassword } from "../src/lib/types.js";
import { getUserByUsername } from "../src/lib/users.js";
import { logInUser } from "./test-utils.js";

describe("/goals", () => {
  const username = "foobar";
  const password = "password";
  let sessionCookie: string[];

  beforeAll(async () => {
    await database.migrate.latest();
    sessionCookie = await logInUser(username, password);
  });

  afterAll(async () => {
    await database.migrate.rollback(undefined, true);
  });

  afterEach(async () => {
    await database.table("goals").delete();
  });

  describe("POST", () => {
    let body: Record<string, string>;

    beforeEach(() => {
      body = { description: "Create a test" };
    });

    test("returns 401 if user not logged in", async () => {
      const response = await supertest(app).post("/goals").send(body);
      expect(response.statusCode).toBe(401);
    });

    test("returns 422 if description is missing", async () => {
      const response = await supertest(app)
        .post("/goals")
        .set("Cookie", sessionCookie)
        .send({});

      expect(response.statusCode).toBe(422);
      expect(response.body.name).toBe("description");
      expect(response.body.reason).toBe("A description is required.");
    });

    test("returns true if goal was created", async () => {
      const response = await supertest(app)
        .post("/goals")
        .set("Cookie", sessionCookie)
        .send(body);

      expect(response.statusCode).toBe(201);
      expect(response.body).toBe(true);
    });
  });

  describe("GET", () => {
    test("returns 401 if user not logged in", async () => {
      const response = await supertest(app).get("/goals");
      expect(response.statusCode).toBe(401);
    });

    test("returns the logged-in user's goals", async () => {
      const user = await getUserByUsername(username);
      await createGoal(user!.id, "Create a test");
      await createGoal(user!.id, "Make the tests pass");
      const response = await supertest(app)
        .get("/goals")
        .set("Cookie", sessionCookie);

      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(2);
      expect(
        response.body.find((g: Goal) => g.description === "Create a test"),
      ).toBeTruthy();
      expect(
        response.body.find(
          (g: Goal) => g.description === "Make the tests pass",
        ),
      ).toBeTruthy();
    });
  });

  describe("PUT", () => {
    let goalId: number;
    let body: Partial<Goal>;
    let user: UserWithoutPassword;

    beforeEach(async () => {
      user = (await getUserByUsername(username)) as UserWithoutPassword;
      goalId = await createGoal(user!.id, "Create a goal");
      body = { description: "Update a goal", accomplished: true };
    });

    test("returns 401 if user not logged in", async () => {
      const response = await supertest(app).put(`/goals/${goalId}`).send(body);
      expect(response.statusCode).toBe(401);
    });

    test("returns 422 if provided description is empty", async () => {
      const response = await supertest(app)
        .put(`/goals/${goalId}`)
        .set("Cookie", sessionCookie)
        .send({ description: "" });

      expect(response.statusCode).toBe(422);
      expect(response.body.name).toBe("description");
      expect(response.body.reason).toBe("A description is required.");
    });

    test("only updates description if it's provided", async () => {
      delete body.description;
      const response = await supertest(app)
        .put(`/goals/${goalId}`)
        .set("Cookie", sessionCookie)
        .send(body);

      expect(response.statusCode).toBe(200);
      const goals = await getGoalsByUserId(user.id);
      expect(goals.find((g) => g.description === "Create a goal")).toBeTruthy();
    });

    test("returns 422 if accomplished is not boolean", async () => {
      const response = await supertest(app)
        .put(`/goals/${goalId}`)
        .set("Cookie", sessionCookie)
        .send({ accomplished: "true" });

      expect(response.statusCode).toBe(422);
      expect(response.body.name).toBe("accomplished");
      expect(response.body.reason).toBe("Accomplished must be a boolean.");
    });

    test("only updates accomplished if it's provided", async () => {
      delete body.accomplished;
      const response = await supertest(app)
        .put(`/goals/${goalId}`)
        .set("Cookie", sessionCookie)
        .send(body);

      expect(response.status).toBe(200);
      const goals = await getGoalsByUserId(user.id);
      expect(goals.find((g) => !g.accomplished)).toBeTruthy();
    });

    test("returns 400 if there are no updates", async () => {
      const response = await supertest(app)
        .put(`/goals/${goalId}`)
        .set("Cookie", sessionCookie)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.reason).toBe("No updates were provided.");
    });

    test("returns true if goal was updated", async () => {
      const response = await supertest(app)
        .put(`/goals/${goalId}`)
        .set("Cookie", sessionCookie)
        .send(body);

      expect(response.status).toBe(200);
      expect(response.body).toBe(true);

      const goals = await getGoalsByUserId(user.id);

      expect(goals.length).toBe(1);
      expect(goals[0].description).toBe(body.description);
      expect(goals[0].accomplished).toBe(body.accomplished);
    });
  });

  describe("DELETE", () => {
    let goalId: number;
    let user: UserWithoutPassword;

    beforeEach(async () => {
      user = (await getUserByUsername(username)) as UserWithoutPassword;
      goalId = await createGoal(user!.id, "Create a goal");
    });

    test("returns 401 if user not logged in", async () => {
      const response = await supertest(app).delete(`/goals/${goalId}`);
      expect(response.statusCode).toBe(401);
    });

    test("returns true if goal was deleted", async () => {
      const response = await supertest(app)
        .delete(`/goals/${goalId}`)
        .set("Cookie", sessionCookie);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(true);

      const goals = await getGoalsByUserId(user.id);
      expect(goals.length).toBe(0);
    });
  });
});
