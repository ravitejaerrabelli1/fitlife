import { describe, expect, it } from "vitest";
import {
  ACTIVITY_FACTORS,
  CalculationError,
  bmiCategory,
  calculateBMI,
  calculateBMR,
  calculateEstimatedCardioCalories,
  calculateGoalCalories,
  calculateMacros,
  calculateMaintenanceCalories,
  calculateTDEE,
  calculateWeightTrend,
  estimateBodyFat,
  macroCalories,
  recommendedWaterMl,
  scaleNutrition,
  scaleRecipe,
  suggestCalorieAdjustment,
} from "./engine";
import type { CalcProfile } from "./types";
import { cmToFeetInches, feetInchesToCm, kgToLb, lbToKg } from "./units";

const male: CalcProfile = {
  age: 30,
  sex: "male",
  heightCm: 180,
  weightKg: 80,
  activityLevel: "moderate",
  goal: "bulk",
};

const female: CalcProfile = {
  age: 28,
  sex: "female",
  heightCm: 165,
  weightKg: 65,
  activityLevel: "light",
  goal: "lose",
  pace: "moderate",
};

describe("BMR", () => {
  it("matches Mifflin-St Jeor for men", () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(calculateBMR(male)).toBe(1780);
  });

  it("matches Mifflin-St Jeor for women", () => {
    // 10*65 + 6.25*165 - 5*28 - 161 = 1380.25 -> 1380
    expect(calculateBMR(female)).toBe(1380);
  });

  it("uses Katch-McArdle when body fat is known", () => {
    const lean = 80 * 0.85;
    expect(calculateBMR({ ...male, bodyFatPct: 15 })).toBe(
      Math.round(370 + 21.6 * lean),
    );
  });

  it.each([
    [{ ...male, age: 5 }, "age"],
    [{ ...male, heightCm: 40 }, "height"],
    [{ ...male, weightKg: 500 }, "weight"],
    [{ ...male, bodyFatPct: 95 }, "body fat"],
  ])("rejects unrealistic %s", (profile) => {
    expect(() => calculateBMR(profile as CalcProfile)).toThrow(CalculationError);
  });

  it("rejects non-numeric input", () => {
    expect(() =>
      calculateBMR({ ...male, weightKg: Number.NaN }),
    ).toThrow(CalculationError);
  });
});

describe("TDEE", () => {
  it("applies the activity factor", () => {
    expect(calculateTDEE(male)).toBe(Math.round(1780 * 1.55));
  });

  it("increases monotonically with activity level", () => {
    const values = (
      Object.keys(ACTIVITY_FACTORS) as (keyof typeof ACTIVITY_FACTORS)[]
    ).map((activityLevel) => calculateTDEE({ ...male, activityLevel }));
    const sorted = [...values].sort((a, b) => a - b);
    expect(values).toEqual(sorted);
  });

  it("maintenance equals TDEE", () => {
    expect(calculateMaintenanceCalories(female)).toBe(calculateTDEE(female));
  });
});

describe("goal calories", () => {
  it("creates a deficit for fat loss", () => {
    const result = calculateGoalCalories(female);
    expect(result.goalCalories).toBeLessThan(result.maintenanceCalories);
    expect(result.dailyDelta).toBeLessThan(0);
    expect(result.weeklyChangeKg).toBeLessThan(0);
  });

  it("creates a surplus for muscle gain", () => {
    const result = calculateGoalCalories(male);
    expect(result.goalCalories).toBeGreaterThan(result.maintenanceCalories);
    expect(result.weeklyChangeLb).toBeGreaterThan(0);
  });

  it("keeps maintenance unchanged", () => {
    const result = calculateGoalCalories({ ...male, goal: "maintain" });
    expect(result.goalCalories).toBe(result.maintenanceCalories);
    expect(result.dailyDelta).toBe(0);
  });

  it("keeps recomposition close to maintenance", () => {
    const result = calculateGoalCalories({ ...male, goal: "recomp" });
    const ratio = result.goalCalories / result.maintenanceCalories;
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThanOrEqual(1);
  });

  it("never drops below a conservative floor", () => {
    const tiny: CalcProfile = {
      age: 65,
      sex: "female",
      heightCm: 150,
      weightKg: 45,
      activityLevel: "sedentary",
      goal: "lose",
      pace: "faster",
    };
    const result = calculateGoalCalories(tiny);
    expect(result.goalCalories).toBeGreaterThanOrEqual(1200);
    expect(result.note).toContain("estimates");
  });

  it("never exceeds a 25% deficit at the fastest pace", () => {
    const result = calculateGoalCalories({ ...male, goal: "lose", pace: "faster" });
    expect(result.goalCalories / result.maintenanceCalories).toBeGreaterThan(0.75);
  });
});

