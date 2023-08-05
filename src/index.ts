import { createTerminus } from "@godaddy/terminus";
import "dotenv/config";
import { createServer } from "node:http";
import { app } from "./app.js";
import logger from "./lib/logger.js";
import { healthCheck, onSignal } from "./lib/terminus.js";

const port = Number.parseInt(process.env.API_PORT ?? "3000");
const server = createServer(app);

createTerminus(server, {
  healthChecks: { "/health-check": healthCheck },
  onSignal,
});

server.listen(port, () => {
  logger.info(`App listening on port ${port}`);
});
