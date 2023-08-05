import { database } from "./database.js";
import { User, UserWithoutPassword } from "./types.js";

/**
 * Gets a user by their username (excluding their password).
 * @param username The username to look up.
 * @param includePassword If `false`, omits the user's password hash.
 * @returns A `User` if found, otherwise `null`.
 */
export async function getUserByUsername(
  username: string,
): Promise<UserWithoutPassword | null>;
export async function getUserByUsername(
  username: string,
  includePassword: true,
): Promise<User | null>;
export async function getUserByUsername(
  username: string,
  includePassword: false,
): Promise<UserWithoutPassword | null>;
export async function getUserByUsername(
  username: string,
  includePassword: boolean = false,
): Promise<User | null> {
  const columns = [
    "id",
    "username",
    "last_activity_at",
    "created_at",
    "updated_at",
  ];

  if (includePassword) {
    columns.push("password");
  }

  try {
    return await database
      .from("users")
      .where({ username })
      .first<User>(...columns);
  } catch (error) {
    console.error(error);
    return null;
  }
}

/**
 * Gets a user by their ID (excluding their password).
 * @param id The ID to look up
 * @param includePassword If `false`, omits the user's password hash.
 * @returns A `User` if found, otherwise `null`.
 */
export async function getUserById(
  id: number,
): Promise<UserWithoutPassword | null>;
export async function getUserById(
  id: number,
  includePassword: true,
): Promise<User | null>;
export async function getUserById(
  id: number,
  includePassword: false,
): Promise<UserWithoutPassword | null>;
export async function getUserById(
  id: number,
  includePassword: boolean = false,
): Promise<User | null> {
  const columns = [
    "id",
    "username",
    "last_activity_at",
    "created_at",
    "updated_at",
  ];

  if (includePassword) {
    columns.push("password");
  }

  try {
    const user = await database
      .from("users")
      .where({ id })
      .first<User>(...columns);
    return user ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

/**
 * Creates a new user in the database.
 * @param username The new user's username.
 * @param password The new user's hashed password.
 * @returns The new user's row ID if successful, otherwise `0`.
 */
export async function createUser(
  username: string,
  password: string,
): Promise<number> {
  try {
    let id = 0;

    await database.transaction(async (trx) => {
      const rows = await trx
        .insert({ username, password })
        .into("users")
        .returning("id");
      id = rows[0].id;
    });

    return id;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

/**
 * Updates a single user.
 * @param id The ID of the user to update
 * @param values The values to update
 * @returns `true` if successful
 */
export async function updateUserById(
  id: number,
  values: Partial<User>,
): Promise<boolean> {
  try {
    let updated = 0;

    await database.transaction(async (trx) => {
      updated = await trx
        .table("users")
        .update({ ...values, updated_at: trx.fn.now() })
        .where({ id });
    });

    return !!updated;
  } catch (error) {
    console.error(error);
    return false;
  }
}

/**
 * Deletes a single user.
 * @param id The ID of the user to delete
 * @returns `true` if successful
 */
export async function deleteUserById(id: number): Promise<boolean> {
  try {
    let deleted = 0;

    await database.transaction(async (trx) => {
      deleted = await trx.table("users").delete().where({ id });
    });

    return !!deleted;
  } catch (error) {
    console.error(error);
    return false;
  }
}

/**
 * Sets the last activity date for a user to the current timestamp.
 * @param id The ID of the user to update
 * @returns `true` if successful
 */
export async function updateUserActivity(id: number): Promise<boolean> {
  try {
    let updated = 0;

    await database.transaction(async (trx) => {
      updated = await trx
        .table("users")
        .update({ last_activity_at: trx.fn.now() })
        .where({ id });
    });

    return !!updated;
  } catch (error) {
    console.error(error);
    return false;
  }
}
