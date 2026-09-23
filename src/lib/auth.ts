import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { get, newId, nowIso, run } from "./db";

export const SESSION_COOKIE = "fitlife_session";
const SESSION_DAYS = 30;

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
}

export interface SessionUser {
  id: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createUser(email: string, passwordHash: string): UserRow {
  const id = newId();
  const role =
    process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.toLowerCase() === email
      ? "admin"
      : "user";
  run(
    "INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
    [id, email, passwordHash, role, nowIso()],
  );
  run(
    "INSERT INTO profiles (user_id, updated_at) VALUES (?, ?)",
    [id, nowIso()],
  );
  return { id, email, password_hash: passwordHash, role, created_at: nowIso() };
}

export function findUserByEmail(email: string): UserRow | undefined {
  return get<UserRow>("SELECT * FROM users WHERE email = ?", [email]);
}

export async function startSession(userId: string): Promise<void> {
  const token = crypto.randomUUID() + crypto.randomUUID().replaceAll("-", "");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  run(
    "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    [token, userId, nowIso(), expires.toISOString()],
  );
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE token = ?", [token]);
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = get<{ id: string; email: string; role: string; expires_at: string }>(
    `SELECT u.id, u.email, u.role, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = ?`,
    [token],
  );
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    run("DELETE FROM sessions WHERE token = ?", [token]);
    return null;
  }
  return { id: row.id, email: row.email, role: row.role };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Not signed in");
  }
}

export function deleteAccount(userId: string): void {
  run("DELETE FROM users WHERE id = ?", [userId]);
}
