import { database } from "./database.js";
import logger from "./logger.js";
import { Goal } from "./types.js";

/**
 * Creates a new goal.
 * @param userId The ID of the user this goal belongs to.
 * @param description The goal's description
 * @returns The goal's ID if successfull, otherwise `0`
 */
export async function createGoal(
  userId: number,
  description: string,
): Promise<number> {
  try {
    let id = 0;

    await database.transaction(async (trx) => {
      const rows = await trx
        .table<Goal>("goals")
        .insert({ user_id: userId, description })
        .returning("id");
      id = rows[0].id;
    });

    return id;
  } catch (error) {
    logger.error(error);
    return 0;
  }
}

/**
 * Gets all goals for a user.
 * @param userId The ID of the user who owns the goals
 * @returns
 */
export async function getGoalsByUserId(userId: number): Promise<Goal[]> {
  try {
    let goals: Goal[] = [];

    await database.transaction(async (trx) => {
      goals = await trx.table("goals").where({ user_id: userId }).select();
    });

    return goals.map((goal) => {
      goal.accomplished = !!goal.accomplished; // Coerce int to bool
      return goal;
    });
  } catch (error) {
    logger.error(error);
    return [];
  }
}

/**
 * Updates a single goal.
 * @param goalId The ID of the goal to updated
 * @param userId The ID of the user who owns the goal (for safety's sake)
 * @param properties The properties to update
 * @returns The number of updated records
 */
export async function updateGoalById(
  goalId: number,
  userId: number,
  properties: Partial<Goal>,
): Promise<number> {
  try {
    let updated = 0;

    await database.transaction(async (trx) => {
      updated = await trx
        .table("goals")
        .where({ id: goalId, user_id: userId })
        .update({ ...properties, updated_at: trx.fn.now() });
    });

    return updated;
  } catch (error) {
    logger.error(error);
    return 0;
  }
}

/**
 * Deletes a single goal.
 * @param goalId The ID of the goal to delete
 * @param userId The ID of the user who owns the goal (for safety's sake)
 * @returns The number of deleted goals
 */
export async function deleteGoalById(
  goalId: number,
  userId: number,
): Promise<number> {
  try {
    let deleted = 0;

    await database.transaction(async (trx) => {
      deleted = await trx
        .table("goals")
        .where({ id: goalId, user_id: userId })
        .delete();
    });

    return deleted;
  } catch (error) {
    logger.error(error);
    return 0;
  }
}
