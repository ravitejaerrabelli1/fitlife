import {
  KCAL_PER_KG_FAT,
  KCAL_PER_LB_FAT,
  kgToLb,
  round,
} from "./units";
import type {
  ActivityLevel,
  CalcProfile,
  CalorieTargets,
  Goal,
  GoalPace,
  MacroPreference,
  Macros,
  Sex,
} from "./types";

export class CalculationError extends Error {}

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extreme: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary — desk work, little planned activity",
  light: "Lightly active — light exercise 1–3 days/week",
  moderate: "Moderately active — exercise 3–5 days/week",
  very: "Very active — hard exercise 6–7 days/week",
  extreme: "Extremely active — physical job or two-a-day training",
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose: "Lose weight",
  maintain: "Maintain weight",
  gain: "Gain weight",
  bulk: "Build muscle",
  recomp: "Body recomposition",
};

/** Percentage adjustments applied to maintenance calories. */
const GOAL_ADJUSTMENTS: Record<Goal, Record<GoalPace, number>> = {
  lose: { slow: -0.1, moderate: -0.17, faster: -0.22 },
  maintain: { slow: 0, moderate: 0, faster: 0 },
  gain: { slow: 0.08, moderate: 0.13, faster: 0.13 },
  bulk: { slow: 0.07, moderate: 0.12, faster: 0.15 },
  recomp: { slow: -0.03, moderate: -0.05, faster: -0.05 },
};

/** Conservative lower bounds so the app never suggests an extreme deficit. */
const MIN_CALORIES: Record<Sex, number> = { male: 1500, female: 1200 };

export function validateProfile(profile: CalcProfile): void {
  const { age, heightCm, weightKg, sex } = profile;
  if (!Number.isFinite(age) || age < 13 || age > 100) {
    throw new CalculationError("Age must be between 13 and 100.");
  }
  if (!Number.isFinite(heightCm) || heightCm < 120 || heightCm > 250) {
    throw new CalculationError("Height must be between 120 cm and 250 cm.");
  }
  if (!Number.isFinite(weightKg) || weightKg < 30 || weightKg > 350) {
    throw new CalculationError("Weight must be between 30 kg and 350 kg.");
  }
  if (sex !== "male" && sex !== "female") {
    throw new CalculationError("Sex must be provided for the BMR estimate.");
  }
  if (
    profile.bodyFatPct != null &&
    (profile.bodyFatPct < 3 || profile.bodyFatPct > 70)
  ) {
    throw new CalculationError("Body-fat percentage must be between 3% and 70%.");
  }
}

/** Mifflin-St Jeor. Falls back to Katch-McArdle when body fat is known. */
export function calculateBMR(profile: CalcProfile): number {
  validateProfile(profile);
  const { weightKg, heightCm, age, sex, bodyFatPct } = profile;
  if (bodyFatPct != null) {
    const leanMass = weightKg * (1 - bodyFatPct / 100);
    return round(370 + 21.6 * leanMass);
  }
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return round(sex === "male" ? base + 5 : base - 161);
}

export function calculateTDEE(profile: CalcProfile): number {
  const bmr = calculateBMR(profile);
  return round(bmr * ACTIVITY_FACTORS[profile.activityLevel]);
}

export function calculateMaintenanceCalories(profile: CalcProfile): number {
  return calculateTDEE(profile);
}

export function calculateGoalCalories(profile: CalcProfile): CalorieTargets {
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(profile);
  const pace: GoalPace = profile.pace ?? "moderate";
  const adjustment = GOAL_ADJUSTMENTS[profile.goal][pace];
  const floor = Math.max(MIN_CALORIES[profile.sex], round(bmr * 1.05));
  let goalCalories = round(tdee * (1 + adjustment));
  if (goalCalories < floor) goalCalories = floor;

  const dailyDelta = goalCalories - tdee;
  const weeklyChangeKg = round((dailyDelta * 7) / KCAL_PER_KG_FAT, 2);
  const weeklyChangeLb = round((dailyDelta * 7) / KCAL_PER_LB_FAT, 2);

  return {
    bmr,
    tdee,
    maintenanceCalories: tdee,
    goalCalories,
    dailyDelta,
    weeklyChangeKg,
    weeklyChangeLb,
    activityFactor: ACTIVITY_FACTORS[profile.activityLevel],
    note: buildGoalNote(profile.goal, dailyDelta, goalCalories === floor),
  };
}