describe("macros", () => {
  it("adds up to the calorie target", () => {
    const targets = calculateGoalCalories(male);
    const macros = calculateMacros(male, targets.goalCalories);
    expect(Math.abs(macroCalories(macros) - macros.calories)).toBeLessThanOrEqual(
      25,
    );
  });

  it("prioritises protein on a cut", () => {
    const cutting = calculateMacros({ ...female, goal: "lose" }, 1600);
    const maintaining = calculateMacros({ ...female, goal: "maintain" }, 1600);
    expect(cutting.proteinG).toBeGreaterThan(maintaining.proteinG);
  });

  it("respects a lower-carb preference", () => {
    const lowCarb = calculateMacros(
      { ...male, macroPreference: "lower_carb" },
      2700,
    );
    const higherCarb = calculateMacros(
      { ...male, macroPreference: "higher_carb" },
      2700,
    );
    expect(lowCarb.carbsG).toBeLessThan(higherCarb.carbsG);
    expect(lowCarb.fatG).toBeGreaterThan(higherCarb.fatG);
  });

  it("keeps macros valid at a low calorie target", () => {
    const macros = calculateMacros({ ...female, weightKg: 100 }, 1400);
    expect(macros.carbsG).toBeGreaterThanOrEqual(0);
    expect(Math.abs(macroCalories(macros) - 1400)).toBeLessThanOrEqual(28);
  });

  it("rejects unrealistic calorie targets", () => {
    expect(() => calculateMacros(male, 200)).toThrow(CalculationError);
    expect(() => calculateMacros(male, 12000)).toThrow(CalculationError);
  });
});

describe("BMI", () => {
  it("computes a known value", () => {
    expect(calculateBMI(80, 180)).toBe(24.7);
  });

  it("labels categories", () => {
    expect(bmiCategory(17)).toMatch(/Below/);
    expect(bmiCategory(22)).toMatch(/Typical/);
    expect(bmiCategory(27)).toMatch(/Above/);
    expect(bmiCategory(33)).toMatch(/Well above/);
  });

  it("rejects a zero height", () => {
    expect(() => calculateBMI(80, 0)).toThrow(CalculationError);
  });
});

describe("body fat estimate", () => {
  it("returns null without circumferences", () => {
    expect(estimateBodyFat({ sex: "male", heightCm: 180 })).toBeNull();
  });

  it("estimates for men", () => {
    const value = estimateBodyFat({
      sex: "male",
      heightCm: 180,
      waistCm: 85,
      neckCm: 38,
    });
    expect(value).toBeGreaterThan(8);
    expect(value).toBeLessThan(25);
  });

  it("requires hip measurement for women", () => {
    expect(
      estimateBodyFat({ sex: "female", heightCm: 165, waistCm: 75, neckCm: 32 }),
    ).toBeNull();
    expect(
      estimateBodyFat({
        sex: "female",
        heightCm: 165,
        waistCm: 75,
        neckCm: 32,
        hipCm: 95,
      }),
    ).toBeGreaterThan(15);
  });
});

describe("unit conversion", () => {
  it("round-trips weight", () => {
    expect(lbToKg(kgToLb(70))).toBeCloseTo(70, 6);
  });

  it("round-trips height", () => {
    const { feet, inches } = cmToFeetInches(180);
    expect(feet).toBe(5);
    expect(inches).toBe(11);
    expect(feetInchesToCm(5, 11)).toBeCloseTo(180.34, 2);
  });

  it("rolls 12 inches into the next foot", () => {
    expect(cmToFeetInches(182.8).inches).toBeLessThan(12);
  });
});

