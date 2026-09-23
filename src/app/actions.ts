"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createUser,
  deleteAccount,
  endSession,
  findUserByEmail,
  getSessionUser,
  hashPassword,
  startSession,
  verifyPassword,
} from "@/lib/auth";
import { all, get, newId, nowIso, run, today } from "@/lib/db";
import { getProfile, updateProfile, computeTargets } from "@/lib/profile";
import {
  addNutritionLog,
  addWater,
  deleteNutritionLog,
  recordPreference,
  saveMeasurement,
  setSteps,
  setWeight,
  toggleFavorite,
} from "@/lib/logs";
import { requireSession } from "@/lib/session";
import { generateMealPlan } from "@/lib/planner/meals";
import { estimatedOneRepMax, sessionVolume } from "@/lib/planner/workouts";
import { calculateEstimatedCardioCalories } from "@/lib/calc/engine";
import { getCardioActivity } from "@/lib/content/cardio";
import { lbToKg, inToCm } from "@/lib/calc/units";

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

const credentials = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});

export async function signUpAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = credentials.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  if (findUserByEmail(parsed.data.email)) {
    return { ok: false, error: "An account with that email already exists." };
  }
  const user = createUser(parsed.data.email, await hashPassword(parsed.data.password));
  await startSession(user.id);
  redirect("/onboarding");
}

export async function signInAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { ok: false, error: "Email or password is incorrect." };
  }
  await startSession(user.id);
  const profile = getProfile(user.id);
  redirect(profile?.onboarded ? "/dashboard" : "/onboarding");
}

export async function signOutAction(): Promise<void> {
  await endSession();
  redirect("/signin");
}

export async function requestPasswordResetAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const user = findUserByEmail(email);
  if (!user) {
    return {
      ok: true,
      message:
        "If an account exists for that email, a reset link has been created.",
    };
  }
  const token = newId().replaceAll("-", "");
  run(
    "INSERT INTO password_resets (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    [token, user.id, nowIso(), new Date(Date.now() + 3600_000).toISOString()],
  );
  return {
    ok: true,
    message: `Email delivery is not configured in this deployment, so use this one-hour link directly: /reset/${token}`,
  };
}

export async function completePasswordResetAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { ok: false, error: "Use at least 8 characters." };
  }
  const row = get<{ user_id: string; expires_at: string; used: number }>(
    "SELECT user_id, expires_at, used FROM password_resets WHERE token = ?",
    [token],
  );
  if (!row || row.used === 1 || new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "That reset link is invalid or has expired." };
  }
  run("UPDATE users SET password_hash = ? WHERE id = ?", [
    await hashPassword(password),
    row.user_id,
  ]);
  run("UPDATE password_resets SET used = 1 WHERE token = ?", [token]);
  redirect("/signin?reset=1");
}

export async function deleteAccountAction(): Promise<void> {
  const user = await requireSession();
  deleteAccount(user.id);
  await endSession();
  redirect("/");
}

