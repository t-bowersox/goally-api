import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { csrfMiddleware } from "./middleware/csrf.js";
import rootRouter from "./routers/root.js";
import userRouter from "./routers/user.js";

const port = 3000;
const secretKey = process.env.SECRET_KEY;

if (!secretKey) {
  throw new Error("SECRET_KEY is not set.");
}

const app = express();

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(cookieParser(secretKey));
app.use(bodyParser.json());
app.use(csrfMiddleware);
app.use(
  cookieSession({
    name: "goally-session",
    secret: secretKey,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    signed: true,
    maxAge: 2_592_000_000, // 30 days
  }),
);
app.use("/", rootRouter);
app.use("/user", userRouter);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
