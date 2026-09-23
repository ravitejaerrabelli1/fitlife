import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS password_resets (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  age INTEGER,
  sex TEXT,
  height_cm REAL,
  weight_kg REAL,
  units TEXT NOT NULL DEFAULT 'metric',
  activity_level TEXT,
  goal TEXT,
  pace TEXT,
  macro_preference TEXT NOT NULL DEFAULT 'balanced',
  body_fat_pct REAL,
  waist_cm REAL,
  neck_cm REAL,
  hip_cm REAL,
  experience TEXT,
  daily_steps INTEGER,
  occupation TEXT,
  sleep_hours REAL,
  workout_days INTEGER,
  workout_minutes INTEGER,
  cardio_days INTEGER,
  equipment TEXT NOT NULL DEFAULT '[]',
  diet_prefs TEXT NOT NULL DEFAULT '[]',
  allergies TEXT NOT NULL DEFAULT '',
  dislikes TEXT NOT NULL DEFAULT '',
  calorie_override INTEGER,
  water_goal_ml INTEGER NOT NULL DEFAULT 2500,
  step_goal INTEGER NOT NULL DEFAULT 8000,
  theme TEXT NOT NULL DEFAULT 'system',
  mode TEXT NOT NULL DEFAULT 'beginner',
  notifications TEXT NOT NULL DEFAULT '{}',
  onboarded INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS weight_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  weight_kg REAL NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS measurements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  waist_cm REAL,
  neck_cm REAL,
  hip_cm REAL,
  chest_cm REAL,
  arm_cm REAL,
  thigh_cm REAL,
  photo_note TEXT NOT NULL DEFAULT '',
  UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS nutrition_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  meal TEXT NOT NULL,
  name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'food',
  servings REAL NOT NULL DEFAULT 1,
  calories REAL NOT NULL,
  protein_g REAL NOT NULL DEFAULT 0,
  carbs_g REAL NOT NULL DEFAULT 0,
  fat_g REAL NOT NULL DEFAULT 0,
  fiber_g REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_foods (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  serving TEXT NOT NULL DEFAULT '1 serving',
  calories REAL NOT NULL,
  protein_g REAL NOT NULL DEFAULT 0,
  carbs_g REAL NOT NULL DEFAULT 0,
  fat_g REAL NOT NULL DEFAULT 0,
  fiber_g REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS water_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  amount_ml REAL NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS step_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  steps INTEGER NOT NULL,
  UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  day_key TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'in_progress',
  duration_min INTEGER,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workout_sets (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  weight_kg REAL NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  rpe REAL,
  completed INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cardio_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  activity_name TEXT NOT NULL,
  minutes INTEGER NOT NULL,
  intensity TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meal_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  days INTEGER NOT NULL,
  calorie_target INTEGER NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS preference_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  value TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nutrition_user_date ON nutrition_logs (user_id, date);
CREATE INDEX IF NOT EXISTS idx_water_user_date ON water_logs (user_id, date);
CREATE INDEX IF NOT EXISTS idx_weight_user_date ON weight_logs (user_id, date);
CREATE INDEX IF NOT EXISTS idx_sets_user_exercise ON workout_sets (user_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON workout_sessions (user_id, date);
CREATE INDEX IF NOT EXISTS idx_cardio_user_date ON cardio_sessions (user_id, date);
`;

declare global {
  var __fitlifeDb: DatabaseSync | undefined;
}

const ADDED_COLUMNS: { table: string; column: string; definition: string }[] = [
  { table: "profiles", column: "cardio_days", definition: "INTEGER" },
];

function migrate(db: DatabaseSync): void {
  for (const { table, column, definition } of ADDED_COLUMNS) {
    const columns = db
      .prepare(`PRAGMA table_info(${table})`)
      .all() as { name: string }[];
    if (columns.length && !columns.some((item) => item.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }
}

function createDb(): DatabaseSync {
  const file = process.env.DATABASE_FILE ?? path.join(process.cwd(), "data", "fitlife.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

export function getDb(): DatabaseSync {
  if (!globalThis.__fitlifeDb) {
    globalThis.__fitlifeDb = createDb();
  }
  return globalThis.__fitlifeDb;
}

export type Row = Record<string, string | number | bigint | null | Uint8Array>;
export type Param = string | number | bigint | null | Uint8Array;

export function all<T = Row>(sql: string, params: Param[] = []): T[] {
  return getDb().prepare(sql).all(...params) as T[];
}

export function get<T = Row>(sql: string, params: Param[] = []): T | undefined {
  return getDb().prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, params: Param[] = []): void {
  getDb().prepare(sql).run(...params);
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
