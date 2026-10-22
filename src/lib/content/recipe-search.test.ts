import { describe, expect, it } from "vitest";
import { RECIPES } from "./recipes";
import { searchRecipes } from "./recipe-search";

const names = (query: string) => searchRecipes(RECIPES, query).map((recipe) => recipe.name);

describe("recipe search", () => {
  it("finds paneer dishes, ignoring filler words like 'recipes'", () => {
    expect(names("paneer")).toEqual(expect.arrayContaining(["Paneer Bhurji", "Palak Paneer"]));
    expect(names("paneer recipes")).toEqual(names("paneer"));
  });

  it("treats soya, soy and tofu as the same ingredient family", () => {
    expect(names("soya")).toEqual(expect.arrayContaining(["Soya Chunks Curry", "Teriyaki Tofu Bowl"]));
    expect(names("soya")[0]).toMatch(/^Soya/);
  });

  it("matches ingredients, regional synonyms and typos", () => {
    expect(names("spinach")).toContain("Palak Paneer");
    expect(names("chickpea")).toContain("Chana Masala");
    expect(names("panner")).toContain("Paneer Bhurji");
  });

  it("returns everything for an empty query and nothing for nonsense", () => {
    expect(searchRecipes(RECIPES, "  ")).toHaveLength(RECIPES.length);
    expect(names("xyzfood")).toEqual([]);
  });
});