describe("recipe scaling", () => {
  it("scales ingredients", () => {
    const scaled = scaleRecipe([{ name: "oats", quantity: 80 }], 2, 4);
    expect(scaled[0].quantity).toBe(160);
  });

  it("scales nutrition", () => {
    const scaled = scaleNutrition(
      { calories: 400, proteinG: 30, carbsG: 40, fatG: 10 },
      2,
      3,
    );
    expect(scaled).toEqual({ calories: 600, proteinG: 45, carbsG: 60, fatG: 15 });
  });

  it("rejects zero servings", () => {
    expect(() => scaleRecipe([{ quantity: 1 }], 0, 2)).toThrow(CalculationError);
    expect(() =>
      scaleNutrition({ calories: 1, proteinG: 1, carbsG: 1, fatG: 1 }, 1, 0),
    ).toThrow(CalculationError);
  });
});

describe("weight trend", () => {
  const series = Array.from({ length: 21 }, (_, i) => ({
    date: `2025-01-${String(i + 1).padStart(2, "0")}`,
    weightKg: 80 - i * 0.1 + (i % 2 === 0 ? 0.3 : -0.3),
  }));

  it("handles empty input", () => {
    const trend = calculateWeightTrend([]);
    expect(trend.direction).toBe("unknown");
    expect(trend.points).toHaveLength(0);
  });

  it("smooths daily fluctuation", () => {
    const trend = calculateWeightTrend(series);
    expect(trend.points).toHaveLength(21);
    expect(trend.sevenDayAverageKg).not.toBeNull();
    expect(trend.direction).toBe("down");
    expect(trend.weeklyChangeKg).toBeLessThan(0);
  });

  it("reports stability when weight is flat", () => {
    const flat = Array.from({ length: 14 }, (_, i) => ({
      date: `2025-02-${String(i + 1).padStart(2, "0")}`,
      weightKg: 75 + (i % 2 === 0 ? 0.2 : -0.2),
    }));
    expect(calculateWeightTrend(flat).direction).toBe("stable");
  });

  it("sorts unordered input", () => {
    const trend = calculateWeightTrend([
      { date: "2025-03-02", weightKg: 70 },
      { date: "2025-03-01", weightKg: 71 },
    ]);
    expect(trend.points[0].date).toBe("2025-03-01");
    expect(trend.latestKg).toBe(70);
  });
});

describe("cardio estimates", () => {
  it("uses the MET formula", () => {
    expect(
      calculateEstimatedCardioCalories({ met: 7, minutes: 30, weightKg: 80 }),
    ).toBe(Math.round((7 * 3.5 * 80 * 30) / 200));
  });

  it("returns zero for invalid input", () => {
    expect(
      calculateEstimatedCardioCalories({ met: 0, minutes: 30, weightKg: 80 }),
    ).toBe(0);
    expect(
      calculateEstimatedCardioCalories({ met: 7, minutes: -5, weightKg: 80 }),
    ).toBe(0);
  });
});

describe("adaptive calorie suggestions", () => {
  const stableTrend = calculateWeightTrend(
    Array.from({ length: 21 }, (_, i) => ({
      date: `2025-04-${String(i + 1).padStart(2, "0")}`,
      weightKg: 82,
    })),
  );

  it("waits for enough data", () => {
    const result = suggestCalorieAdjustment({
      goal: "lose",
      currentTarget: 2000,
      averageIntake: 2100,
      trend: stableTrend,
      weeksOfData: 1,
    });
    expect(result.shouldReview).toBe(false);
    expect(result.suggestedCalories).toBeNull();
  });

  it("suggests a small review when fat loss has stalled", () => {
    const result = suggestCalorieAdjustment({
      goal: "lose",
      currentTarget: 2000,
      averageIntake: 2250,
      trend: stableTrend,
      weeksOfData: 3,
    });
    expect(result.shouldReview).toBe(true);
    expect(result.suggestedCalories).toBe(1850);
    expect(result.detail).toContain("review");
  });

  it("suggests more calories when a bulk is not progressing", () => {
    const result = suggestCalorieAdjustment({
      goal: "bulk",
      currentTarget: 2800,
      averageIntake: 2700,
      trend: stableTrend,
      weeksOfData: 4,
    });
    expect(result.suggestedCalories).toBe(2950);
  });

  it("never suggests below the safety floor", () => {
    const result = suggestCalorieAdjustment({
      goal: "lose",
      currentTarget: 1250,
      averageIntake: 1300,
      trend: stableTrend,
      weeksOfData: 5,
    });
    expect(result.suggestedCalories).toBeGreaterThanOrEqual(1200);
  });
});

describe("hydration", () => {
  it("scales with body weight", () => {
    expect(recommendedWaterMl(80)).toBeGreaterThan(recommendedWaterMl(60));
  });
});
