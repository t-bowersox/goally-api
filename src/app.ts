import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { credentialsMiddleware } from "./middleware/credentials.js";
import { csrfMiddleware } from "./middleware/csrf.js";
import authRouter from "./routers/auth.js";
import goalsRouter from "./routers/goals.js";
import rootRouter from "./routers/root.js";
import userRouter from "./routers/user.js";

export const app = express();
const env = process.env.NODE_ENV;
const secretKey = process.env.SECRET_KEY;

if (!secretKey) {
  throw new Error("SECRET_KEY is not set.");
}

app.use(helmet());
app.use(cookieParser(secretKey));

if (env !== "test") {
  app.use(morgan(env === "development" ? "dev" : "combined"));
  app.use(csrfMiddleware);
  app.use(
    cors({
      origin: env === "development" ? "*" : /\.goally\.app$/,
      credentials: true,
    }),
  );
}

app.use(
  cookieSession({
    name: "goally-session",
    secret: secretKey,
    sameSite: "strict",
    secure: env === "production",
    httpOnly: true,
    signed: env !== "test",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in ms
    domain: process.env.APP_DOMAIN,
  }),
);
app.use(bodyParser.json());
app.use(credentialsMiddleware);

app.use("/", rootRouter);
app.use("/user", userRouter);
app.use("/auth", authRouter);
app.use("/goals", goalsRouter);
