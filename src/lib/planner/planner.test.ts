import { describe, expect, it } from "vitest";
import {
  buildGroceryList,
  filterRecipes,
  generateMealPlan,
  swapMeal,
  type PlannerPreferences,
} from "./meals";
import {
  availableEquipmentTags,
  estimatedOneRepMax,
  generateWorkoutProgram,
  sessionVolume,
  suggestProgression,
} from "./workouts";
import { generateCardioPlan } from "./cardio";
import { getExercise } from "../content/exercises";

const basePreferences: PlannerPreferences = {
  dietPrefs: [],
  allergies: [],
  dislikes: [],
};

describe("meal planner", () => {
  it("plans the requested number of days near the calorie target", () => {
    const plan = generateMealPlan({
      days: 3,
      calorieTarget: 2000,
      proteinTarget: 150,
      preferences: basePreferences,
    });

    expect(plan.days).toHaveLength(3);
    for (const day of plan.days) {
      expect(day.meals.length).toBeGreaterThan(0);
      expect(day.totals.calories).toBeGreaterThan(1600);
      expect(day.totals.calories).toBeLessThan(2400);
    }
  });

  it("respects dietary preferences and allergies", () => {
    const vegan = filterRecipes({
      ...basePreferences,
      dietPrefs: ["vegan"],
    });
    expect(vegan.length).toBeGreaterThan(0);
    expect(vegan.every((recipe) => recipe.tags.includes("vegan"))).toBe(true);

    const nutFree = filterRecipes({ ...basePreferences, allergies: ["peanut"] });
    expect(
      nutFree.every((recipe) =>
        recipe.ingredients.every(
          (ingredient) => !ingredient.name.toLowerCase().includes("peanut"),
        ),
      ),
    ).toBe(true);
  });

  it("consolidates grocery quantities across days", () => {
    const plan = generateMealPlan({
      days: 7,
      calorieTarget: 2200,
      proteinTarget: 160,
      preferences: basePreferences,
    });
    const grocery = buildGroceryList(plan.days);

    expect(grocery.length).toBeGreaterThan(0);
    const keys = grocery.map((line) => `${line.name}|${line.unit}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(grocery.every((line) => line.quantity > 0)).toBe(true);
  });

  it("swaps a meal for a different recipe in the same slot", () => {
    const plan = generateMealPlan({
      days: 1,
      calorieTarget: 2000,
      proteinTarget: 150,
      preferences: basePreferences,
    });
    const meal = plan.days[0].meals[0];
    const swapped = swapMeal(meal, basePreferences);

    expect(swapped).not.toBeNull();
    expect(swapped?.recipeId).not.toBe(meal.recipeId);
    expect(swapped?.slot).toBe(meal.slot);
  });
});

describe("workout planner", () => {
  it("builds a program with the requested number of training days", () => {
    const program = generateWorkoutProgram({
      goal: "bulk",
      experience: "beginner",
      daysPerWeek: 4,
      sessionMinutes: 45,
      equipment: ["full_gym"],
    });

    expect(program.days).toHaveLength(4);
    for (const day of program.days) {
      expect(day.exercises.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("only prescribes exercises the user has equipment for", () => {
    const tags = availableEquipmentTags(["bodyweight"]);
    const program = generateWorkoutProgram({
      goal: "lose",
      experience: "beginner",
      daysPerWeek: 3,
      sessionMinutes: 30,
      equipment: ["bodyweight"],
    });

    for (const day of program.days) {
      for (const item of day.exercises) {
        const exercise = getExercise(item.exerciseId);
        expect(exercise).toBeDefined();
        expect(exercise?.equipment.some((tag) => tags.includes(tag))).toBe(true);
      }
    }
  });

  it("waits for data before suggesting progression", () => {
    const suggestion = suggestProgression({
      history: [{ weightKg: 40, reps: 10, date: "2026-01-01" }],
      repRange: "8-12",
    });
    expect(suggestion.action).toBe("collect_data");
  });

  it("adds load only when every set hit the top of the rep range", () => {
    const history = [
      { weightKg: 40, reps: 10, date: "2026-01-01" },
      { weightKg: 40, reps: 12, date: "2026-01-08" },
      { weightKg: 40, reps: 12, date: "2026-01-08" },
    ];
    const suggestion = suggestProgression({ history, repRange: "8-12" });
    expect(suggestion.action).toBe("increase_load");
    expect(suggestion.suggestedWeightKg).toBeGreaterThan(40);

    const partial = suggestProgression({
      history: [
        { weightKg: 40, reps: 12, date: "2026-01-01" },
        { weightKg: 40, reps: 12, date: "2026-01-08" },
        { weightKg: 40, reps: 9, date: "2026-01-08" },
      ],
      repRange: "8-12",
    });
    expect(partial.action).toBe("increase_reps");
  });

  it("holds load when pain or a form issue is reported", () => {
    const suggestion = suggestProgression({
      history: [
        { weightKg: 60, reps: 12, date: "2026-01-01" },
        { weightKg: 60, reps: 12, date: "2026-01-08" },
      ],
      repRange: "8-12",
      reportedPainOrFormIssue: true,
    });
    expect(suggestion.action).toBe("hold");
  });

  it("computes volume and estimated one-rep max", () => {
    expect(sessionVolume([{ weightKg: 50, reps: 10 }, { weightKg: 50, reps: 8 }])).toBe(
      900,
    );
    expect(estimatedOneRepMax(100, 5)).toBeCloseTo(116.7, 1);
    expect(estimatedOneRepMax(0, 5)).toBe(0);
  });
});

describe("cardio planner", () => {
  it("schedules the requested number of sessions", () => {
    const plan = generateCardioPlan({
      goal: "lose",
      experience: "beginner",
      daysPerWeek: 3,
      weightKg: 80,
    });

    expect(plan.slots).toHaveLength(3);
    expect(plan.weeklyMinutes).toBeGreaterThan(0);
    expect(new Set(plan.slots.map((slot) => slot.dayIndex)).size).toBe(3);
    expect(plan.slots.every((slot) => slot.estimatedCalories > 0)).toBe(true);
  });

  it("returns an empty schedule when cardio is switched off", () => {
    const plan = generateCardioPlan({
      goal: "bulk",
      experience: "advanced",
      daysPerWeek: 0,
      weightKg: 90,
    });
    expect(plan.slots).toHaveLength(0);
    expect(plan.weeklyMinutes).toBe(0);
  });
});
