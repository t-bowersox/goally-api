import { database } from "./database.js";
import { User, UserWithoutPassword } from "./types.js";

/**
 * Gets a user by their email address (excluding their password).
 * @param email The email to look up.
 * @param includePassword If `false`, omits the user's password hash.
 * @returns A `User` if found, otherwise `null`.
 */
export async function getUserByEmail(
  email: string,
): Promise<UserWithoutPassword | null>;
export async function getUserByEmail(
  email: string,
  includePassword: true,
): Promise<User | null>;
export async function getUserByEmail(
  email: string,
  includePassword: false,
): Promise<UserWithoutPassword | null>;
export async function getUserByEmail(
  email: string,
  includePassword: boolean = false,
): Promise<User | null> {
  const columns = ["id", "email", "verified_at", "created_at", "updated_at"];

  if (includePassword) {
    columns.push("password");
  }

  try {
    return await database
      .from("users")
      .where({ email })
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
  const columns = ["id", "email", "verified_at", "created_at", "updated_at"];

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
 * @param email The new user's email.
 * @param password The new user's hashed password.
 * @returns The new user's row ID if successful, otherwise `0`.
 */
export async function createUser(
  email: string,
  password: string,
): Promise<number> {
  try {
    let id = 0;

    await database.transaction(async (trx) => {
      const ids = await trx.insert({ email, password }).into("users");
      id = ids[0];
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