function buildGoalNote(goal: Goal, delta: number, clamped: boolean): string {
  const parts: string[] = [];
  if (goal === "recomp") {
    parts.push(
      "Recomposition works best near maintenance with high protein and consistent resistance training.",
    );
  } else if (delta < 0) {
    parts.push("A moderate deficit is used to protect muscle and performance.");
  } else if (delta > 0) {
    parts.push("A moderate surplus limits unnecessary fat gain.");
  } else {
    parts.push("Calories are set at your estimated maintenance.");
  }
  if (clamped) {
    parts.push(
      "Your target was raised to a conservative minimum so the plan stays in a safe range.",
    );
  }
  parts.push("All values are estimates, not medical advice.");
  return parts.join(" ");
}

interface MacroSplit {
  proteinPerKg: number;
  fatPct: number;
}

const MACRO_SPLITS: Record<MacroPreference, MacroSplit> = {
  balanced: { proteinPerKg: 1.8, fatPct: 0.28 },
  higher_protein: { proteinPerKg: 2.2, fatPct: 0.25 },
  higher_carb: { proteinPerKg: 1.7, fatPct: 0.22 },
  lower_carb: { proteinPerKg: 2.0, fatPct: 0.4 },
};

const GOAL_PROTEIN_BONUS: Record<Goal, number> = {
  lose: 0.2,
  maintain: 0,
  gain: 0.1,
  bulk: 0.2,
  recomp: 0.3,
};

/**
 * Protein is scaled to body size (lean mass when body fat is known), fat is a
 * percentage of calories with a floor, and carbohydrates take the remainder.
 */
export function calculateMacros(
  profile: CalcProfile,
  calories: number,
): Macros {
  if (!Number.isFinite(calories) || calories < 800 || calories > 8000) {
    throw new CalculationError("Calorie target is outside a realistic range.");
  }
  const preference: MacroPreference = profile.macroPreference ?? "balanced";
  const split = MACRO_SPLITS[preference];
  const referenceKg =
    profile.bodyFatPct != null
      ? profile.weightKg * (1 - profile.bodyFatPct / 100) * 1.15
      : Math.min(profile.weightKg, heightBasedCap(profile.heightCm));

  let proteinG = Math.round(
    referenceKg * (split.proteinPerKg + GOAL_PROTEIN_BONUS[profile.goal]),
  );
  let fatG = Math.round((calories * split.fatPct) / 9);
  const minFatG = Math.round(referenceKg * 0.6);
  if (fatG < minFatG) fatG = minFatG;

  // Protein and fat may not exceed the calorie budget; leave room for carbs.
  const maxProteinFatCalories = calories * 0.85;
  while (proteinG * 4 + fatG * 9 > maxProteinFatCalories && proteinG > 60) {
    proteinG -= 5;
  }
  while (proteinG * 4 + fatG * 9 > maxProteinFatCalories && fatG > 30) {
    fatG -= 2;
  }

  const remaining = calories - (proteinG * 4 + fatG * 9);
  const carbsG = Math.max(0, Math.round(remaining / 4));

  return validateMacros({
    proteinG,
    carbsG,
    fatG,
    calories: Math.round(calories),
  });
}

/** Caps the protein reference weight for very high body weights. */
function heightBasedCap(heightCm: number): number {
  const heightM = heightCm / 100;
  return 27 * heightM * heightM;
}

/**
 * Ensures macro calories stay within 2% of the stated calorie target, nudging
 * carbohydrates so the UI can never display a contradictory breakdown.
 */
export function validateMacros(macros: Macros): Macros {
  const target = macros.calories;
  let { carbsG } = macros;
  const fromProteinFat = macros.proteinG * 4 + macros.fatG * 9;
  carbsG = Math.max(0, Math.round((target - fromProteinFat) / 4));
  const total = fromProteinFat + carbsG * 4;
  if (Math.abs(total - target) > Math.max(25, target * 0.02)) {
    throw new CalculationError(
      "Macro breakdown does not match the calorie target.",
    );
  }
  return { ...macros, carbsG };
}

