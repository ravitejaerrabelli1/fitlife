import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDb, run } from "./db";
import { cardioHistory, dailyCalories, NO_LIMIT, recentSteps, workoutHistory } from "./logs";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fitlife-logs-"));

beforeAll(() => {
  process.env.DATABASE_FILE = path.join(dir, "logs.db");
  globalThis.__fitlifeDb = undefined;
  const at = "2026-11-01T00:00:00Z";
  for (const id of ["u1", "u2"]) {
    run("INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, 'x', ?)", [
      id,
      `${id}@example.test`,
      at,
    ]);
  }
  for (const [user, date, steps] of [
    ["u1", "2026-03-08", 4000],
    ["u1", "2026-10-20", 6000],
    ["u1", "2026-11-07", 8000],
    ["u2", "2026-11-07", 9999],
  ] as const) {
    run("INSERT INTO step_logs (id, user_id, date, steps) VALUES (?, ?, ?, ?)", [
      `${user}-${date}`,
      user,
      date,
      steps,
    ]);
  }
  for (const [user, date, calories] of [
    ["u1", "2026-03-08", 777],
    ["u1", "2026-11-06", 500],
    ["u1", "2026-11-06", 300],
    ["u2", "2026-11-06", 1234],
  ] as const) {
    run(
      "INSERT INTO nutrition_logs (id, user_id, date, meal, name, calories, created_at) VALUES (?, ?, ?, 'lunch', 'Food', ?, ?)",
      [`${user}-${date}-${calories}`, user, date, calories, at],
    );
  }
  for (let day = 1; day <= 70; day++) {
    const date = `2026-${day <= 31 ? "08" : day <= 62 ? "09" : "10"}-${String(((day - 1) % 31) + 1).padStart(2, "0")}`;
    run(
      "INSERT INTO workout_sessions (id, user_id, date, name, created_at) VALUES (?, 'u1', ?, 'Push', ?)",
      [`w${day}`, date, at],
    );
    run(
      "INSERT INTO cardio_sessions (id, user_id, date, activity_id, activity_name, minutes, intensity, created_at) VALUES (?, 'u1', ?, 'walk', 'Walk', 30, 'easy', ?)",
      [`c${day}`, date, at],
    );
  }
  run(
    "INSERT INTO workout_sessions (id, user_id, date, name, created_at) VALUES ('old', 'u1', '2025-01-01', 'Pull', ?)",
    [at],
  );
});

afterAll(() => {
  getDb().close();
  globalThis.__fitlifeDb = undefined;
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("progress range queries", () => {
  it("returns only steps on or after the cutoff, oldest first, for that user", () => {
    expect(recentSteps("u1", "2026-10-08")).toEqual([
      { date: "2026-10-20", steps: 6000 },
      { date: "2026-11-07", steps: 8000 },
    ]);
  });

  it("excludes intake older than the cutoff instead of taking the last N logged days", () => {
    expect(dailyCalories("u1", "2026-10-08")).toEqual([
      { date: "2026-11-06", calories: 800, protein_g: 0 },
    ]);
    expect(dailyCalories("u1", "2026-11-07")).toEqual([]);
  });

  it("counts every workout and cardio session in range, beyond the old 60-row cap", () => {
    expect(workoutHistory("u1", NO_LIMIT, "2026-08-01")).toHaveLength(70);
    expect(cardioHistory("u1", NO_LIMIT, "2026-08-01")).toHaveLength(70);
    expect(workoutHistory("u1", NO_LIMIT)).toHaveLength(71);
  });

  it("keeps the default recent-history limit for other pages", () => {
    expect(workoutHistory("u1", 5)).toHaveLength(5);
    expect(cardioHistory("u1")).toHaveLength(60);
  });
});
