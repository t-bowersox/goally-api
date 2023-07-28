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
  const columns = ["id", "username", "created_at", "updated_at"];

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
  const columns = ["id", "username", "created_at", "updated_at"];

  if (includePassword) {
    columns.push("password");
  }

  try {
    return await database
      .from("users")
      .where({ id })
      .first<User>(...columns);
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
 * Updates a user by their ID.
 * @param id The ID of the user to update
 * @param values The values to update
 * @returns The number of updated rows
 */
export async function updateUserById(
  id: number,
  values: Partial<User>,
): Promise<number> {
  try {
    let updated = 0;

    await database.transaction(async (trx) => {
      updated = await trx.table("users").update(values).where({ id });
    });

    return updated;
  } catch (error) {
    console.error(error);
    return 0;
  }
}
