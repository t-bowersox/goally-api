import supertest from "supertest";
import { beforeAll, describe, expect, test } from "vitest";
import { app } from "../src/app.js";
import { createSignature, createToken } from "../src/lib/crypto.js";
import { csrfMiddleware } from "../src/middleware/csrf.js";

describe("/csrf-token", () => {
  test("sets a token in a cookie", async () => {
    const response = await supertest(app).get("/csrf-token");
    expect(response.statusCode).toBe(204);
    expect(
      response.get("Access-Control-Allow-Credentials").includes("true"),
    ).toBe(true);

    const [csrfCookie] = response.get("Set-Cookie");
    expect(csrfCookie.startsWith("XSRF-TOKEN")).toBe(true);
    expect(csrfCookie.includes("SameSite=Strict")).toBe(true);
    expect(csrfCookie.includes("Domain=localhost")).toBe(true);
  });
});

describe("CSRF middleware", () => {
  let csrfToken: string;

  beforeAll(() => {
    app.use(csrfMiddleware);
    app.get("/test", (request, response) => response.sendStatus(204));
    app.post("/test", (request, response) => response.sendStatus(204));
    app.put("/test", (request, response) => response.sendStatus(204));
    app.patch("/test", (request, response) => response.sendStatus(204));
    app.delete("/test", (request, response) => response.sendStatus(204));
    app.options("/test", (request, response) => response.sendStatus(204));

    const token = createToken();
    const signature = createSignature(token);
    csrfToken = `${token}.${signature}`;
  });

  test("skips GET requests", async () => {
    const response = await supertest(app).get("/test");
    expect(response.statusCode).toBe(204);
  });

  test("skips OPTIONS requests", async () => {
    const response = await supertest(app).options("/test");
    expect(response.statusCode).toBe(204);
  });

  test("returns 400 if header token is missing in guarded routes", async () => {
    const postResponse = await supertest(app)
      .post("/test")
      .set("Cookie", `XSRF-TOKEN=${csrfToken}`);
    expect(postResponse.statusCode).toBe(400);

    const putResponse = await supertest(app)
      .put("/test")
      .set("Cookie", `XSRF-TOKEN=${csrfToken}`);
    expect(putResponse.statusCode).toBe(400);

    const patchResponse = await supertest(app)
      .patch("/test")
      .set("Cookie", `XSRF-TOKEN=${csrfToken}`);
    expect(patchResponse.statusCode).toBe(400);

    const deleteResponse = await supertest(app)
      .delete("/test")
      .set("Cookie", `XSRF-TOKEN=${csrfToken}`);
    expect(deleteResponse.statusCode).toBe(400);
  });

  test("returns 400 if cookie token is missing in guarded routes", async () => {
    const postResponse = await supertest(app)
      .post("/test")
      .set("X-XSRF-TOKEN", csrfToken);
    expect(postResponse.statusCode).toBe(400);

    const putResponse = await supertest(app)
      .put("/test")
      .set("X-XSRF-TOKEN", csrfToken);
    expect(putResponse.statusCode).toBe(400);

    const patchResponse = await supertest(app)
      .patch("/test")
      .set("X-XSRF-TOKEN", csrfToken);
    expect(patchResponse.statusCode).toBe(400);

    const deleteResponse = await supertest(app)
      .delete("/test")
      .set("X-XSRF-TOKEN", csrfToken);
    expect(deleteResponse.statusCode).toBe(400);
  });

  test("returns 400 if header token is unsigned", async () => {
    const postResponse = await supertest(app)
      .post("/test")
      .set("X-XSRF-TOKEN", "token")
      .set("Cookie", `XSRF-TOKEN=${csrfToken}`);
    expect(postResponse.statusCode).toBe(400);

    const putResponse = await supertest(app)
      .put("/test")
      .set("X-XSRF-TOKEN", "token")
      .set("Cookie", `XSRF-TOKEN=${csrfToken}`);
    expect(putResponse.statusCode).toBe(400);

    const patchResponse = await supertest(app)
      .patch("/test")
      .set("X-XSRF-TOKEN", "token")
      .set("Cookie", `XSRF-TOKEN=${csrfToken}`);
    expect(patchResponse.statusCode).toBe(400);

    const deleteResponse = await supertest(app)
      .delete("/test")
      .set("X-XSRF-TOKEN", "token")
      .set("Cookie", `XSRF-TOKEN=${csrfToken}`);
    expect(deleteResponse.statusCode).toBe(400);
  });

  test("returns 400 if cookie token is unsigned", async () => {
    const postResponse = await supertest(app)
      .post("/test")
      .set("X-XSRF-TOKEN", csrfToken)
      .set("Cookie", "XSRF-TOKEN=token");
    expect(postResponse.statusCode).toBe(400);

    const putResponse = await supertest(app)
      .put("/test")
      .set("X-XSRF-TOKEN", csrfToken)
      .set("Cookie", "XSRF-TOKEN=token");
    expect(putResponse.statusCode).toBe(400);

    const patchResponse = await supertest(app)
      .patch("/test")
      .set("X-XSRF-TOKEN", csrfToken)
      .set("Cookie", "XSRF-TOKEN=token");
    expect(patchResponse.statusCode).toBe(400);

    const deleteResponse = await supertest(app)
      .delete("/test")
      .set("X-XSRF-TOKEN", csrfToken)
      .set("Cookie", "XSRF-TOKEN=token");
    expect(deleteResponse.statusCode).toBe(400);
  });

  test("returns 400 if header signature is invalid", async () => {
    const token = csrfToken.split(".")[0];
    const badSignature = createSignature("wrong", "hex");
    const invalidToken = `${token}.${badSignature}`;

    const postResponse = await supertest(app)
      .post("/test")
      .set("X-XSRF-TOKEN", invalidToken)
      .set("Cookie", `XSRF-TOKEN=${csrfToken}`);
    expect(postResponse.statusCode).toBe(400);

    const putResponse = await supertest(app)
      .put("/test")
      .set("X-XSRF-TOKEN", invalidToken)
      .set("Cookie", `XSRF-TOKEN=${csrfToken}`);
    expect(putResponse.statusCode).toBe(400);

    const patchResponse = await supertest(app)
      .patch("/test")
      .set("X-XSRF-TOKEN", invalidToken)
      .set("Cookie", `XSRF-TOKEN=${csrfToken}`);
    expect(patchResponse.statusCode).toBe(400);

    const deleteResponse = await supertest(app)
      .delete("/test")
      .set("X-XSRF-TOKEN", invalidToken)
      .set("Cookie", `XSRF-TOKEN=${csrfToken}`);
    expect(deleteResponse.statusCode).toBe(400);
  });

  test("returns 400 if cookie signature is invalid", async () => {
    const token = csrfToken.split(".")[0];
    const badSignature = createSignature("wrong");
    const invalidToken = `${token}.${badSignature}`;

    const postResponse = await supertest(app)
      .post("/test")
      .set("X-XSRF-TOKEN", csrfToken)
      .set("Cookie", `XSRF-TOKEN=${invalidToken}`);
    expect(postResponse.statusCode).toBe(400);

    const putResponse = await supertest(app)
      .put("/test")
      .set("X-XSRF-TOKEN", csrfToken)
      .set("Cookie", `XSRF-TOKEN=${invalidToken}`);
    expect(putResponse.statusCode).toBe(400);

    const patchResponse = await supertest(app)
      .patch("/test")
      .set("X-XSRF-TOKEN", csrfToken)
      .set("Cookie", `XSRF-TOKEN=${invalidToken}`);
    expect(patchResponse.statusCode).toBe(400);

    const deleteResponse = await supertest(app)
      .delete("/test")
      .set("X-XSRF-TOKEN", csrfToken)
      .set("Cookie", `XSRF-TOKEN=${invalidToken}`);
    expect(deleteResponse.statusCode).toBe(400);
  });

  test("returns 400 if header & cookie tokens do not match", async () => {
    const token = createToken();
    const signature = createSignature(token);
    const invalidToken = `${token}.${signature}`;

    const postResponse = await supertest(app)
      .post("/test")
      .set("X-XSRF-TOKEN", csrfToken)
      .set("Cookie", `XSRF-TOKEN=${invalidToken}`);
    expect(postResponse.statusCode).toBe(400);

    const putResponse = await supertest(app)
      .put("/test")
      .set("X-XSRF-TOKEN", csrfToken)
      .set("Cookie", `XSRF-TOKEN=${invalidToken}`);
    expect(putResponse.statusCode).toBe(400);

    const patchResponse = await supertest(app)
      .patch("/test")
      .set("X-XSRF-TOKEN", csrfToken)
      .set("Cookie", `XSRF-TOKEN=${invalidToken}`);
    expect(patchResponse.statusCode).toBe(400);

    const deleteResponse = await supertest(app)
      .delete("/test")
      .set("X-XSRF-TOKEN", csrfToken)
      .set("Cookie", `XSRF-TOKEN=${invalidToken}`);
    expect(deleteResponse.statusCode).toBe(400);
  });

  test("advances request if tokens are valid and match", async () => {
    const postResponse = await supertest(app)
      .post("/test")
      .set("X-XSRF-TOKEN", csrfToken)
      .set("Cookie", `XSRF-TOKEN=${csrfToken}`);
    expect(postResponse.statusCode).toBe(204);

    const putResponse = await supertest(app)
      .put("/test")
      .set("X-XSRF-TOKEN", csrfToken)
      .set("Cookie", `XSRF-TOKEN=${csrfToken}`);
    expect(putResponse.statusCode).toBe(204);

    const patchResponse = await supertest(app)
      .patch("/test")
      .set("X-XSRF-TOKEN", csrfToken)
      .set("Cookie", `XSRF-TOKEN=${csrfToken}`);
    expect(patchResponse.statusCode).toBe(204);

    const deleteResponse = await supertest(app)
      .delete("/test")
      .set("X-XSRF-TOKEN", csrfToken)
      .set("Cookie", `XSRF-TOKEN=${csrfToken}`);
    expect(deleteResponse.statusCode).toBe(204);
  });
});
