export type MealSlot =
  | "breakfast"
  | "morning_snack"
  | "lunch"
  | "afternoon_snack"
  | "dinner"
  | "evening_snack";

export const MEAL_SLOTS: { key: MealSlot; label: string; share: number }[] = [
  { key: "breakfast", label: "Breakfast", share: 0.24 },
  { key: "morning_snack", label: "Morning snack", share: 0.08 },
  { key: "lunch", label: "Lunch", share: 0.28 },
  { key: "afternoon_snack", label: "Afternoon snack", share: 0.08 },
  { key: "dinner", label: "Dinner", share: 0.27 },
  { key: "evening_snack", label: "Evening snack", share: 0.05 },
];

export type Cuisine =
  | "american"
  | "indian"
  | "mexican"
  | "mediterranean"
  | "asian"
  | "middle_eastern";

export type GroceryCategory =
  | "protein"
  | "vegetables"
  | "fruits"
  | "grains"
  | "dairy"
  | "pantry"
  | "spices"
  | "supplements";

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  category: GroceryCategory;
}

export interface Recipe {
  id: string;
  name: string;
  cuisine: Cuisine;
  slots: MealSlot[];
  servings: number;
  prepMinutes: number;
  /** Per serving. */
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  tags: string[];
  ingredients: Ingredient[];
  instructions: string[];
  budgetFriendly: boolean;
  mealPrep: boolean;
}

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "legs"
  | "core";

export type EquipmentTag =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "band";

export interface Exercise {
  id: string;
  name: string;
  group: MuscleGroup;
  targets: string[];
  equipment: EquipmentTag[];
  difficulty: "beginner" | "intermediate" | "advanced";
  defaultSets: number;
  defaultReps: string;
  restSeconds: number;
  tempo?: string;
  met: number;
  compound: boolean;
  setup: string[];
  steps: string[];
  formTips: string[];
  mistakes: string[];
  breathing: string;
  easier: string;
  harder: string;
}

export interface CardioActivity {
  id: string;
  name: string;
  intensity: "low" | "moderate" | "high";
  met: number;
  defaultMinutes: number;
  beginner: string;
  intermediate: string;
  advanced: string;
  warmUp: string;
  coolDown: string;
  notes: string;
}

export interface FoodItem {
  id: string;
  name: string;
  brand: string;
  serving: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  tags: string[];
  restaurant?: boolean;
}

export interface Supplement {
  id: string;
  name: string;
  what: string;
  evidence: string;
  typicalUse: string;
  considerations: string;
  talkToProfessional: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  body: string[];
}
