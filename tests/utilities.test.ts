import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import { database } from "../src/lib/database";
import {
  createUser,
  getUserById,
  updateUserActivity,
  updateUserById,
} from "../src/lib/users";
import { deleteInactiveUsers } from "../src/lib/utilities";

describe("deleteInactiveUsers", () => {
  beforeAll(async () => {
    await database.migrate.latest();
  });

  afterAll(async () => {
    await database.migrate.rollback(undefined, true);
  });

  afterEach(async () => {
    await database.table("users").delete();
  });

  test("only deletes inactive users", async () => {
    const [id1, id2] = await Promise.all([
      createUser("user1", "password"),
      createUser("user2", "password"),
    ]);

    const updated = await Promise.all([
      updateUserById(id1, {
        last_activity_at: new Date(2023, 0, 1, 0, 0, 0, 0),
      }),
      updateUserActivity(id2),
    ]);

    expect(updated.every((result) => !!result)).toBe(true);

    const exitCode = await deleteInactiveUsers();

    expect(exitCode).toBe(0);
    expect(await getUserById(id1)).toBeNull();
    expect(await getUserById(id2)).toBeTruthy();
  });
});
