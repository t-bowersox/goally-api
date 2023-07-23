import { database } from "./database.js";

/**
 * Creates or updates an account verification token for a user in the database.
 * @param userId The ID of the user assigned to this token.
 * @param token The account verification token.
 * @returns The ID of the account verification token if successful, otherwise `0`.
 */
export async function upsertVerificationToken(
  userId: number,
  token: string,
): Promise<number> {
  try {
    let id = 0;

    await database.transaction(async (trx) => {
      const ids = await trx
        .insert({ user_id: userId, token })
        .into("account_verification_tokens")
        .onConflict("user_id")
        .merge();
      id = ids[0];
    });

    return id;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

/**
 * Deletes an account verification token by its user ID.
 * @param userId The ID of the user whose token to delete
 * @returns The number of deleted rows
 */
export async function deleteVerificationTokenByUserId(
  userId: number,
): Promise<number> {
  try {
    let deleted = 0;

    await database.transaction(async (trx) => {
      deleted = await trx
        .table("account_verification_tokens")
        .where({ user_id: userId })
        .delete();
    });

    return deleted;
  } catch (error) {
    console.error(error);
    return 0;
  }
}
