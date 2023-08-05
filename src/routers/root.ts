import express from "express";
import { createSignature, createToken } from "../lib/crypto.js";

const router = express.Router();

router.get("/csrf-token", (_request, response) => {
  const token = createToken();
  const signature = createSignature(token);
  const env = process.env.NODE_ENV;

  return response
    .cookie("XSRF-TOKEN", `${token}.${signature}`, {
      sameSite: "strict",
      secure: env === "production",
      domain: env === "production" ? undefined : process.env.APP_DOMAIN,
    })
    .status(204)
    .send();
});

export default router;
