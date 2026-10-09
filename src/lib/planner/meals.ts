import { RECIPES } from "../content/recipes";
import { MEAL_SLOTS } from "../content/types";
import type {
  GroceryCategory,
  Ingredient,
  MealSlot,
  Recipe,
} from "../content/types";
import { scaleNutrition, scaleRecipe } from "../calc/engine";

export interface PlannerPreferences {
  dietPrefs: string[];
  allergies: string[];
  dislikes: string[];
  maxPrepMinutes?: number | null;
  budgetFriendlyOnly?: boolean;
  cuisines?: string[];
  boost?: string[];
}

export interface PlannedMeal {
  slot: MealSlot;
  slotLabel: string;
  recipeId: string;
  name: string;
  servings: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  prepMinutes: number;
  ingredients: Ingredient[];
  instructions: string[];
}

export interface PlannedDay {
  dayIndex: number;
  date: string;
  meals: PlannedMeal[];
  totals: { calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number };
}

export interface MealPlan {
  days: PlannedDay[];
  calorieTarget: number;
  proteinTarget: number;
  grocery: GroceryLine[];
}

export interface GroceryLine {
  name: string;
  unit: string;
  quantity: number;
  category: GroceryCategory;
}

const DIET_EXCLUSIONS: Record<string, (recipe: Recipe) => boolean> = {
  vegetarian: (r) => r.tags.includes("vegetarian") || r.tags.includes("vegan"),
  vegan: (r) => r.tags.includes("vegan"),
  pescatarian: (r) =>
    r.tags.includes("vegetarian") ||
    r.tags.includes("vegan") ||
    r.tags.includes("pescatarian"),
  halal: (r) => !hasIngredient(r, ["pork", "bacon", "ham"]),
  kosher: (r) => !hasIngredient(r, ["pork", "bacon", "shrimp", "shellfish"]),
  gluten_free: (r) => r.tags.includes("gluten_free") || !hasGluten(r),
  dairy_free: (r) => r.tags.includes("dairy_free") || !hasDairy(r),
  low_carb: (r) => r.carbsG <= 45,
  high_protein: (r) => r.proteinG >= 20,
  mediterranean: (r) => r.cuisine === "mediterranean",
  indian: (r) => r.cuisine === "indian",
  mexican: (r) => r.cuisine === "mexican",
  american: (r) => r.cuisine === "american",
  asian: (r) => r.cuisine === "asian",
  middle_eastern: (r) => r.cuisine === "middle_eastern",
};

/** Cuisine preferences are treated as a soft boost rather than a hard filter. */
const SOFT_PREFERENCES = new Set([
  "mediterranean",
  "indian",
  "mexican",
  "american",
  "asian",
  "middle_eastern",
  "high_protein",
]);

function hasIngredient(recipe: Recipe, terms: string[]): boolean {
  return recipe.ingredients.some((ingredient) =>
    terms.some((term) => ingredient.name.toLowerCase().includes(term)),
  );
}

function hasGluten(recipe: Recipe): boolean {
  return hasIngredient(recipe, [
    "bread",
    "pita",
    "couscous",
    "pasta",
    "bulgur",
    "oat flour",
    "flatbread",
    "bun",
    "tortillas",
  ]);
}

function hasDairy(recipe: Recipe): boolean {
  return recipe.ingredients.some((ingredient) => ingredient.category === "dairy");
}

const DAIRY_TERMS = [
  "milk",
  "dairy",
  "yogurt",
  "yoghurt",
  "curd",
  "kefir",
  "paneer",
  "cheese",
  "ricotta",
  "feta",
  "mozzarella",
  "parmesan",
  "butter",
  "ghee",
  "cream",
  "whey",
  "casein",
];

const NUT_TERMS = [
  "almond",
  "cashew",
  "walnut",
  "pecan",
  "pistachio",
  "hazelnut",
  "macadamia",
  "nut butter",
];

const WHEAT_TERMS = [
  "wheat",
  "flour",
  "seitan",
  "bread",
  "pita",
  "couscous",
  "pasta",
  "bulgur",
  "flatbread",
  "bun",
  "tortilla",
  "cracker",
];

/** Canonical allergens map to the ingredient names that actually contain them. */
const ALLERGEN_TERMS: Record<string, string[]> = {
  milk: DAIRY_TERMS,
  dairy: DAIRY_TERMS,
  lactose: DAIRY_TERMS,
  egg: ["egg", "mayonnaise", "mayo", "albumen"],
  eggs: ["egg", "mayonnaise", "mayo", "albumen"],
  peanut: ["peanut", "groundnut"],
  peanuts: ["peanut", "groundnut"],
  nut: NUT_TERMS,
  nuts: NUT_TERMS,
  tree_nut: NUT_TERMS,
  "tree nut": NUT_TERMS,
  "tree nuts": NUT_TERMS,
  soy: ["soy", "soya", "tofu", "tempeh", "edamame", "miso"],
  soya: ["soy", "soya", "tofu", "tempeh", "edamame", "miso"],
  wheat: WHEAT_TERMS,
  gluten: WHEAT_TERMS,
  fish: ["fish", "salmon", "tuna", "cod", "tilapia", "anchovy", "sardine"],
  shellfish: ["shellfish", "shrimp", "prawn", "crab", "lobster", "scallop"],
  shrimp: ["shrimp", "prawn"],
  sesame: ["sesame", "tahini"],
};

