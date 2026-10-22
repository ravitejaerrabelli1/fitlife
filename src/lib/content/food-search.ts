import { FOODS, RESTAURANT_ESTIMATES } from "./foods";
import type { FoodItem } from "./types";
import { entryQuality, matchQualities, normalize, variants } from "./text-match";
import usdaRows from "./usda-foods.json";

type UsdaRow = [number, string, string, number, number, number, number, number];

/** USDA FoodData Central SR Legacy foods; nutrition is per 100 g. */
export const USDA_FOODS: FoodItem[] = (usdaRows as UsdaRow[]).map(
  ([fdcId, name, tag, calories, proteinG, carbsG, fatG, fiberG]) => ({
    id: `usda-${fdcId}`,
    name,
    brand: "USDA",
    serving: "100 g",
    calories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    tags: [tag],
  }),
);

interface IndexedFood {
  item: FoodItem;
  name: string;
  words: string[];
  curated: boolean;
}

const INDEX: IndexedFood[] = [
  ...[...FOODS, ...RESTAURANT_ESTIMATES].map((item) => ({ item, curated: true })),
  ...USDA_FOODS.map((item) => ({ item, curated: false })),
].map(({ item, curated }) => ({
  item,
  curated,
  name: normalize(item.name),
  words: normalize(
    [item.name, item.brand, ...item.tags.map((tag) => tag.replaceAll("_", " "))].join(" "),
  ).split(" "),
}));

const VOCABULARY = [...new Set(INDEX.flatMap((entry) => entry.words))];

/** 0: name starts with the query as whole words, 1: contains it as whole words, 2: starts with it, 3: other. */
function matchRank(name: string, q: string): number {
  const padded = ` ${name} `;
  const wholeWord = [` ${q} `, ` ${q}s `, ` ${q}es `].find((form) => padded.includes(form));
  if (wholeWord) return padded.startsWith(wholeWord) ? 0 : 1;
  return name.startsWith(q) ? 2 : 3;
}

/**
 * Matches every query word against name, brand and tags (see `matchQualities`), so "briyani" finds
 * biryani and "aple" finds apples before maple. Hand-written entries come before USDA ones, then
 * better word matches, then closer and shorter names.
 */
export function searchFoods(query: string, limit = 50): FoodItem[] {
  const q = normalize(query);
  if (!q) return INDEX.filter((entry) => entry.curated).slice(0, limit).map((entry) => entry.item);
  const allowed = q
    .split(" ")
    .map((queryWord) => matchQualities(queryWord, variants(queryWord), VOCABULARY));
  return INDEX.map((entry) => ({ entry, quality: entryQuality(entry.words, allowed) }))
    .filter((match): match is { entry: IndexedFood; quality: number } => match.quality !== undefined)
    .map(({ entry, quality }) => ({ entry, quality, rank: matchRank(entry.name, q) }))
    .sort(
      (a, b) =>
        Number(b.entry.curated) - Number(a.entry.curated) ||
        a.quality - b.quality ||
        a.rank - b.rank ||
        a.entry.name.length - b.entry.name.length,
    )
    .slice(0, limit)
    .map(({ entry }) => entry.item);
}
