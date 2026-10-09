import { all, get, newId, nowIso, run, today } from "./db";

export interface NutritionLogRow {
  id: string;
  date: string;
  meal: string;
  name: string;
  source: string;
  servings: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export interface DayTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export function getNutritionLogs(userId: string, date: string): NutritionLogRow[] {
  return all<NutritionLogRow>(
    "SELECT id, date, meal, name, source, servings, calories, protein_g, carbs_g, fat_g, fiber_g FROM nutrition_logs WHERE user_id = ? AND date = ? ORDER BY created_at",
    [userId, date],
  );
}

export function sumLogs(logs: NutritionLogRow[]): DayTotals {
  return logs.reduce<DayTotals>(
    (totals, log) => ({
      calories: totals.calories + log.calories,
      proteinG: totals.proteinG + log.protein_g,
      carbsG: totals.carbsG + log.carbs_g,
      fatG: totals.fatG + log.fat_g,
      fiberG: totals.fiberG + log.fiber_g,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
  );
}

export function addNutritionLog(
  userId: string,
  input: {
    date?: string;
    meal: string;
    name: string;
    source?: string;
    servings: number;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG?: number;
  },
): void {
  run(
    `INSERT INTO nutrition_logs (id, user_id, date, meal, name, source, servings, calories, protein_g, carbs_g, fat_g, fiber_g, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId(),
      userId,
      input.date ?? today(),
      input.meal,
      input.name,
      input.source ?? "food",
      input.servings,
      Math.round(input.calories),
      Math.round(input.proteinG),
      Math.round(input.carbsG),
      Math.round(input.fatG),
      Math.round(input.fiberG ?? 0),
      nowIso(),
    ],
  );
}

export function deleteNutritionLog(userId: string, id: string): void {
  run("DELETE FROM nutrition_logs WHERE id = ? AND user_id = ?", [id, userId]);
}

export function getWaterMl(userId: string, date: string): number {
  const row = get<{ total: number | null }>(
    "SELECT SUM(amount_ml) AS total FROM water_logs WHERE user_id = ? AND date = ?",
    [userId, date],
  );
  return Math.round(row?.total ?? 0);
}

export function addWater(userId: string, amountMl: number, date = today()): void {
  run(
    "INSERT INTO water_logs (id, user_id, date, amount_ml, created_at) VALUES (?, ?, ?, ?, ?)",
    [newId(), userId, date, amountMl, nowIso()],
  );
}

export function getSteps(userId: string, date: string): number {
  const row = get<{ steps: number }>(
    "SELECT steps FROM step_logs WHERE user_id = ? AND date = ?",
    [userId, date],
  );
  return row?.steps ?? 0;
}

export function setSteps(userId: string, steps: number, date = today()): void {
  run(
    `INSERT INTO step_logs (id, user_id, date, steps) VALUES (?, ?, ?, ?)
     ON CONFLICT (user_id, date) DO UPDATE SET steps = excluded.steps`,
    [newId(), userId, date, Math.round(steps)],
  );
}

export function recentSteps(userId: string, days: number) {
  return all<{ date: string; steps: number }>(
    "SELECT date, steps FROM step_logs WHERE user_id = ? ORDER BY date DESC LIMIT ?",
    [userId, days],
  ).reverse();
}

export function setWeight(
  userId: string,
  weightKg: number,
  date = today(),
  note = "",
): void {
  run(
    `INSERT INTO weight_logs (id, user_id, date, weight_kg, note) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (user_id, date) DO UPDATE SET weight_kg = excluded.weight_kg, note = excluded.note`,
    [newId(), userId, date, weightKg, note],
  );
}

export function getWeightLogs(userId: string, limit = 400) {
  return all<{ date: string; weight_kg: number }>(
    "SELECT date, weight_kg FROM weight_logs WHERE user_id = ? ORDER BY date DESC LIMIT ?",
    [userId, limit],
  ).reverse();
}

export function getMeasurements(userId: string, limit = 200) {
  return all<{
    date: string;
    waist_cm: number | null;
    neck_cm: number | null;
    hip_cm: number | null;
    chest_cm: number | null;
    arm_cm: number | null;
    thigh_cm: number | null;
    photo_note: string;
  }>(
    "SELECT * FROM measurements WHERE user_id = ? ORDER BY date DESC LIMIT ?",
    [userId, limit],
  ).reverse();
}

export function saveMeasurement(
  userId: string,
  date: string,
  values: Record<string, number | null>,
  photoNote = "",
): void {
  run(
    `INSERT INTO measurements (id, user_id, date, waist_cm, neck_cm, hip_cm, chest_cm, arm_cm, thigh_cm, photo_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id, date) DO UPDATE SET
       waist_cm = COALESCE(excluded.waist_cm, measurements.waist_cm),
       neck_cm = COALESCE(excluded.neck_cm, measurements.neck_cm),
       hip_cm = COALESCE(excluded.hip_cm, measurements.hip_cm),
       chest_cm = COALESCE(excluded.chest_cm, measurements.chest_cm),
       arm_cm = COALESCE(excluded.arm_cm, measurements.arm_cm),
       thigh_cm = COALESCE(excluded.thigh_cm, measurements.thigh_cm),
       photo_note = excluded.photo_note`,
    [
      newId(),
      userId,
      date,
      values.waist_cm ?? null,
      values.neck_cm ?? null,
      values.hip_cm ?? null,
      values.chest_cm ?? null,
      values.arm_cm ?? null,
      values.thigh_cm ?? null,
      photoNote,
    ],
  );
}

export function dailyCalories(userId: string, days: number) {
  return all<{ date: string; calories: number; protein_g: number }>(
    `SELECT date, SUM(calories) AS calories, SUM(protein_g) AS protein_g
     FROM nutrition_logs WHERE user_id = ?
     GROUP BY date ORDER BY date DESC LIMIT ?`,
    [userId, days],
  ).reverse();
}

export function workoutHistory(userId: string, limit = 60) {
  return all<{
    id: string;
    date: string;
    name: string;
    status: string;
    duration_min: number | null;
  }>(
    "SELECT id, date, name, status, duration_min FROM workout_sessions WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT ?",
    [userId, limit],
  );
}

export function cardioHistory(userId: string, limit = 60) {
  return all<{
    id: string;
    date: string;
    activity_name: string;
    minutes: number;
    intensity: string;
    calories: number;
  }>(
    "SELECT id, date, activity_name, minutes, intensity, calories FROM cardio_sessions WHERE user_id = ? ORDER BY date DESC LIMIT ?",
    [userId, limit],
  );
}

export function exerciseHistory(userId: string, exerciseId: string) {
  return all<{ date: string; weight_kg: number; reps: number }>(
    `SELECT s.date AS date, ws.weight_kg AS weight_kg, ws.reps AS reps
     FROM workout_sets ws JOIN workout_sessions s ON s.id = ws.session_id
     WHERE ws.user_id = ? AND ws.exercise_id = ? AND ws.completed = 1
     ORDER BY s.date ASC, ws.set_number ASC`,
    [userId, exerciseId],
  );
}

export function strengthVolumeByWeek(userId: string, weeks = 12) {
  return all<{ week: string; volume: number }>(
    `SELECT strftime('%Y-%W', s.date) AS week, SUM(ws.weight_kg * ws.reps) AS volume
     FROM workout_sets ws JOIN workout_sessions s ON s.id = ws.session_id
     WHERE ws.user_id = ? AND ws.completed = 1
     GROUP BY week ORDER BY week DESC LIMIT ?`,
    [userId, weeks],
  ).reverse();
}

export function personalRecords(userId: string) {
  return all<{ exercise_name: string; weight_kg: number; reps: number }>(
    `SELECT exercise_name, MAX(weight_kg) AS weight_kg, reps
     FROM workout_sets WHERE user_id = ? AND completed = 1
     GROUP BY exercise_id ORDER BY weight_kg DESC LIMIT 10`,
    [userId],
  );
}

export function favorites(userId: string, itemType?: string) {
  return itemType
    ? all<{ item_type: string; item_id: string }>(
        "SELECT item_type, item_id FROM favorites WHERE user_id = ? AND item_type = ?",
        [userId, itemType],
      )
    : all<{ item_type: string; item_id: string }>(
        "SELECT item_type, item_id FROM favorites WHERE user_id = ?",
        [userId],
      );
}

export function toggleFavorite(
  userId: string,
  itemType: string,
  itemId: string,
): boolean {
  const existing = get<{ id: string }>(
    "SELECT id FROM favorites WHERE user_id = ? AND item_type = ? AND item_id = ?",
    [userId, itemType, itemId],
  );
  if (existing) {
    run("DELETE FROM favorites WHERE id = ?", [existing.id]);
    return false;
  }
  run(
    "INSERT INTO favorites (id, user_id, item_type, item_id, created_at) VALUES (?, ?, ?, ?, ?)",
    [newId(), userId, itemType, itemId, nowIso()],
  );
  return true;
}

export function recordPreference(
  userId: string,
  kind: string,
  value: string,
  weight = 1,
): void {
  run(
    "INSERT INTO preference_events (id, user_id, kind, value, weight, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [newId(), userId, kind, value, weight, nowIso()],
  );
}

/** Top learned preferences, used as a soft boost when generating meal plans. */
export function learnedBoosts(userId: string, limit = 8): string[] {
  return all<{ value: string }>(
    `SELECT value, SUM(weight) AS score FROM preference_events
     WHERE user_id = ? GROUP BY value ORDER BY score DESC LIMIT ?`,
    [userId, limit],
  ).map((row) => row.value);
}

/** Strips the amount suffix added by gram logging, e.g. "Idli (80 g)" -> "Idli". */
function baseFoodName(name: string): string {
  return name.replace(/ \(\d+(?:\.\d+)? g\)$/, "");
}

/** Most recently logged foods, one entry (the latest portion) per food. */
export function recentFoods(userId: string, limit = 12) {
  const rows = all<{
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  }>(
    `SELECT name, calories, protein_g, carbs_g, fat_g, fiber_g, MAX(created_at) AS last_used
     FROM nutrition_logs WHERE user_id = ?
     GROUP BY name ORDER BY last_used DESC`,
    [userId],
  );
  const seen = new Set<string>();
  return rows
    .filter((row) => {
      const base = baseFoodName(row.name);
      if (seen.has(base)) return false;
      seen.add(base);
      return true;
    })
    .slice(0, limit);
}

export function customFoods(userId: string) {
  return all<{
    id: string;
    name: string;
    brand: string;
    serving: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  }>("SELECT * FROM custom_foods WHERE user_id = ? ORDER BY name", [userId]);
}
