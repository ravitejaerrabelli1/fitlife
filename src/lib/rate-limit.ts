import { get, run } from "./db";

export interface AttemptLimit {
  max: number;
  windowMs: number;
}

export const SIGN_IN_LIMIT: AttemptLimit = { max: 5, windowMs: 15 * 60_000 };
export const RESET_REQUEST_LIMIT: AttemptLimit = { max: 3, windowMs: 60 * 60_000 };

const RETENTION_MS = 24 * 60 * 60_000;

/** Milliseconds until another attempt is allowed for `key`; 0 when allowed now. */
export function retryAfterMs(key: string, limit: AttemptLimit, now = Date.now()): number {
  const row = get<{ count: number; oldest: string | null }>(
    "SELECT COUNT(*) AS count, MIN(created_at) AS oldest FROM auth_attempts WHERE key = ? AND created_at > ?",
    [key, new Date(now - limit.windowMs).toISOString()],
  );
  if (!row || row.count < limit.max || !row.oldest) return 0;
  return Math.max(1, new Date(row.oldest).getTime() + limit.windowMs - now);
}

export function recordAttempt(key: string, now = Date.now()): void {
  run("DELETE FROM auth_attempts WHERE created_at < ?", [
    new Date(now - RETENTION_MS).toISOString(),
  ]);
  run("INSERT INTO auth_attempts (key, created_at) VALUES (?, ?)", [
    key,
    new Date(now).toISOString(),
  ]);
}

export function clearAttempts(key: string): void {
  run("DELETE FROM auth_attempts WHERE key = ?", [key]);
}

export function minutesUntil(ms: number): number {
  return Math.max(1, Math.ceil(ms / 60_000));
}
