import { createLogger, format, transports } from "winston";

const productionLogger = createLogger({
  level: "warn",
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.json(),
  ),
  transports: [new transports.Console()],
});

const developmentLogger = createLogger({
  level: "debug",
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.json(),
    format.prettyPrint(),
  ),
  transports: [new transports.Console()],
});

export default process.env.NODE_ENV === "production"
  ? productionLogger
  : developmentLogger;
