import type { FoodItem, Supplement } from "./types";

function food(
  id: string,
  name: string,
  serving: string,
  calories: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
  fiberG: number,
  tags: string[] = [],
  brand = "Generic",
): FoodItem {
  return {
    id,
    name,
    brand,
    serving,
    calories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    tags,
  };
}

const IN = "Indian (typical)";
const SI = ["indian", "south_indian"];
const NI = ["indian"];

export const FOODS: FoodItem[] = [
  food("chicken-breast", "Chicken breast, cooked", "100 g", 165, 31, 0, 3.6, 0, ["protein"]),
  food("chicken-thigh", "Chicken thigh, cooked", "100 g", 209, 26, 0, 11, 0, ["protein"]),
  food("lean-beef", "Lean ground beef 5%, cooked", "100 g", 170, 26, 0, 7, 0, ["protein"]),
  food("salmon", "Salmon, cooked", "100 g", 208, 22, 0, 13, 0, ["protein", "pescatarian"]),
  food("tuna-can", "Tuna in water", "1 can (110 g)", 116, 26, 0, 1, 0, ["protein", "pescatarian"]),
  food("shrimp", "Shrimp, cooked", "100 g", 99, 24, 0.2, 0.3, 0, ["protein", "pescatarian"]),
  food("egg", "Whole egg", "1 large", 72, 6.3, 0.4, 5, 0, ["protein", "vegetarian"]),
  food("egg-white", "Egg whites", "100 ml", 52, 11, 0.7, 0.2, 0, ["protein", "vegetarian"]),
  food("greek-yogurt", "Greek yogurt 0%", "170 g", 100, 17, 6, 0.7, 0, ["dairy", "vegetarian"]),
  food("cottage-cheese", "Cottage cheese 2%", "100 g", 84, 11, 4.3, 2.3, 0, ["dairy", "vegetarian"]),
  food("milk", "Semi-skimmed milk", "250 ml", 120, 8.5, 12, 4.5, 0, ["dairy", "vegetarian"]),
  food("soy-milk", "Soy milk, unsweetened", "250 ml", 80, 7, 4, 4, 1, ["vegan"]),
  food("whey", "Whey protein powder", "30 g scoop", 120, 24, 3, 1.5, 0, ["supplement"]),
  food("plant-protein", "Plant protein powder", "30 g scoop", 120, 22, 4, 2, 2, ["supplement", "vegan"]),
  food("tofu", "Firm tofu", "100 g", 144, 17, 3, 9, 2, ["vegan", "protein"]),
  food("tempeh", "Tempeh", "100 g", 192, 20, 8, 11, 6, ["vegan", "protein"]),
  food("lentils", "Lentils, cooked", "100 g", 116, 9, 20, 0.4, 8, ["vegan", "high_fiber"]),
  food("chickpeas", "Chickpeas, cooked", "100 g", 164, 9, 27, 2.6, 8, ["vegan", "high_fiber"]),
  food("black-beans", "Black beans, cooked", "100 g", 132, 9, 24, 0.5, 9, ["vegan", "high_fiber"]),
  food("kidney-beans", "Kidney beans, cooked", "100 g", 127, 9, 23, 0.5, 7, ["vegan", "high_fiber"]),
  food("white-rice", "White rice, cooked", "100 g", 130, 2.7, 28, 0.3, 0.4, ["grain"]),
  food("brown-rice", "Brown rice, cooked", "100 g", 123, 2.7, 26, 1, 1.6, ["grain"]),
  food("oats", "Rolled oats, dry", "50 g", 190, 6.5, 33, 3.5, 5, ["grain", "vegetarian"]),
  food("quinoa", "Quinoa, cooked", "100 g", 120, 4.4, 21, 1.9, 2.8, ["grain", "gluten_free"]),
  food("pasta", "Pasta, cooked", "100 g", 158, 5.8, 31, 0.9, 1.8, ["grain"]),
  food("bread", "Wholegrain bread", "1 slice (40 g)", 98, 4.8, 16, 1.4, 2.5, ["grain"]),
  food("tortilla", "Corn tortilla", "1 each", 65, 1.7, 13, 0.8, 1.8, ["grain", "gluten_free"]),
  food("potato", "Potato, boiled", "100 g", 87, 2, 20, 0.1, 1.8, ["vegetable"]),
  food("sweet-potato", "Sweet potato, baked", "100 g", 90, 2, 21, 0.2, 3.3, ["vegetable"]),
  food("broccoli", "Broccoli, cooked", "100 g", 35, 2.4, 7, 0.4, 3.3, ["vegetable"]),
  food("spinach", "Spinach, raw", "100 g", 23, 2.9, 3.6, 0.4, 2.2, ["vegetable"]),
  food("mixed-salad", "Mixed salad leaves", "100 g", 17, 1.4, 2.9, 0.2, 2, ["vegetable"]),
  food("banana", "Banana", "1 medium", 105, 1.3, 27, 0.4, 3.1, ["fruit"]),
  food("apple", "Apple", "1 medium", 95, 0.5, 25, 0.3, 4.4, ["fruit"]),
  food("berries", "Mixed berries", "100 g", 50, 1, 12, 0.3, 4, ["fruit"]),
  food("avocado", "Avocado", "1/2 medium", 160, 2, 9, 15, 7, ["fruit", "fat"]),
  food("olive-oil", "Olive oil", "1 tbsp", 119, 0, 0, 13.5, 0, ["fat"]),
  food("peanut-butter", "Peanut butter", "1 tbsp (16 g)", 94, 3.5, 3.2, 8, 1, ["fat"]),
  food("almonds", "Almonds", "28 g", 164, 6, 6, 14, 3.5, ["fat"]),
  food("cheddar", "Cheddar cheese", "30 g", 120, 7, 0.4, 10, 0, ["dairy"]),
  food("feta", "Feta cheese", "30 g", 79, 4.2, 1.2, 6.4, 0, ["dairy"]),
  food("protein-bar", "Protein bar", "1 bar (60 g)", 220, 20, 22, 7, 5, ["snack"]),
  food("dark-chocolate", "Dark chocolate 85%", "20 g", 120, 2, 6, 10, 2, ["snack"]),
  food("hummus", "Hummus", "50 g", 133, 4, 7, 10, 3, ["vegan", "snack"]),

  // Typical home-style Indian dishes; values vary with recipe and oil used.
  food("idli", "Idli", "1 piece (40 g)", 58, 2, 12, 0.2, 0.5, SI, IN),
  food("plain-dosa", "Plain dosa", "1 medium (80 g)", 168, 3.9, 29, 3.7, 0.9, SI, IN),
  food("masala-dosa", "Masala dosa", "1 dosa (180 g)", 360, 7, 50, 15, 3, SI, IN),
  food("rava-dosa", "Rava dosa", "1 dosa (90 g)", 190, 3.5, 26, 8, 1, SI, IN),
  food("pesarattu", "Pesarattu (green gram dosa)", "1 dosa (100 g)", 180, 9, 26, 4.5, 4, SI, IN),
  food("uttapam", "Onion uttapam", "1 piece (120 g)", 210, 5.5, 35, 5, 2, SI, IN),
  food("appam", "Appam", "1 piece (60 g)", 120, 2, 22, 2.5, 0.5, SI, IN),
  food("medu-vada", "Medu vada", "1 piece (50 g)", 140, 4.5, 14, 7.5, 2, SI, IN),
  food("paniyaram", "Kuzhi paniyaram", "4 pieces (100 g)", 180, 4, 28, 6, 1.5, SI, IN),
  food("puttu", "Puttu", "1 cup (100 g)", 180, 3.5, 33, 4, 2, SI, IN),
  food("upma", "Rava upma", "1 cup (200 g)", 250, 6, 38, 8, 2, SI, IN),
  food("ven-pongal", "Ven pongal", "1 cup (200 g)", 300, 8, 40, 12, 2, SI, IN),
  food("sambar", "Sambar", "1 bowl (150 g)", 98, 4.5, 13.5, 3, 3.8, SI, IN),
  food("rasam", "Rasam", "1 bowl (150 g)", 60, 2, 8, 2.3, 1, SI, IN),
  food("coconut-chutney", "Coconut chutney", "2 tbsp (30 g)", 60, 0.8, 2.5, 5.4, 1.5, SI, IN),
  food("lemon-rice", "Lemon rice", "1 cup (180 g)", 290, 5, 48, 9, 2, SI, IN),
  food("curd-rice", "Curd rice", "1 cup (200 g)", 260, 7, 40, 8, 1, [...SI, "dairy"], IN),
  food("pulihora", "Tamarind rice (pulihora)", "1 cup (180 g)", 320, 5, 50, 11, 2, SI, IN),
  food("bisi-bele-bath", "Bisi bele bath", "1 cup (250 g)", 330, 10, 50, 10, 6, SI, IN),
  food("ragi-mudde", "Ragi mudde (ragi ball)", "1 ball (150 g)", 210, 4.5, 45, 1.2, 5, SI, IN),
  food("avial", "Avial", "1 cup (150 g)", 150, 3, 12, 10, 4, SI, IN),
  food("poriyal", "Vegetable poriyal / thoran", "1 cup (100 g)", 90, 2.5, 8, 5.5, 3, SI, IN),
  food("kerala-parotta", "Kerala parotta", "1 piece (90 g)", 290, 5.5, 40, 12, 1.5, SI, IN),
  food("chicken-biryani", "Chicken biryani", "1 plate (300 g)", 540, 24, 66, 20, 2, SI, IN),
  food("mutton-biryani", "Mutton biryani", "1 plate (300 g)", 600, 27, 63, 26, 2, SI, IN),
  food("egg-biryani", "Egg biryani", "1 plate (300 g)", 500, 18, 66, 18, 2, SI, IN),
  food("veg-biryani", "Veg biryani", "1 plate (300 g)", 450, 9, 72, 14, 5, SI, IN),
  food("chicken-65", "Chicken 65", "100 g", 250, 22, 9, 14, 0.5, SI, IN),
  food("chicken-curry", "Chicken curry", "1 bowl (200 g)", 300, 26, 8, 18, 2, SI, IN),
  food("fish-curry", "Fish curry", "1 bowl (200 g)", 240, 22, 8, 13, 1.5, SI, IN),
  food("payasam", "Payasam (kheer)", "1 cup (150 g)", 250, 6, 38, 8, 0.5, [...SI, "dairy"], IN),
  food("banana-chips", "Banana chips", "30 g", 155, 0.7, 17, 10, 2, SI, IN),
  food("filter-coffee", "Filter coffee with milk and sugar", "1 cup (150 ml)", 80, 2.5, 11, 3, 0, [...SI, "dairy"], IN),
  food("chapati", "Chapati / roti", "1 piece (40 g)", 120, 3.5, 18, 3.7, 2, NI, IN),
  food("dal-tadka", "Dal tadka", "1 bowl (150 g)", 165, 9, 21, 5, 5, NI, IN),
  food("chole", "Chole (chickpea curry)", "1 bowl (150 g)", 210, 9, 27, 7.5, 8, NI, IN),
  food("rajma", "Rajma (kidney bean curry)", "1 bowl (150 g)", 190, 9, 27, 5, 8, NI, IN),
  food("paneer", "Paneer", "100 g", 265, 18, 1.2, 21, 0, [...NI, "dairy"], IN),
  food("palak-paneer", "Palak paneer", "1 bowl (150 g)", 270, 12, 9, 21, 3, [...NI, "dairy"], IN),
  food("poha", "Poha", "1 plate (150 g)", 250, 4.5, 40, 8, 2, NI, IN),
  food("samosa", "Samosa", "1 piece (100 g)", 260, 4.5, 30, 14, 2.5, NI, IN),
  food("gulab-jamun", "Gulab jamun", "1 piece (50 g)", 150, 2, 25, 5, 0.3, [...NI, "dairy"], IN),
  food("masala-chai", "Masala chai with milk and sugar", "1 cup (150 ml)", 80, 2.5, 12, 2.5, 0, [...NI, "dairy"], IN),
  food("buttermilk", "Buttermilk (chaas)", "1 glass (200 ml)", 40, 2.5, 4, 1.5, 0, [...NI, "dairy"], IN),
  food("ghee", "Ghee", "1 tsp (5 g)", 45, 0, 0, 5, 0, [...NI, "dairy", "fat"], IN),
];

