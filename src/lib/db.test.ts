import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterAll, describe, expect, it } from "vitest";
import { get, getDb, run } from "./db";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fitlife-db-"));
const file = path.join(dir, "legacy.db");

afterAll(() => {
  getDb().close();
  globalThis.__fitlifeDb = undefined;
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("database migration", () => {
  it("adds profiles.time_zone to an existing database without losing rows", () => {
    const legacy = new DatabaseSync(file);
    legacy.exec(`
      CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user', created_at TEXT NOT NULL);
      CREATE TABLE profiles (user_id TEXT PRIMARY KEY, first_name TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL);
      INSERT INTO users VALUES ('u1', 'qa@example.com', 'x', 'user', '2026-01-01');
      INSERT INTO profiles (user_id, first_name, updated_at) VALUES ('u1', 'QA', '2026-01-01');
    `);
    legacy.close();

    process.env.DATABASE_FILE = file;
    globalThis.__fitlifeDb = undefined;
    getDb();

    const row = get<{ first_name: string; time_zone: string }>(
      "SELECT first_name, time_zone FROM profiles WHERE user_id = ?",
      ["u1"],
    );
    expect(row).toEqual({ first_name: "QA", time_zone: "" });

    run("UPDATE profiles SET time_zone = ? WHERE user_id = ?", ["Asia/Kolkata", "u1"]);
    expect(
      get<{ time_zone: string }>("SELECT time_zone FROM profiles WHERE user_id = ?", ["u1"]),
    ).toEqual({ time_zone: "Asia/Kolkata" });
  });
});
