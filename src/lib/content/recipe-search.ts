import { entryQuality, exactMatch, matchQualities, normalize, variants } from "./text-match";
import type { Recipe } from "./types";

const FILLER_WORDS = new Set(["recipe", "recipes", "dish", "dishes", "with", "and", "the", "a"]);

const SYNONYMS: Record<string, string[]> = {
  soya: ["soy", "tofu"],
  soy: ["soya", "tofu"],
  tofu: ["soy", "soya"],
  curd: ["yogurt", "yoghurt"],
  dahi: ["curd", "yogurt", "yoghurt"],
  yogurt: ["curd"],
  chana: ["chickpea"],
  chickpea: ["chana"],
  chole: ["chana", "chickpea"],
  egg: ["anda"],
  anda: ["egg"],
  palak: ["spinach"],
  spinach: ["palak"],
  aloo: ["potato"],
  potato: ["aloo"],
  matar: ["peas"],
};

function recipeWords(recipe: Recipe): string[] {
  return normalize(
    [
      recipe.name,
      recipe.cuisine.replaceAll("_", " "),
      ...recipe.tags.map((tag) => tag.replaceAll("_", " ")),
      ...recipe.ingredients.map((ingredient) => ingredient.name),
    ].join(" "),
  ).split(" ");
}

/**
 * Every meaningful query word must match a word in the recipe's name, cuisine, tags or
 * ingredients, directly, through a regional synonym (soya ↔ soy/tofu, palak ↔ spinach) or,
 * when nothing contains it, through a small typo tolerance. Literal name matches sort first,
 * then synonym name matches, then ingredient-only matches.
 */
export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  const queryWords = normalize(query)
    .split(" ")
    .filter((word) => word && !FILLER_WORDS.has(word));
  if (!queryWords.length) return recipes;

  const indexed = recipes.map((recipe) => ({ recipe, words: recipeWords(recipe) }));
  const vocabulary = [...new Set(indexed.flatMap((entry) => entry.words))];
  const allowed = queryWords.map((queryWord) =>
    matchQualities(
      queryWord,
      variants(queryWord).flatMap((form) => [form, ...(SYNONYMS[form] ?? [])]),
      vocabulary,
    ),
  );

  return indexed
    .map(({ recipe, words }) => ({ recipe, quality: entryQuality(words, allowed) }))
    .filter(({ quality }) => quality !== undefined)
    .map(({ recipe }) => {
      const nameWords = normalize(recipe.name).split(" ");
      const nameHits = allowed.filter((qualities) => nameWords.some((word) => qualities.has(word))).length;
      const literalHits = queryWords.filter((queryWord) =>
        nameWords.some((word) => exactMatch(variants(queryWord), word)),
      ).length;
      return { recipe, literalHits, nameHits };
    })
    .sort((a, b) => b.literalHits - a.literalHits || b.nameHits - a.nameHits)
    .map(({ recipe }) => recipe);
}
