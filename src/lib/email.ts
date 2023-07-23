import nodemailer from "nodemailer";
import { dirname } from "path";
import pug from "pug";
import { fileURLToPath } from "url";
import { createSignature } from "./crypto.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Email input validation as used by WHATWG and Angular.
 * @see {@link https://html.spec.whatwg.org/multipage/input.html#email-state-(type=email)}
 */
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function createEmailTransporter(): nodemailer.Transporter {
  return nodemailer.createTransport(
    {
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    },
    {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    },
  );
}

export async function sendAccountVerificationEmail(
  email: string,
  token: string,
): Promise<boolean> {
  const tokenSignature = createSignature(token, "base64url");
  const verificationLink = `${process.env.APP_URL}/verify-account/${token}.${tokenSignature}`;
  const plainTextMessage = `
    Greetings!
    
    We have receieved a request to create a Goally account with this email address.

    To get started, you must visit the link below to activate your account:

    ${verificationLink}

    If you are no longer interested or did not sign up for this account, you can safely disregard this email.

    Cheers!

    The Goally Email Robot
  `;

  const htmlTemplate = pug.compileFile(
    `${__dirname}/../email-templates/account-verification.pug`,
  );
  const htmlMessage = htmlTemplate({ verificationLink });
  const transporter = createEmailTransporter();

  try {
    await transporter.sendMail({
      to: email,
      subject: "Activate your Goally account",
      text: plainTextMessage,
      html: htmlMessage,
    });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
