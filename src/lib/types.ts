import { Knex } from "knex";

export interface AccountVerificationToken {
  id: number;
  user_id: number;
  token: string;
  created_at: Date;
  updated_at: Date;
}

export type AuthenticatedSession =
  CookieSessionInterfaces.CookieSessionObject & { userId: string };

export interface User {
  id: number;
  email: string;
  password: string;
  verified_at: Date | null | Knex.Raw;
  created_at: Date;
  updated_at: Date;
}

export type UserWithoutPassword = Pick<
  User,
  "id" | "email" | "verified_at" | "created_at" | "updated_at"
>;
