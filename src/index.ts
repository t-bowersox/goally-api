import { createTerminus } from "@godaddy/terminus";
import "dotenv/config";
import { createServer } from "node:http";
import { app } from "./app.js";
import { healthCheck, onSignal } from "./lib/terminus.js";

const port = Number.parseInt(process.env.API_PORT ?? "3000");
const server = createServer(app);

createTerminus(server, {
  healthChecks: { "/health-check": healthCheck },
  onSignal,
});

server.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
