export interface AccountVerificationToken {
  id: number;
  user_id: number;
  token: string;
  created_at: Date;
  updated_at: Date;
}

export type AuthenticatedSession =
  CookieSessionInterfaces.CookieSessionObject & { userId: string };

export interface Goal {
  id: number;
  user_id: number;
  description: string;
  accomplished: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: number;
  username: string;
  password: string;
  last_activity_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type UserWithoutPassword = Pick<
  User,
  "id" | "username" | "created_at" | "updated_at"
>;