function num(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function str(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

export async function saveOnboardingAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSession();
  const units = str(formData.get("units")) === "imperial" ? "imperial" : "metric";

  const weightRaw = num(formData.get("weight"));
  const heightCmRaw = num(formData.get("heightCm"));
  const heightFt = num(formData.get("heightFt"));
  const heightIn = num(formData.get("heightIn"));

  const weightKg =
    weightRaw == null ? null : units === "imperial" ? lbToKg(weightRaw) : weightRaw;
  const heightCm =
    units === "imperial"
      ? heightFt != null
        ? inToCm(heightFt * 12 + (heightIn ?? 0))
        : null
      : heightCmRaw;

  if (!weightKg || !heightCm) {
    return { ok: false, error: "Height and weight are required." };
  }

  const age = num(formData.get("age"));
  if (!age || age < 13 || age > 100) {
    return {
      ok: false,
      error:
        "Enter an age between 13 and 100. Under 18 should use this with a parent or guardian and a healthcare professional.",
    };
  }

  const waist = num(formData.get("waist"));
  const neck = num(formData.get("neck"));
  const hip = num(formData.get("hip"));
  const toCm = (value: number | null) =>
    value == null ? null : units === "imperial" ? inToCm(value) : value;

  updateProfile(user.id, {
    first_name: str(formData.get("firstName")),
    age,
    sex: str(formData.get("sex")),
    height_cm: Math.round(heightCm * 10) / 10,
    weight_kg: Math.round(weightKg * 10) / 10,
    units,
    activity_level: str(formData.get("activityLevel")),
    goal: str(formData.get("goal")),
    pace: str(formData.get("pace")) || "moderate",
    macro_preference: str(formData.get("macroPreference")) || "balanced",
    body_fat_pct: num(formData.get("bodyFat")),
    waist_cm: toCm(waist),
    neck_cm: toCm(neck),
    hip_cm: toCm(hip),
    experience: str(formData.get("experience")) || "beginner",
    daily_steps: num(formData.get("dailySteps")),
    occupation: str(formData.get("occupation")),
    sleep_hours: num(formData.get("sleepHours")),
    workout_days: num(formData.get("workoutDays")) ?? 3,
    workout_minutes: num(formData.get("workoutMinutes")) ?? 45,
    equipment: formData.getAll("equipment").map(String),
    diet_prefs: formData.getAll("dietPrefs").map(String),
    allergies: str(formData.get("allergies")),
    dislikes: str(formData.get("dislikes")),
    mode: str(formData.get("mode")) || "beginner",
    onboarded: true,
  });

  setWeight(user.id, Math.round(weightKg * 10) / 10);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateProfileAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSession();
  const profile = getProfile(user.id);
  if (!profile) return { ok: false, error: "Profile not found." };

  const patch: Record<string, unknown> = {};
  const simpleFields = [
    "first_name",
    "sex",
    "units",
    "activity_level",
    "goal",
    "pace",
    "macro_preference",
    "experience",
    "occupation",
    "theme",
    "mode",
  ];
  for (const field of simpleFields) {
    const value = formData.get(field);
    if (value !== null && String(value) !== "") patch[field] = str(value);
  }
  const numericFields = [
    "age",
    "height_cm",
    "weight_kg",
    "body_fat_pct",
    "daily_steps",
    "sleep_hours",
    "workout_days",
    "workout_minutes",
    "cardio_days",
    "calorie_override",
    "water_goal_ml",
    "step_goal",
  ];
  for (const field of numericFields) {
    if (formData.has(field)) patch[field] = num(formData.get(field));
  }
  if (formData.has("allergies")) patch.allergies = str(formData.get("allergies"));
  if (formData.has("dislikes")) patch.dislikes = str(formData.get("dislikes"));
  if (formData.has("equipment")) {
    patch.equipment = formData.getAll("equipment").map(String);
  }
  if (formData.has("dietPrefs")) {
    patch.diet_prefs = formData.getAll("dietPrefs").map(String);
  }
  if (formData.has("notificationsSubmitted")) {
    const notifications: Record<string, boolean> = {};
    for (const key of Object.keys(profile.notifications)) {
      notifications[key] = formData.get(`notify_${key}`) === "on";
    }
    patch.notifications = notifications;
  }

  updateProfile(user.id, patch);
  if (typeof patch.weight_kg === "number") {
    setWeight(user.id, patch.weight_kg);
  }
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true, message: "Saved." };
}

export async function logFoodAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSession();
  const servings = num(formData.get("servings")) ?? 1;
  const calories = num(formData.get("calories"));
  if (calories == null) return { ok: false, error: "Calories are required." };
  const name = str(formData.get("name"));
  if (!name) return { ok: false, error: "Give the entry a name." };

  addNutritionLog(user.id, {
    date: str(formData.get("date")) || today(),
    meal: str(formData.get("meal")) || "lunch",
    name,
    source: str(formData.get("source")) || "food",
    servings,
    calories: calories * servings,
    proteinG: (num(formData.get("protein")) ?? 0) * servings,
    carbsG: (num(formData.get("carbs")) ?? 0) * servings,
    fatG: (num(formData.get("fat")) ?? 0) * servings,
    fiberG: (num(formData.get("fiber")) ?? 0) * servings,
  });
  const foodId = str(formData.get("foodId"));
  if (foodId) recordPreference(user.id, "food", foodId);
  revalidatePath("/food");
  revalidatePath("/dashboard");
  return { ok: true, message: `${name} logged.` };
}

