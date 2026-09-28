import { get, nowIso, run } from "./db";
import {
  calculateBMI,
  calculateGoalCalories,
  calculateMacros,
  estimateBodyFat,
} from "./calc/engine";
import type {
  ActivityLevel,
  CalcProfile,
  CalorieTargets,
  Equipment,
  Experience,
  Goal,
  GoalPace,
  MacroPreference,
  Macros,
  Sex,
} from "./calc/types";
import type { UnitSystem } from "./calc/units";

export interface ProfileRow {
  user_id: string;
  first_name: string;
  age: number | null;
  sex: Sex | null;
  height_cm: number | null;
  weight_kg: number | null;
  units: UnitSystem;
  activity_level: ActivityLevel | null;
  goal: Goal | null;
  pace: GoalPace | null;
  macro_preference: MacroPreference;
  body_fat_pct: number | null;
  waist_cm: number | null;
  neck_cm: number | null;
  hip_cm: number | null;
  experience: Experience | null;
  daily_steps: number | null;
  occupation: string | null;
  sleep_hours: number | null;
  workout_days: number | null;
  workout_minutes: number | null;
  cardio_days: number | null;
  equipment: string;
  diet_prefs: string;
  allergies: string;
  dislikes: string;
  calorie_override: number | null;
  water_goal_ml: number;
  step_goal: number;
  theme: string;
  mode: string;
  notifications: string;
  onboarded: number;
  updated_at: string;
}

export interface Profile extends Omit<ProfileRow, "equipment" | "diet_prefs" | "notifications" | "onboarded"> {
  equipment: Equipment[];
  dietPrefs: string[];
  notifications: Record<string, boolean>;
  onboarded: boolean;
}

export const DEFAULT_NOTIFICATIONS: Record<string, boolean> = {
  workout: true,
  meals: true,
  water: false,
  weighIn: true,
  weeklySummary: true,
  streak: false,
};

export function getProfile(userId: string): Profile | null {
  const row = get<ProfileRow>("SELECT * FROM profiles WHERE user_id = ?", [
    userId,
  ]);
  if (!row) return null;
  return {
    ...row,
    equipment: safeParse<Equipment[]>(row.equipment, []),
    dietPrefs: safeParse<string[]>(row.diet_prefs, []),
    notifications: {
      ...DEFAULT_NOTIFICATIONS,
      ...safeParse<Record<string, boolean>>(row.notifications, {}),
    },
    onboarded: row.onboarded === 1,
  };
}

function safeParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

const UPDATABLE = new Set([
  "first_name",
  "age",
  "sex",
  "height_cm",
  "weight_kg",
  "units",
  "activity_level",
  "goal",
  "pace",
  "macro_preference",
  "body_fat_pct",
  "waist_cm",
  "neck_cm",
  "hip_cm",
  "experience",
  "daily_steps",
  "occupation",
  "sleep_hours",
  "workout_days",
  "workout_minutes",
  "cardio_days",
  "equipment",
  "diet_prefs",
  "allergies",
  "dislikes",
  "calorie_override",
  "water_goal_ml",
  "step_goal",
  "theme",
  "mode",
  "notifications",
  "onboarded",
]);

export function updateProfile(
  userId: string,
  patch: Record<string, unknown>,
): void {
  const columns: string[] = [];
  const values: (string | number | null)[] = [];
  for (const [key, value] of Object.entries(patch)) {
    if (!UPDATABLE.has(key)) continue;
    columns.push(`${key} = ?`);
    if (value === null || value === undefined) values.push(null);
    else if (typeof value === "boolean") values.push(value ? 1 : 0);
    else if (typeof value === "object") values.push(JSON.stringify(value));
    else if (typeof value === "number") values.push(value);
    else values.push(String(value));
  }
  if (columns.length === 0) return;
  columns.push("updated_at = ?");
  values.push(nowIso());
  values.push(userId);
  run(`UPDATE profiles SET ${columns.join(", ")} WHERE user_id = ?`, values);
}

export interface Targets {
  calories: CalorieTargets;
  macros: Macros;
  effectiveCalories: number;
  bmi: number | null;
  estimatedBodyFat: number | null;
  manualOverride: boolean;
}

export function profileIsComplete(profile: Profile | null): profile is Profile {
  return Boolean(
    profile &&
      profile.age &&
      profile.sex &&
      profile.height_cm &&
      profile.weight_kg &&
      profile.activity_level &&
      profile.goal,
  );
}

export function toCalcProfile(profile: Profile): CalcProfile {
  return {
    age: profile.age as number,
    sex: profile.sex as Sex,
    heightCm: profile.height_cm as number,
    weightKg: profile.weight_kg as number,
    activityLevel: profile.activity_level as ActivityLevel,
    goal: profile.goal as Goal,
    pace: profile.pace ?? "moderate",
    bodyFatPct: profile.body_fat_pct,
    macroPreference: profile.macro_preference,
    dailySteps: profile.daily_steps,
  };
}

export function computeTargets(profile: Profile): Targets | null {
  if (!profileIsComplete(profile)) return null;
  const calcProfile = toCalcProfile(profile);
  const calories = calculateGoalCalories(calcProfile);
  const effectiveCalories = profile.calorie_override ?? calories.goalCalories;
  const macros = calculateMacros(calcProfile, effectiveCalories);
  return {
    calories,
    macros,
    effectiveCalories,
    bmi: calculateBMI(calcProfile.weightKg, calcProfile.heightCm),
    estimatedBodyFat:
      profile.body_fat_pct ??
      estimateBodyFat({
        sex: calcProfile.sex,
        heightCm: calcProfile.heightCm,
        waistCm: profile.waist_cm,
        neckCm: profile.neck_cm,
        hipCm: profile.hip_cm,
      }),
    manualOverride: profile.calorie_override != null,
  };
}