const DAIRY_ALLERGENS = new Set(["milk", "dairy", "lactose"]);

const PLANT_DAIRY_ALTERNATIVES =
  /\b(coconut|soy|soya|almond|oat|rice|cashew|peanut|nut|cocoa) (milk|cream|yogurt|yoghurt|butter)\b/g;

function hasAllergen(recipe: Recipe, allergy: string): boolean {
  if (DAIRY_ALLERGENS.has(allergy)) {
    if (hasDairy(recipe)) return true;
    return recipe.ingredients.some((ingredient) => {
      const name = ingredient.name.toLowerCase().replace(PLANT_DAIRY_ALTERNATIVES, "");
      return DAIRY_TERMS.some((term) => name.includes(term));
    });
  }
  const terms = ALLERGEN_TERMS[allergy] ?? [allergy];
  return hasIngredient(recipe, terms);
}

export function filterRecipes(
  preferences: PlannerPreferences,
  slot?: MealSlot,
): Recipe[] {
  const allergies = preferences.allergies.map((a) => a.toLowerCase()).filter(Boolean);
  const dislikes = preferences.dislikes.map((d) => d.toLowerCase()).filter(Boolean);

  return RECIPES.filter((recipe) => {
    if (slot && !recipe.slots.includes(slot)) return false;
    if (
      preferences.maxPrepMinutes &&
      recipe.prepMinutes > preferences.maxPrepMinutes
    ) {
      return false;
    }
    if (preferences.budgetFriendlyOnly && !recipe.budgetFriendly) return false;
    for (const pref of preferences.dietPrefs) {
      if (pref === "none" || SOFT_PREFERENCES.has(pref)) continue;
      const rule = DIET_EXCLUSIONS[pref];
      if (rule && !rule(recipe)) return false;
    }
    if (allergies.some((allergy) => hasAllergen(recipe, allergy))) return false;
    if (dislikes.length && hasIngredient(recipe, dislikes)) return false;
    return true;
  });
}

function score(
  recipe: Recipe,
  slotCalories: number,
  preferences: PlannerPreferences,
  proteinDensityTarget: number,
): number {
  const perServing = recipe.calories;
  const bestServings = clampServings(slotCalories / perServing);
  const delta = Math.abs(perServing * bestServings - slotCalories);
  let value = delta;
  const proteinDensity = (recipe.proteinG * 4) / recipe.calories;
  if (proteinDensity < proteinDensityTarget) {
    value += (proteinDensityTarget - proteinDensity) * 600;
  }
  for (const pref of preferences.dietPrefs) {
    if (SOFT_PREFERENCES.has(pref)) {
      const rule = DIET_EXCLUSIONS[pref];
      if (rule && rule(recipe)) value -= 120;
    }
  }
  for (const boosted of preferences.boost ?? []) {
    if (recipe.id === boosted || recipe.tags.includes(boosted)) value -= 150;
  }
  return value;
}

function clampServings(raw: number): number {
  const rounded = Math.round(raw * 2) / 2;
  return Math.min(3, Math.max(0.5, rounded));
}

function toPlannedMeal(
  recipe: Recipe,
  slot: MealSlot,
  slotLabel: string,
  targetCalories: number,
): PlannedMeal {
  const servings = clampServings(targetCalories / recipe.calories);
  const nutrition = scaleNutrition(
    {
      calories: recipe.calories,
      proteinG: recipe.proteinG,
      carbsG: recipe.carbsG,
      fatG: recipe.fatG,
    },
    1,
    servings,
  );
  return {
    slot,
    slotLabel,
    recipeId: recipe.id,
    name: recipe.name,
    servings,
    calories: nutrition.calories,
    proteinG: nutrition.proteinG,
    carbsG: nutrition.carbsG,
    fatG: nutrition.fatG,
    fiberG: Math.round(recipe.fiberG * servings),
    prepMinutes: recipe.prepMinutes,
    ingredients: scaleRecipe(recipe.ingredients, recipe.servings, servings * recipe.servings),
    instructions: recipe.instructions,
  };
}

export interface GenerateOptions {
  days: number;
  calorieTarget: number;
  proteinTarget: number;
  preferences: PlannerPreferences;
  startDate?: Date;
  includeEveningSnack?: boolean;
  seed?: number;
}