/** Form-action variant used by the inline "log this" buttons in search results. */
export async function quickLogFoodAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const servings = num(formData.get("servings")) ?? 1;
  const name = str(formData.get("name"));
  if (!name) return;
  addNutritionLog(user.id, {
    meal: str(formData.get("meal")) || "lunch",
    name,
    source: str(formData.get("source")) || "food",
    servings,
    calories: (num(formData.get("calories")) ?? 0) * servings,
    proteinG: (num(formData.get("protein")) ?? 0) * servings,
    carbsG: (num(formData.get("carbs")) ?? 0) * servings,
    fatG: (num(formData.get("fat")) ?? 0) * servings,
    fiberG: (num(formData.get("fiber")) ?? 0) * servings,
  });
  const foodId = str(formData.get("foodId"));
  if (foodId) recordPreference(user.id, "food", foodId);
  revalidatePath("/food");
  revalidatePath("/dashboard");
}

export async function deleteFoodLogAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  deleteNutritionLog(user.id, str(formData.get("id")));
  revalidatePath("/food");
  revalidatePath("/dashboard");
}

export async function saveCustomFoodAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSession();
  const name = str(formData.get("name"));
  const calories = num(formData.get("calories"));
  if (!name || calories == null) {
    return { ok: false, error: "Name and calories are required." };
  }
  run(
    `INSERT INTO custom_foods (id, user_id, name, brand, serving, calories, protein_g, carbs_g, fat_g, fiber_g, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId(),
      user.id,
      name,
      str(formData.get("brand")),
      str(formData.get("serving")) || "1 serving",
      calories,
      num(formData.get("protein")) ?? 0,
      num(formData.get("carbs")) ?? 0,
      num(formData.get("fat")) ?? 0,
      num(formData.get("fiber")) ?? 0,
      nowIso(),
    ],
  );
  revalidatePath("/food");
  return { ok: true, message: `${name} saved to your foods.` };
}

export async function addWaterAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const amount = num(formData.get("amountMl")) ?? 250;
  addWater(user.id, amount);
  revalidatePath("/dashboard");
}

export async function setStepsAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const steps = num(formData.get("steps")) ?? 0;
  setSteps(user.id, steps);
  revalidatePath("/dashboard");
  revalidatePath("/progress");
}

export async function logWeightAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSession();
  const profile = getProfile(user.id);
  const value = num(formData.get("weight"));
  if (value == null || value <= 0) {
    return { ok: false, error: "Enter a valid weight." };
  }
  const weightKg =
    profile?.units === "imperial" ? Math.round(lbToKg(value) * 10) / 10 : value;
  const date = str(formData.get("date")) || today();
  setWeight(user.id, weightKg, date, str(formData.get("note")));
  updateProfile(user.id, { weight_kg: weightKg });
  revalidatePath("/progress");
  revalidatePath("/dashboard");
  return { ok: true, message: "Weight logged." };
}

export async function logMeasurementsAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSession();
  const profile = getProfile(user.id);
  const toCm = (value: number | null) =>
    value == null ? null : profile?.units === "imperial" ? inToCm(value) : value;
  saveMeasurement(
    user.id,
    str(formData.get("date")) || today(),
    {
      waist_cm: toCm(num(formData.get("waist"))),
      neck_cm: toCm(num(formData.get("neck"))),
      hip_cm: toCm(num(formData.get("hip"))),
      chest_cm: toCm(num(formData.get("chest"))),
      arm_cm: toCm(num(formData.get("arm"))),
      thigh_cm: toCm(num(formData.get("thigh"))),
    },
    str(formData.get("photoNote")),
  );
  revalidatePath("/progress");
  return { ok: true, message: "Measurements saved." };
}

export async function generateMealPlanAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const profile = getProfile(user.id);
  if (!profile) redirect("/onboarding");
  const targets = computeTargets(profile);
  if (!targets) redirect("/onboarding");

  const days = Number(formData.get("days") ?? 7);
  const plan = generateMealPlan({
    days: [1, 3, 7, 14].includes(days) ? days : 7,
    calorieTarget: targets.effectiveCalories,
    proteinTarget: targets.macros.proteinG,
    preferences: {
      dietPrefs: profile.dietPrefs,
      allergies: splitList(profile.allergies),
      dislikes: splitList(profile.dislikes),
      maxPrepMinutes: numberOrNull(formData.get("maxPrep")),
      budgetFriendlyOnly: formData.get("budget") === "on",
    },
    includeEveningSnack: formData.get("eveningSnack") === "on",
  });

  run(
    "INSERT INTO meal_plans (id, user_id, start_date, days, calorie_target, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      newId(),
      user.id,
      plan.days[0]?.date ?? today(),
      plan.days.length,
      targets.effectiveCalories,
      JSON.stringify(plan),
      nowIso(),
    ],
  );
  revalidatePath("/meal-plan");
  redirect("/meal-plan");
}

export async function swapMealAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const planId = str(formData.get("planId"));
  const dayIndex = Number(formData.get("dayIndex"));
  const slot = str(formData.get("slot"));
  const profile = getProfile(user.id);
  if (!profile) redirect("/onboarding");

  const row = get<{ data: string }>(
    "SELECT data FROM meal_plans WHERE id = ? AND user_id = ?",
    [planId, user.id],
  );
  if (!row) return;

  const { swapMeal } = await import("@/lib/planner/meals");
  const plan = JSON.parse(row.data) as Awaited<
    ReturnType<typeof generateMealPlan>
  >;
  const day = plan.days.find((d) => d.dayIndex === dayIndex);
  const meal = day?.meals.find((m) => m.slot === slot);
  if (!day || !meal) return;

  const replacement = swapMeal(meal, {
    dietPrefs: profile.dietPrefs,
    allergies: splitList(profile.allergies),
    dislikes: splitList(profile.dislikes),
  });
  if (!replacement) return;

  recordPreference(user.id, "swap_out", meal.recipeId, 0.5);
  recordPreference(user.id, "swap_in", replacement.recipeId);
  day.meals = day.meals.map((m) => (m.slot === slot ? replacement : m));
  const { sumMeals, buildGroceryList } = await import("@/lib/planner/meals");
  day.totals = sumMeals(day.meals);
  plan.grocery = buildGroceryList(plan.days);

  run("UPDATE meal_plans SET data = ? WHERE id = ? AND user_id = ?", [
    JSON.stringify(plan),
    planId,
    user.id,
  ]);
  revalidatePath("/meal-plan");
}

export async function logPlannedMealAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  addNutritionLog(user.id, {
    meal: str(formData.get("slot")) || "lunch",
    name: str(formData.get("name")),
    source: "recipe",
    servings: Number(formData.get("servings") ?? 1),
    calories: Number(formData.get("calories") ?? 0),
    proteinG: Number(formData.get("protein") ?? 0),
    carbsG: Number(formData.get("carbs") ?? 0),
    fatG: Number(formData.get("fat") ?? 0),
    fiberG: Number(formData.get("fiber") ?? 0),
  });
  revalidatePath("/food");
  revalidatePath("/dashboard");
}

export async function startWorkoutAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const id = newId();
  run(
    "INSERT INTO workout_sessions (id, user_id, date, name, day_key, status, created_at) VALUES (?, ?, ?, ?, ?, 'in_progress', ?)",
    [
      id,
      user.id,
      today(),
      str(formData.get("name")) || "Workout",
      str(formData.get("dayKey")),
      nowIso(),
    ],
  );
  redirect(`/train/session/${id}`);
}

export async function logSetAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const sessionId = str(formData.get("sessionId"));
  const owned = get<{ id: string }>(
    "SELECT id FROM workout_sessions WHERE id = ? AND user_id = ?",
    [sessionId, user.id],
  );
  if (!owned) return;
  run(
    `INSERT INTO workout_sets (id, session_id, user_id, exercise_id, exercise_name, set_number, weight_kg, reps, rpe, completed, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      newId(),
      sessionId,
      user.id,
      str(formData.get("exerciseId")),
      str(formData.get("exerciseName")),
      Number(formData.get("setNumber") ?? 1),
      Number(formData.get("weight") ?? 0),
      Number(formData.get("reps") ?? 0),
      num(formData.get("rpe")),
      nowIso(),
    ],
  );
  revalidatePath(`/train/session/${sessionId}`);
}

