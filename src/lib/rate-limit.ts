import { get, getDb, run } from "./db";

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

/**
 * Atomically checks the limit and, if allowed, records the attempt before any slow work
 * (e.g. password hashing) so concurrent requests can't all slip under the limit.
 * Returns 0 when the attempt was recorded, otherwise ms until one is allowed.
 */
export function takeAttempt(key: string, limit: AttemptLimit, now = Date.now()): number {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const wait = retryAfterMs(key, limit, now);
    if (wait === 0) recordAttempt(key, now);
    db.exec("COMMIT");
    return wait;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function clearAttempts(key: string): void {
  run("DELETE FROM auth_attempts WHERE key = ?", [key]);
}

export function minutesUntil(ms: number): number {
  return Math.max(1, Math.ceil(ms / 60_000));
}
