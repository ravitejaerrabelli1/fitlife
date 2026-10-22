import { FOODS, RESTAURANT_ESTIMATES } from "./foods";
import type { FoodItem } from "./types";
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

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

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

/** Optimal string alignment distance: edits plus adjacent transpositions. */
function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** The query word itself plus its singular form, so "eggs" also matches "egg". */
function variants(queryWord: string): string[] {
  if (queryWord.length > 3 && queryWord.endsWith("ies")) return [queryWord, `${queryWord.slice(0, -3)}y`];
  if (queryWord.length > 3 && queryWord.endsWith("es")) return [queryWord, queryWord.slice(0, -2), queryWord.slice(0, -1)];
  if (queryWord.length > 3 && queryWord.endsWith("s")) return [queryWord, queryWord.slice(0, -1)];
  return [queryWord];
}

function exactMatch(forms: string[], word: string): boolean {
  return forms.some((form) => word.includes(form));
}

function fuzzyMatch(queryWord: string, word: string): boolean {
  const tolerance = queryWord.length >= 7 ? 2 : queryWord.length >= 4 ? 1 : 0;
  return (
    tolerance > 0 &&
    Math.abs(word.length - queryWord.length) <= tolerance &&
    editDistance(queryWord, word) <= tolerance
  );
}

/** 0: name starts with the query as whole words, 1: contains it as whole words, 2: starts with it, 3: other. */
function matchRank(name: string, q: string): number {
  const padded = ` ${name} `;
  const wholeWord = [` ${q} `, ` ${q}s `, ` ${q}es `].find((form) => padded.includes(form));
  if (wholeWord) return padded.startsWith(wholeWord) ? 0 : 1;
  return name.startsWith(q) ? 2 : 3;
}

/**
 * Matches every query word against name, brand and tags. A word only falls back to typo-tolerant
 * matching when nothing in the catalog contains it, so "briyani" finds biryani without fuzzy noise
 * on correctly spelled words. Hand-written entries come before USDA ones, then closer and shorter names.
 */
export function searchFoods(query: string, limit = 50): FoodItem[] {
  const q = normalize(query);
  if (!q) return INDEX.filter((entry) => entry.curated).slice(0, limit).map((entry) => entry.item);
  const allowed = q.split(" ").map((queryWord) => {
    const forms = variants(queryWord);
    const exact = VOCABULARY.filter((word) => exactMatch(forms, word));
    return new Set(exact.length ? exact : VOCABULARY.filter((word) => fuzzyMatch(queryWord, word)));
  });
  return INDEX.filter((entry) => allowed.every((words) => entry.words.some((word) => words.has(word))))
    .map((entry) => ({ entry, rank: matchRank(entry.name, q) }))
    .sort(
      (a, b) =>
        Number(b.entry.curated) - Number(a.entry.curated) ||
        a.rank - b.rank ||
        a.entry.name.length - b.entry.name.length,
    )
    .slice(0, limit)
    .map(({ entry }) => entry.item);
}
