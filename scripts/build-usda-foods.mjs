// Builds src/lib/content/usda-foods.json from the USDA FoodData Central SR Legacy CSV export.
// Download and unzip https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip,
// then run: node scripts/build-usda-foods.mjs <path-to-unzipped-folder>
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node scripts/build-usda-foods.mjs <sr-legacy-csv-folder>");
  process.exit(1);
}

function parseCsv(file) {
  const rows = [];
  for (const line of readFileSync(join(dir, file), "utf8").split(/\r?\n/)) {
    if (!line) continue;
    const fields = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') {
          field += '"';
          i++;
        } else if (ch === '"') quoted = false;
        else field += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ",") {
        fields.push(field);
        field = "";
      } else field += ch;
    }
    fields.push(field);
    rows.push(fields);
  }
  return rows.slice(1);
}

const CATEGORY_TAGS = {
  1: "dairy",
  2: "spices",
  3: "baby_food",
  4: "oils",
  5: "poultry",
  6: "soups",
  7: "deli_meat",
  8: "cereal",
  9: "fruit",
  10: "pork",
  11: "vegetable",
  12: "nuts",
  13: "beef",
  14: "beverage",
  15: "seafood",
  16: "legumes",
  17: "lamb",
  18: "baked",
  19: "sweets",
  20: "grains",
  21: "fast_food",
  22: "meals",
  23: "snacks",
  24: "native",
  25: "restaurant",
  26: "branded",
  28: "alcohol",
};

// FDC nutrient ids: energy (kcal), protein, carbohydrate, fat, fibre.
const NUTRIENTS = { 1008: 0, 1003: 1, 1005: 2, 1004: 3, 1079: 4 };

const nutrients = new Map();
for (const [, fdcId, nutrientId, amount] of parseCsv("food_nutrient.csv")) {
  const slot = NUTRIENTS[nutrientId];
  if (slot === undefined) continue;
  if (!nutrients.has(fdcId)) nutrients.set(fdcId, [null, 0, 0, 0, 0]);
  nutrients.get(fdcId)[slot] = Math.round(Number(amount) * 10) / 10;
}

const foods = [];
for (const [fdcId, , description, categoryId] of parseCsv("food.csv")) {
  const tag = CATEGORY_TAGS[categoryId];
  const values = nutrients.get(fdcId);
  if (!tag || !values || values[0] == null) continue;
  const name = description.replace(/\s*\(Includes foods for USDA's Food Distribution Program\)/i, "").trim();
  foods.push([Number(fdcId), name, tag, ...values]);
}
foods.sort((a, b) => a[1].localeCompare(b[1]));

writeFileSync(
  new URL("../src/lib/content/usda-foods.json", import.meta.url),
  "[\n" + foods.map((row) => JSON.stringify(row)).join(",\n") + "\n]\n",
);
console.log(`Wrote ${foods.length} foods`);