export async function finishWorkoutAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const sessionId = str(formData.get("sessionId"));
  run(
    "UPDATE workout_sessions SET status = 'complete', duration_min = ?, notes = ? WHERE id = ? AND user_id = ?",
    [
      num(formData.get("duration")) ?? null,
      str(formData.get("notes")),
      sessionId,
      user.id,
    ],
  );
  revalidatePath("/train");
  revalidatePath("/progress");
  redirect("/train");
}

export async function logCardioAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSession();
  const profile = getProfile(user.id);
  const activityId = str(formData.get("activityId"));
  const activity = getCardioActivity(activityId);
  if (!activity) return { ok: false, error: "Pick an activity." };
  const minutes = num(formData.get("minutes")) ?? activity.defaultMinutes;
  const calories = calculateEstimatedCardioCalories({
    met: activity.met,
    minutes,
    weightKg: profile?.weight_kg ?? 70,
  });
  run(
    "INSERT INTO cardio_sessions (id, user_id, date, activity_id, activity_name, minutes, intensity, calories, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      newId(),
      user.id,
      str(formData.get("date")) || today(),
      activity.id,
      activity.name,
      Math.round(minutes),
      activity.intensity,
      calories,
      nowIso(),
    ],
  );
  revalidatePath("/cardio");
  revalidatePath("/dashboard");
  return { ok: true, message: `${activity.name} logged (~${calories} kcal).` };
}