export const RESTAURANT_ESTIMATES: FoodItem[] = [
  {
    id: "rest-grilled-chicken-salad",
    name: "Restaurant grilled chicken salad",
    brand: "Restaurant estimate",
    serving: "1 plate",
    calories: 520,
    proteinG: 42,
    carbsG: 22,
    fatG: 29,
    fiberG: 6,
    tags: ["restaurant"],
    restaurant: true,
  },
  {
    id: "rest-burrito",
    name: "Restaurant burrito",
    brand: "Restaurant estimate",
    serving: "1 burrito",
    calories: 980,
    proteinG: 45,
    carbsG: 110,
    fatG: 36,
    fiberG: 12,
    tags: ["restaurant"],
    restaurant: true,
  },
  {
    id: "rest-burger-fries",
    name: "Restaurant burger with fries",
    brand: "Restaurant estimate",
    serving: "1 meal",
    calories: 1150,
    proteinG: 48,
    carbsG: 105,
    fatG: 58,
    fiberG: 8,
    tags: ["restaurant"],
    restaurant: true,
  },
  {
    id: "rest-pizza-slices",
    name: "Pizza, two slices",
    brand: "Restaurant estimate",
    serving: "2 slices",
    calories: 570,
    proteinG: 24,
    carbsG: 66,
    fatG: 22,
    fiberG: 4,
    tags: ["restaurant"],
    restaurant: true,
  },
  {
    id: "rest-sushi",
    name: "Sushi set (10 pieces)",
    brand: "Restaurant estimate",
    serving: "10 pieces",
    calories: 520,
    proteinG: 26,
    carbsG: 78,
    fatG: 10,
    fiberG: 4,
    tags: ["restaurant"],
    restaurant: true,
  },
  {
    id: "rest-curry-rice",
    name: "Curry with rice",
    brand: "Restaurant estimate",
    serving: "1 plate",
    calories: 850,
    proteinG: 32,
    carbsG: 98,
    fatG: 34,
    fiberG: 9,
    tags: ["restaurant"],
    restaurant: true,
  },
  {
    id: "rest-pasta-cream",
    name: "Creamy pasta dish",
    brand: "Restaurant estimate",
    serving: "1 plate",
    calories: 1020,
    proteinG: 30,
    carbsG: 108,
    fatG: 48,
    fiberG: 6,
    tags: ["restaurant"],
    restaurant: true,
  },
  {
    id: "rest-shawarma-wrap",
    name: "Shawarma wrap",
    brand: "Restaurant estimate",
    serving: "1 wrap",
    calories: 720,
    proteinG: 40,
    carbsG: 62,
    fatG: 32,
    fiberG: 6,
    tags: ["restaurant"],
    restaurant: true,
  },
];

