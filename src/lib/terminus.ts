import { database } from "./database.js";
import logger from "./logger.js";

/**
 * Executes cleanup actions for graceful shutdown.
 */
export async function onSignal(): Promise<void> {
  try {
    await database.destroy();
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Executes a health check for the server.
 * @returns true
 */
export async function healthCheck(): Promise<boolean> {
  const dbPing = await database.table("users").whereNotNull("id").first("id");
  return !!dbPing;
}
