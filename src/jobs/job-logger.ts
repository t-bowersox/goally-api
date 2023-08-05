import { createLogger, format, transports } from "winston";

export const jobLogger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.json(),
  ),
  transports: [new transports.Console()],
});