export const SUPPLEMENTS: Supplement[] = [
  {
    id: "protein-powder",
    name: "Protein powder",
    what: "A concentrated protein source made from milk (whey or casein), soy, pea or rice.",
    evidence:
      "Total daily protein intake is what matters most for muscle; powder is simply a convenient way to reach that total.",
    typicalUse: "20–40 g in a shake when whole-food protein is inconvenient.",
    considerations:
      "Not required if food already meets your protein target. Some people find whey uncomfortable if they are lactose sensitive.",
    talkToProfessional:
      "Anyone with kidney disease or a milk allergy should speak with a healthcare professional first.",
  },
  {
    id: "creatine",
    name: "Creatine monohydrate",
    what: "A compound stored in muscle that helps regenerate energy during short, intense efforts.",
    evidence:
      "One of the most studied sports supplements, with consistent small improvements in strength and training volume.",
    typicalUse: "3–5 g daily, taken at any time of day.",
    considerations:
      "A small increase in scale weight from intracellular water is normal in the first weeks.",
    talkToProfessional:
      "Discuss with a professional if you have kidney disease or take medication affecting the kidneys.",
  },
  {
    id: "caffeine",
    name: "Caffeine",
    what: "A stimulant found in coffee, tea and pre-workout formulas.",
    evidence:
      "Can reduce perceived effort and improve endurance and alertness for many people.",
    typicalUse: "Commonly 1–3 mg per kg body weight, 30–60 minutes before training.",
    considerations:
      "Can disrupt sleep when taken late, and tolerance varies widely between individuals.",
    talkToProfessional:
      "Discuss with a professional if you are pregnant, have heart rhythm concerns, anxiety or high blood pressure.",
  },
  {
    id: "electrolytes",
    name: "Electrolytes",
    what: "Sodium, potassium, magnesium and chloride lost in sweat.",
    evidence:
      "Useful for long or hot training sessions and heavy sweaters; not needed for most short indoor workouts.",
    typicalUse: "An electrolyte drink during sessions longer than about an hour.",
    considerations: "Watch total sodium if you have been advised to limit it.",
    talkToProfessional:
      "Discuss with a professional if you have high blood pressure, kidney or heart conditions.",
  },
  {
    id: "vitamin-d",
    name: "Vitamin D",
    what: "A fat-soluble vitamin involved in bone health and immune function.",
    evidence:
      "Supplementation mainly helps people who are deficient, which is common with limited sun exposure.",
    typicalUse: "Dose depends on blood levels and local guidance.",
    considerations: "More is not better — high doses over time can cause harm.",
    talkToProfessional:
      "Ask a healthcare professional for a blood test before supplementing long term.",
  },
  {
    id: "omega-3",
    name: "Omega-3 (EPA/DHA)",
    what: "Long-chain fatty acids found mainly in oily fish and algae.",
    evidence:
      "Relevant for general cardiovascular and cognitive health, especially when fish intake is low.",
    typicalUse: "Often 1–2 g combined EPA and DHA daily from fish or algae oil.",
    considerations: "Can interact with blood-thinning medication.",
    talkToProfessional:
      "Discuss with a professional if you take anticoagulants or have a bleeding disorder.",
  },
];

