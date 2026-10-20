import { describe, expect, it } from "vitest";
import { FOODS, nutritionFor, searchFoods, servingGrams } from "./foods";

const names = (query: string) => searchFoods(query).map((food) => food.name);

describe("food search", () => {
  it("matches multi-word dishes", () => {
    expect(names("Chicken biryani")[0]).toBe("Chicken biryani");
  });

  it("tolerates common misspellings", () => {
    expect(names("chicken briyani")).toContain("Chicken biryani");
    expect(names("dosai")).toContain("Plain dosa");
  });

  it("finds South Indian foods by region", () => {
    const southIndian = names("south indian");
    expect(southIndian).toEqual(expect.arrayContaining(["Idli", "Sambar", "Masala dosa"]));
    expect(southIndian).not.toContain("Chapati / roti");
  });

  it("does not fuzzy-match short words", () => {
    expect(names("egg")).not.toContain("Feta cheese");
  });
});

describe("servingGrams", () => {
  it("reads grams from serving labels", () => {
    expect(servingGrams("100 g")).toBe(100);
    expect(servingGrams("1 piece (40 g)")).toBe(40);
    expect(servingGrams("30 g scoop")).toBe(30);
    expect(servingGrams("250 ml")).toBeUndefined();
  });
});

describe("catalog coverage", () => {
  it("finds common fast food and Indian dishes", () => {
    expect(names("chicken burger")[0]).toBe("Chicken burger");
    expect(names("veg briyani")).toContain("Veg biryani");
    expect(names("chettinad")).toContain("Chicken chettinad");
    expect(names("fried rice")).toEqual(expect.arrayContaining(["Veg fried rice", "Chicken fried rice"]));
  });

  it("has unique ids", () => {
    const ids = FOODS.map((food) => food.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("nutritionFor", () => {
  const biryani = FOODS.find((food) => food.id === "chicken-biryani")!;
  const egg = FOODS.find((food) => food.id === "egg")!;

  it("scales by grams from the serving weight", () => {
    expect(nutritionFor(biryani, 150, "g")).toEqual({
      calories: 270,
      proteinG: 12,
      carbsG: 33,
      fatG: 10,
      fiberG: 1,
    });
  });

  it("scales by servings", () => {
    expect(nutritionFor(egg, 2, "serving")?.calories).toBe(144);
  });

  it("rejects grams without a gram basis and non-positive amounts", () => {
    expect(nutritionFor(egg, 50, "g")).toBeUndefined();
    expect(nutritionFor(biryani, 0, "g")).toBeUndefined();
  });
});