export function generateMealPlan(options: GenerateOptions): MealPlan {
  const {
    days,
    calorieTarget,
    proteinTarget,
    preferences,
    startDate = new Date(),
    includeEveningSnack = false,
  } = options;

  const slots = MEAL_SLOTS.filter(
    (slot) => includeEveningSnack || slot.key !== "evening_snack",
  );
  const shareTotal = slots.reduce((sum, slot) => sum + slot.share, 0);
  const proteinDensityTarget = Math.min(
    0.45,
    (proteinTarget * 4) / Math.max(calorieTarget, 1),
  );

  const usedRecently: string[] = [];
  const plannedDays: PlannedDay[] = [];

  for (let dayIndex = 0; dayIndex < days; dayIndex++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayIndex);
    const meals: PlannedMeal[] = [];

    for (const slot of slots) {
      const slotCalories = (calorieTarget * slot.share) / shareTotal;
      const candidates = filterRecipes(preferences, slot.key);
      const pool = candidates.length ? candidates : filterRecipes(preferences);
      if (!pool.length) continue;

      const ranked = [...pool].sort(
        (a, b) =>
          score(a, slotCalories, preferences, proteinDensityTarget) +
          recencyPenalty(a.id, usedRecently) -
          (score(b, slotCalories, preferences, proteinDensityTarget) +
            recencyPenalty(b.id, usedRecently)),
      );
      const chosen = ranked[0];
      usedRecently.unshift(chosen.id);
      if (usedRecently.length > 8) usedRecently.pop();
      meals.push(toPlannedMeal(chosen, slot.key, slot.label, slotCalories));
    }

    plannedDays.push({
      dayIndex,
      date: date.toISOString().slice(0, 10),
      meals,
      totals: sumMeals(meals),
    });
  }

  return {
    days: plannedDays,
    calorieTarget,
    proteinTarget,
    grocery: buildGroceryList(plannedDays),
  };
}

function recencyPenalty(id: string, usedRecently: string[]): number {
  const index = usedRecently.indexOf(id);
  if (index === -1) return 0;
  return 400 - index * 45;
}

export function sumMeals(meals: PlannedMeal[]) {
  return meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + meal.calories,
      proteinG: totals.proteinG + meal.proteinG,
      carbsG: totals.carbsG + meal.carbsG,
      fatG: totals.fatG + meal.fatG,
      fiberG: totals.fiberG + meal.fiberG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
  );
}

export function buildGroceryList(days: PlannedDay[]): GroceryLine[] {
  const map = new Map<string, GroceryLine>();
  for (const day of days) {
    for (const meal of day.meals) {
      for (const ingredient of meal.ingredients) {
        const key = `${ingredient.name}|${ingredient.unit}`;
        const existing = map.get(key);
        if (existing) {
          existing.quantity = Math.round((existing.quantity + ingredient.quantity) * 100) / 100;
        } else {
          map.set(key, {
            name: ingredient.name,
            unit: ingredient.unit,
            quantity: ingredient.quantity,
            category: ingredient.category,
          });
        }
      }
    }
  }
  const order: GroceryCategory[] = [
    "protein",
    "vegetables",
    "fruits",
    "grains",
    "dairy",
    "pantry",
    "spices",
    "supplements",
  ];
  return [...map.values()].sort(
    (a, b) =>
      order.indexOf(a.category) - order.indexOf(b.category) ||
      a.name.localeCompare(b.name),
  );
}

/** Finds an alternative meal with a similar calorie and macro profile. */
export function swapMeal(
  meal: PlannedMeal,
  preferences: PlannerPreferences,
  excludeIds: string[] = [],
): PlannedMeal | null {
  const pool = filterRecipes(preferences, meal.slot).filter(
    (recipe) => recipe.id !== meal.recipeId && !excludeIds.includes(recipe.id),
  );
  if (!pool.length) return null;

  const ranked = pool
    .map((recipe) => {
      const servings = clampServings(meal.calories / recipe.calories);
      const scaled = scaleNutrition(
        {
          calories: recipe.calories,
          proteinG: recipe.proteinG,
          carbsG: recipe.carbsG,
          fatG: recipe.fatG,
        },
        1,
        servings,
      );
      const distance =
        Math.abs(scaled.calories - meal.calories) +
        Math.abs(scaled.proteinG - meal.proteinG) * 8 +
        Math.abs(scaled.carbsG - meal.carbsG) * 2 +
        Math.abs(scaled.fatG - meal.fatG) * 3;
      return { recipe, distance };
    })
    .sort((a, b) => a.distance - b.distance);

  return toPlannedMeal(
    ranked[0].recipe,
    meal.slot,
    meal.slotLabel,
    meal.calories,
  );
}