export function macroCalories(macros: Macros): number {
  return macros.proteinG * 4 + macros.carbsG * 4 + macros.fatG * 9;
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) throw new CalculationError("Height must be positive.");
  const heightM = heightCm / 100;
  return round(weightKg / (heightM * heightM), 1);
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Below the typical range";
  if (bmi < 25) return "Typical range";
  if (bmi < 30) return "Above the typical range";
  return "Well above the typical range";
}

/** U.S. Navy circumference method. Returns null when inputs are missing. */
export function estimateBodyFat(input: {
  sex: Sex;
  heightCm: number;
  waistCm?: number | null;
  neckCm?: number | null;
  hipCm?: number | null;
}): number | null {
  const { sex, heightCm, waistCm, neckCm, hipCm } = input;
  if (!waistCm || !neckCm) return null;
  if (sex === "male") {
    if (waistCm - neckCm <= 0) return null;
    const value =
      495 /
        (1.0324 -
          0.19077 * Math.log10(waistCm - neckCm) +
          0.15456 * Math.log10(heightCm)) -
      450;
    return clampBodyFat(value);
  }
  if (!hipCm) return null;
  if (waistCm + hipCm - neckCm <= 0) return null;
  const value =
    495 /
      (1.29579 -
        0.35004 * Math.log10(waistCm + hipCm - neckCm) +
        0.221 * Math.log10(heightCm)) -
    450;
  return clampBodyFat(value);
}

function clampBodyFat(value: number): number | null {
  if (!Number.isFinite(value) || value < 3 || value > 70) return null;
  return round(value, 1);
}

export interface WeightPoint {
  date: string;
  weightKg: number;
}

export interface WeightTrend {
  latestKg: number | null;
  sevenDayAverageKg: number | null;
  previousSevenDayAverageKg: number | null;
  weeklyChangeKg: number | null;
  monthlyChangeKg: number | null;
  direction: "up" | "down" | "stable" | "unknown";
  points: { date: string; weightKg: number; averageKg: number }[];
}

/**
 * Uses rolling averages rather than single-day weights, which fluctuate with
 * water, food volume, sodium, carbohydrate intake, training and hormones.
 */
export function calculateWeightTrend(logs: WeightPoint[]): WeightTrend {
  const sorted = [...logs]
    .filter((l) => Number.isFinite(l.weightKg))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) {
    return {
      latestKg: null,
      sevenDayAverageKg: null,
      previousSevenDayAverageKg: null,
      weeklyChangeKg: null,
      monthlyChangeKg: null,
      direction: "unknown",
      points: [],
    };
  }

  const points = sorted.map((log, index) => {
    const window = sorted.slice(Math.max(0, index - 6), index + 1);
    const averageKg =
      window.reduce((sum, w) => sum + w.weightKg, 0) / window.length;
    return {
      date: log.date,
      weightKg: round(log.weightKg, 2),
      averageKg: round(averageKg, 2),
    };
  });

  const avg = (arr: WeightPoint[]) =>
    arr.length ? arr.reduce((s, w) => s + w.weightKg, 0) / arr.length : null;

  const last7 = avg(sorted.slice(-7));
  const prev7 = sorted.length > 7 ? avg(sorted.slice(-14, -7)) : null;
  const weeklyChangeKg =
    last7 != null && prev7 != null ? round(last7 - prev7, 2) : null;

  const last30 = avg(sorted.slice(-30, -23));
  const monthlyChangeKg =
    last7 != null && last30 != null && sorted.length >= 30
      ? round(last7 - last30, 2)
      : null;

  let direction: WeightTrend["direction"] = "unknown";
  if (weeklyChangeKg != null) {
    if (Math.abs(weeklyChangeKg) < 0.15) direction = "stable";
    else direction = weeklyChangeKg > 0 ? "up" : "down";
  }

  return {
    latestKg: round(sorted[sorted.length - 1].weightKg, 2),
    sevenDayAverageKg: last7 != null ? round(last7, 2) : null,
    previousSevenDayAverageKg: prev7 != null ? round(prev7, 2) : null,
    weeklyChangeKg,
    monthlyChangeKg,
    direction,
    points,
  };
}

