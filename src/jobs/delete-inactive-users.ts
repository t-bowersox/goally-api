import "dotenv/config";
import { deleteInactiveUsers } from "../lib/utilities.js";

const exitStatus = await deleteInactiveUsers();
process.exit(exitStatus);
