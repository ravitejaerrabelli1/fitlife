import { describe, expect, it } from "vitest";
import { searchFoods, servingGrams } from "./foods";

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