/** Grams in one serving, when the serving label states them (e.g. "1 piece (40 g)"). */
export function servingGrams(serving: string): number | undefined {
  const match = /(\d+(?:\.\d+)?)\s*g\b/i.exec(serving);
  return match ? Number(match[1]) : undefined;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

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

function wordMatches(queryWord: string, words: string[]): boolean {
  const tolerance = queryWord.length >= 7 ? 2 : queryWord.length >= 4 ? 1 : 0;
  return words.some(
    (word) =>
      word.includes(queryWord) ||
      (tolerance > 0 && editDistance(queryWord, word) <= tolerance),
  );
}

/** Matches every query word against name, brand and tags, tolerating small typos. */
export function searchFoods(query: string): FoodItem[] {
  const q = normalize(query);
  const pool = [...FOODS, ...RESTAURANT_ESTIMATES];
  if (!q) return pool.slice(0, 20);
  const queryWords = q.split(" ");
  return pool
    .map((item) => {
      const name = normalize(item.name);
      const words = normalize(
        [item.name, item.brand, ...item.tags.map((tag) => tag.replaceAll("_", " "))].join(" "),
      ).split(" ");
      if (!queryWords.every((word) => wordMatches(word, words))) return null;
      return { item, rank: name.startsWith(q) ? 0 : name.includes(q) ? 1 : 2 };
    })
    .filter((entry): entry is { item: FoodItem; rank: number } => entry != null)
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => entry.item);
}
