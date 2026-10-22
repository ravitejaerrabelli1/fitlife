import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { all, get, getDb, run } from "./db";
import { resetPasswordWithToken } from "./auth";
import {
  RESET_REQUEST_LIMIT,
  SIGN_IN_LIMIT,
  clearAttempts,
  minutesUntil,
  recordAttempt,
  retryAfterMs,
} from "./rate-limit";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fitlife-auth-"));
const NOW = Date.parse("2026-10-09T12:00:00Z");
const MINUTE = 60_000;

beforeAll(() => {
  process.env.DATABASE_FILE = path.join(dir, "test.db");
  globalThis.__fitlifeDb = undefined;
  getDb();
});

afterAll(() => {
  getDb().close();
  globalThis.__fitlifeDb = undefined;
  fs.rmSync(dir, { recursive: true, force: true });
});

beforeEach(() => {
  run("DELETE FROM auth_attempts");
  run("DELETE FROM users");
});

describe("attempt limiting", () => {
  it("allows attempts up to the limit, then blocks until the window passes", () => {
    const key = "signin:qa@example.com";
    for (let i = 0; i < SIGN_IN_LIMIT.max; i += 1) {
      expect(retryAfterMs(key, SIGN_IN_LIMIT, NOW + i * MINUTE)).toBe(0);
      recordAttempt(key, NOW + i * MINUTE);
    }
    const wait = retryAfterMs(key, SIGN_IN_LIMIT, NOW + 5 * MINUTE);
    expect(wait).toBe(10 * MINUTE);
    expect(minutesUntil(wait)).toBe(10);
    expect(retryAfterMs(key, SIGN_IN_LIMIT, NOW + 15 * MINUTE - 1)).toBeGreaterThan(0);
    expect(retryAfterMs(key, SIGN_IN_LIMIT, NOW + 15 * MINUTE)).toBe(0);
  });

  it("keeps keys independent and clears on success", () => {
    for (let i = 0; i < SIGN_IN_LIMIT.max; i += 1) recordAttempt("signin:a@example.com", NOW);
    expect(retryAfterMs("signin:a@example.com", SIGN_IN_LIMIT, NOW)).toBeGreaterThan(0);
    expect(retryAfterMs("signin:b@example.com", SIGN_IN_LIMIT, NOW)).toBe(0);
    expect(retryAfterMs("reset:a@example.com", RESET_REQUEST_LIMIT, NOW)).toBe(0);
    clearAttempts("signin:a@example.com");
    expect(retryAfterMs("signin:a@example.com", SIGN_IN_LIMIT, NOW)).toBe(0);
  });

  it("limits reset requests to 3 per hour", () => {
    const key = "reset:qa@example.com";
    for (let i = 0; i < 3; i += 1) recordAttempt(key, NOW);
    expect(retryAfterMs(key, RESET_REQUEST_LIMIT, NOW + 59 * MINUTE)).toBeGreaterThan(0);
    expect(retryAfterMs(key, RESET_REQUEST_LIMIT, NOW + 60 * MINUTE)).toBe(0);
  });

  it("prunes attempts older than a day", () => {
    recordAttempt("signin:old@example.com", NOW - 25 * 60 * MINUTE);
    recordAttempt("signin:new@example.com", NOW);
    expect(all<{ key: string }>("SELECT key FROM auth_attempts")).toEqual([
      { key: "signin:new@example.com" },
    ]);
  });
});

describe("resetPasswordWithToken", () => {
  function seed() {
    for (const id of ["u1", "u2"]) {
      run(
        "INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, 'old', 'user', '2026-01-01')",
        [id, `${id}@example.com`],
      );
    }
    const future = new Date(NOW + 30 * MINUTE).toISOString();
    for (const [token, user] of [
      ["s1", "u1"],
      ["s2", "u1"],
      ["s3", "u2"],
    ]) {
      run("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, '2026-01-01', ?)", [
        token,
        user,
        future,
      ]);
    }
    run("INSERT INTO password_resets (token, user_id, created_at, expires_at) VALUES ('good', 'u1', '2026-01-01', ?)", [
      future,
    ]);
    run("INSERT INTO password_resets (token, user_id, created_at, expires_at) VALUES ('stale', 'u1', '2026-01-01', ?)", [
      new Date(NOW - MINUTE).toISOString(),
    ]);
  }

  const passwordOf = (id: string) =>
    get<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", [id])?.password_hash;
  const sessionsOf = (id: string) =>
    all<{ token: string }>("SELECT token FROM sessions WHERE user_id = ? ORDER BY token", [id]).map(
      (row) => row.token,
    );

  it("updates the password and signs the user out on every device", () => {
    seed();
    expect(resetPasswordWithToken("good", "new-hash", NOW)).toEqual({
      userId: "u1",
      email: "u1@example.com",
    });
    expect(passwordOf("u1")).toBe("new-hash");
    expect(sessionsOf("u1")).toEqual([]);
    expect(sessionsOf("u2")).toEqual(["s3"]);
    expect(passwordOf("u2")).toBe("old");
  });

  it("rejects reused, expired and unknown tokens without side effects", () => {
    seed();
    expect(resetPasswordWithToken("good", "first", NOW)).not.toBeNull();
    run("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES ('s4', 'u1', '2026-01-01', '2099-01-01')");

    expect(resetPasswordWithToken("good", "second", NOW)).toBeNull();
    expect(resetPasswordWithToken("stale", "third", NOW)).toBeNull();
    expect(resetPasswordWithToken("missing", "fourth", NOW)).toBeNull();
    expect(passwordOf("u1")).toBe("first");
    expect(sessionsOf("u1")).toEqual(["s4"]);
  });
});
