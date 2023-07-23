import bcrypt from "bcrypt";
import { Buffer } from "buffer";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

/** Salt rounds used for bcrypt password hashing. */
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Generates a cryptographically secure password hash.
 * @param password The password to hash.
 * @returns The hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Verifies that a password matches the provided hash.
 * @param password The plaintext password.
 * @param passwordhash The password hash to compare against.
 * @returns `true` if the password is valid.
 */
export async function verifyPassword(
  password: string,
  passwordhash: string,
): Promise<boolean> {
  return await bcrypt.compare(password, passwordhash);
}

/**
 * Creates a cryptographically secure token.
 * @param length The length of random bytes for the token.
 * @param encoding The output encoding for the token.
 * @returns The encoded token.
 */
export function createToken(
  length = 16,
  encoding: "hex" | "base64url" = "hex",
): string {
  return randomBytes(length).toString(encoding);
}

/**
 * Creates a signature from a value.
 * @param value The value to sign
 * @param encoding The output encoding for the signature.
 * @returns A base64url-encoded signature
 */
export function createSignature(
  value: string,
  encoding: "hex" | "base64url" = "hex",
): string {
  const secretKey = process.env.SECRET_KEY;

  if (!secretKey) {
    throw new Error("SECRET_KEY not set");
  }

  return createHmac("sha256", secretKey).update(value).digest(encoding);
}

/**
 * Verifies a signed value's signature.
 * @param value The value that was signed
 * @param signature The value's signature
 * @param encoding The encoding of the signature.
 * @returns `true` if the signature is valid
 */
export function verifySignature(
  value: string,
  signature: string,
  encoding: "hex" | "base64url" = "hex",
): boolean {
  const signedValue = createSignature(value, encoding);
  return safeEqual(signedValue, signature);
}

/**
 * Performs timing safe comparison of two strings.
 * @param valueA First value to compare.
 * @param valueB Second value to compare.
 * @returns `true` if equal
 */
export function safeEqual(valueA: string, valueB: string): boolean {
  return timingSafeEqual(Buffer.from(valueA), Buffer.from(valueB));
}
