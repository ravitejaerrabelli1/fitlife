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

export function searchFoods(query: string): FoodItem[] {
  const q = query.trim().toLowerCase();
  const pool = [...FOODS, ...RESTAURANT_ESTIMATES];
  if (!q) return pool.slice(0, 20);
  return pool.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q) ||
      item.tags.some((tag) => tag.includes(q)),
  );
}
