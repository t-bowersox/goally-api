import { database } from "./database.js";

export async function deleteInactiveUsers(
  ttlHours: number = 24,
): Promise<number> {
  let exitStatus = 0;

  await database.transaction(async (trx) => {
    const threshold = new Date();
    threshold.setHours(-ttlHours);

    try {
      const deleted = await trx
        .table("users")
        .where("last_activity_at", "<", threshold)
        .delete();

      console.log(`Deleted ${deleted} records.`);
    } catch (error) {
      console.error("Error deleting users!");
      console.error(error);
      exitStatus = 1;
    }
  });

  return exitStatus;
}
