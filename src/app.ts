import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { csrfMiddleware } from "./middleware/csrf.js";
import authRouter from "./routers/auth.js";
import goalsRouter from "./routers/goals.js";
import rootRouter from "./routers/root.js";
import userRouter from "./routers/user.js";

export const app = express();

const secretKey = process.env.SECRET_KEY;

if (!secretKey) {
  throw new Error("SECRET_KEY is not set.");
}

app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(helmet());
app.use(cookieParser(secretKey));
app.use(csrfMiddleware);
app.use(
  cookieSession({
    name: "goally-session",
    secret: secretKey,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    signed: process.env.NODE_ENV !== "testing",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in ms
  }),
);
app.use(bodyParser.json());

app.use("/", rootRouter);
app.use("/user", userRouter);
app.use("/auth", authRouter);
app.use("/goals", goalsRouter);
