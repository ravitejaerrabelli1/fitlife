export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "very"
  | "extreme";

export type Goal = "lose" | "maintain" | "gain" | "bulk" | "recomp";

export type GoalPace = "slow" | "moderate" | "faster";

export type MacroPreference =
  | "balanced"
  | "higher_protein"
  | "higher_carb"
  | "lower_carb";

export type Experience = "beginner" | "intermediate" | "advanced";

export type Equipment =
  | "full_gym"
  | "dumbbells"
  | "barbells"
  | "bands"
  | "machines"
  | "bodyweight"
  | "home_gym";

export interface CalcProfile {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  pace?: GoalPace;
  bodyFatPct?: number | null;
  macroPreference?: MacroPreference;
  dailySteps?: number | null;
}

export interface Macros {
  proteinG: number;
  carbsG: number;
  fatG: number;
  calories: number;
}

export interface CalorieTargets {
  bmr: number;
  tdee: number;
  maintenanceCalories: number;
  goalCalories: number;
  dailyDelta: number;
  weeklyChangeKg: number;
  weeklyChangeLb: number;
  activityFactor: number;
  note: string;
}