export async function toggleFavoriteAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  toggleFavorite(
    user.id,
    str(formData.get("itemType")),
    str(formData.get("itemId")),
  );
  const path = str(formData.get("path"));
  if (path) revalidatePath(path);
}

export async function applyCalorieSuggestionAction(
  formData: FormData,
): Promise<void> {
  const user = await requireSession();
  const value = num(formData.get("calories"));
  if (value != null) updateProfile(user.id, { calorie_override: value });
  revalidatePath("/progress");
  revalidatePath("/dashboard");
}

export async function exportDataAction(): Promise<string> {
  const user = await getSessionUser();
  if (!user) return "{}";
  const tables = [
    "profiles",
    "weight_logs",
    "measurements",
    "nutrition_logs",
    "custom_foods",
    "water_logs",
    "step_logs",
    "workout_sessions",
    "workout_sets",
    "cardio_sessions",
    "meal_plans",
    "favorites",
  ];
  const data: Record<string, unknown[]> = {};
  for (const table of tables) {
    data[table] = all(`SELECT * FROM ${table} WHERE user_id = ?`, [user.id]);
  }
  return JSON.stringify({ email: user.email, exportedAt: nowIso(), data }, null, 2);
}

export async function workoutSummaryAction(sessionId: string) {
  const user = await requireSession();
  const sets = all<{ weight_kg: number; reps: number }>(
    "SELECT weight_kg, reps FROM workout_sets WHERE session_id = ? AND user_id = ?",
    [sessionId, user.id],
  );
  return {
    volume: sessionVolume(
      sets.map((set) => ({ weightKg: set.weight_kg, reps: set.reps })),
    ),
    bestOneRepMax: sets.reduce(
      (best, set) => Math.max(best, estimatedOneRepMax(set.weight_kg, set.reps)),
      0,
    ),
  };
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
