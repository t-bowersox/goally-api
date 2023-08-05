import { jobLogger } from "../jobs/job-logger.js";
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

      jobLogger.info(`Deleted ${deleted} records.`);
    } catch (error) {
      jobLogger.error(error);
      exitStatus = 1;
    }
  });

  return exitStatus;
}