/** MET-based estimate. Deliberately labelled as an estimate everywhere. */
export function calculateEstimatedCardioCalories(input: {
  met: number;
  minutes: number;
  weightKg: number;
}): number {
  const { met, minutes, weightKg } = input;
  if (met <= 0 || minutes <= 0 || weightKg <= 0) return 0;
  return Math.round((met * 3.5 * weightKg * minutes) / 200);
}

export interface AdjustmentSuggestion {
  shouldReview: boolean;
  headline: string;
  detail: string;
  suggestedCalories: number | null;
}

/**
 * Compares the observed weight trend with the selected goal and suggests — never
 * silently applies — a small calorie review.
 */
export function suggestCalorieAdjustment(input: {
  goal: Goal;
  currentTarget: number;
  averageIntake: number | null;
  trend: WeightTrend;
  weeksOfData: number;
}): AdjustmentSuggestion {
  const { goal, currentTarget, averageIntake, trend, weeksOfData } = input;
  if (weeksOfData < 3 || trend.weeklyChangeKg == null) {
    return {
      shouldReview: false,
      headline: "Not enough data yet",
      detail:
        "Log your weight for at least three weeks so trends can be compared with your target.",
      suggestedCalories: null,
    };
  }

  const change = trend.weeklyChangeKg;
  const intakeNote =
    averageIntake != null
      ? ` Your average intake was about ${Math.round(averageIntake)} kcal against a ${currentTarget} kcal target.`
      : "";

  if (goal === "lose" && change > -0.1) {
    return {
      shouldReview: true,
      headline: "Weight trend has been stable",
      detail: `Your 7-day average has been relatively stable over the last few weeks. If fat loss is still the goal, you may want to review average calorie intake and daily activity.${intakeNote}`,
      suggestedCalories: Math.max(1200, currentTarget - 150),
    };
  }
  if ((goal === "gain" || goal === "bulk") && change < 0.05) {
    return {
      shouldReview: true,
      headline: "Weight trend has not increased",
      detail: `Your 7-day average has not moved upward recently. You may want to review whether intake matches your target.${intakeNote}`,
      suggestedCalories: currentTarget + 150,
    };
  }
  if (goal === "lose" && change < -1.0) {
    return {
      shouldReview: true,
      headline: "Weight is dropping quickly",
      detail: `Your trend is moving faster than a conservative rate. Slowing down usually preserves muscle and performance.${intakeNote}`,
      suggestedCalories: currentTarget + 150,
    };
  }
  return {
    shouldReview: false,
    headline: "Progress looks consistent with your goal",
    detail: `Your 7-day average changed by ${change > 0 ? "+" : ""}${change} kg (${round(kgToLb(change), 2)} lb) per week.${intakeNote}`,
    suggestedCalories: null,
  };
}

export function scaleRecipe<T extends { quantity: number }>(
  ingredients: T[],
  fromServings: number,
  toServings: number,
): T[] {
  if (fromServings <= 0 || toServings <= 0) {
    throw new CalculationError("Servings must be greater than zero.");
  }
  const factor = toServings / fromServings;
  return ingredients.map((ingredient) => ({
    ...ingredient,
    quantity: round(ingredient.quantity * factor, 2),
  }));
}

export function scaleNutrition(
  nutrition: Macros,
  fromServings: number,
  toServings: number,
): Macros {
  if (fromServings <= 0 || toServings <= 0) {
    throw new CalculationError("Servings must be greater than zero.");
  }
  const factor = toServings / fromServings;
  return {
    calories: Math.round(nutrition.calories * factor),
    proteinG: Math.round(nutrition.proteinG * factor),
    carbsG: Math.round(nutrition.carbsG * factor),
    fatG: Math.round(nutrition.fatG * factor),
  };
}

export function recommendedWaterMl(weightKg: number): number {
  return Math.round((weightKg * 33) / 50) * 50;
}

export function recommendedStepGoal(current: number | null | undefined): number {
  if (!current || current < 2000) return 6000;
  return Math.min(12000, Math.round((current * 1.15) / 500) * 500);
}
