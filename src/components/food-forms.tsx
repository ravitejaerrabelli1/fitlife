"use client";

import { useActionState, useState, type ChangeEvent, type ReactNode } from "react";
import {
  logFoodAction,
  quickLogFoodAction,
  saveCustomFoodAction,
  type ActionResult,
} from "@/app/actions";
import { FOODS, searchFoods, servingGrams } from "@/lib/content/foods";
import type { FoodItem } from "@/lib/content/types";
import { Button, Field, Input, Select } from "./ui";

const MEALS = [
  { value: "breakfast", label: "Breakfast" },
  { value: "morning_snack", label: "Morning snack" },
  { value: "lunch", label: "Lunch" },
  { value: "afternoon_snack", label: "Afternoon snack" },
  { value: "dinner", label: "Dinner" },
  { value: "evening_snack", label: "Evening snack" },
];

type Macros = { calories: string; protein: string; carbs: string; fat: string; fiber: string };

const EMPTY_MACROS: Macros = { calories: "", protein: "", carbs: "", fat: "", fiber: "" };

function scaled(value: number, factor: number): number {
  return Math.round(value * factor * 10) / 10;
}

function macrosFor(food: FoodItem, factor: number): Macros {
  return {
    calories: String(Math.round(food.calories * factor)),
    protein: String(scaled(food.proteinG, factor)),
    carbs: String(scaled(food.carbsG, factor)),
    fat: String(scaled(food.fatG, factor)),
    fiber: String(scaled(food.fiberG, factor)),
  };
}

function findFood(name: string): FoodItem | undefined {
  const query = name.trim().toLowerCase();
  if (query.length < 3) return undefined;
  return (
    FOODS.find((food) => food.name.toLowerCase() === query) ??
    searchFoods(query).find((food) => !food.restaurant)
  );
}

/** Serving multiplier for an amount in grams, or one serving when grams are unknown. */
function factorFor(food: FoodItem, grams: string): number {
  const perServing = servingGrams(food.serving);
  const amount = Number(grams);
  return perServing && amount > 0 ? amount / perServing : 1;
}

export function ManualFoodForm({ defaultMeal }: { defaultMeal: string }) {
  const [name, setName] = useState("");
  const [grams, setGrams] = useState("");
  const [macros, setMacros] = useState<Macros>(EMPTY_MACROS);
  const match = findFood(name);

  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (prev, formData) => {
      const result = await logFoodAction(prev, formData);
      if (result.ok) {
        setName("");
        setGrams("");
        setMacros(EMPTY_MACROS);
      }
      return result;
    },
    null,
  );

  const refill = (nextName: string, nextGrams: string) => {
    const food = findFood(nextName);
    if (food) setMacros(macrosFor(food, factorFor(food, nextGrams)));
  };
  const setMacro = (key: keyof Macros) => (event: ChangeEvent<HTMLInputElement>) =>
    setMacros({ ...macros, [key]: event.target.value });

  const matchGrams = match ? servingGrams(match.serving) : undefined;
  const loggedName = grams && Number(grams) > 0 ? `${name.trim()} (${grams} g)` : name.trim();

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name" htmlFor="manual-name">
          <Input
            id="manual-name"
            list="manual-food-options"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              refill(event.target.value, grams);
            }}
            required
            autoComplete="off"
          />
          <datalist id="manual-food-options">
            {FOODS.map((food) => (
              <option key={food.id} value={food.name} />
            ))}
          </datalist>
        </Field>
        <Field label="Meal" htmlFor="manual-meal">
          <Select id="manual-meal" name="meal" defaultValue={defaultMeal}>
            {MEALS.map((meal) => (
              <option key={meal.value} value={meal.value}>
                {meal.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field
        label="Amount (g)"
        htmlFor="manual-grams"
        hint={
          match
            ? matchGrams
              ? `Using ${match.name}: ${match.calories} kcal per ${match.serving}. Edit the numbers below if your portion differs.`
              : `Using ${match.name}: values are for ${match.serving}.`
            : "Type a food name to fill in the numbers, or enter them yourself."
        }
      >
        <Input
          id="manual-grams"
          type="number"
          min={0}
          step="any"
          value={grams}
          onChange={(event) => {
            setGrams(event.target.value);
            refill(name, event.target.value);
          }}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Calories" htmlFor="manual-cal">
          <Input
            id="manual-cal"
            name="calories"
            type="number"
            min={0}
            step="any"
            value={macros.calories}
            onChange={setMacro("calories")}
            required
          />
        </Field>
        <Field label="Protein g" htmlFor="manual-p">
          <Input id="manual-p" name="protein" type="number" min={0} step="any" value={macros.protein} onChange={setMacro("protein")} />
        </Field>
        <Field label="Carbs g" htmlFor="manual-c">
          <Input id="manual-c" name="carbs" type="number" min={0} step="any" value={macros.carbs} onChange={setMacro("carbs")} />
        </Field>
        <Field label="Fat g" htmlFor="manual-f">
          <Input id="manual-f" name="fat" type="number" min={0} step="any" value={macros.fat} onChange={setMacro("fat")} />
        </Field>
      </div>
      <input type="hidden" name="name" value={loggedName} />
      <input type="hidden" name="fiber" value={macros.fiber} />
      <input type="hidden" name="servings" value={1} />
      {state?.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.message ? <p className="text-sm text-brand">{state.message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Logging…" : "Log entry"}
      </Button>
    </form>
  );
}

/** A search result row: choose servings or grams and see the nutrition before logging. */
export function FoodLogRow({
  item,
  meal,
  badge,
}: {
  item: FoodItem;
  meal: string;
  badge?: ReactNode;
}) {
  const perServing = servingGrams(item.serving);
  const [unit, setUnit] = useState<"serving" | "g">("serving");
  const [amount, setAmount] = useState(1);
  const servings = unit === "g" && perServing ? amount / perServing : amount;
  const valid = servings > 0;
  const shown = macrosFor(item, valid ? servings : 0);

  return (
    <form action={quickLogFoodAction} className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {item.name} {badge}
        </p>
        <p className="text-xs text-muted">
          {unit === "g" ? `${amount || 0} g` : `${amount || 0} × ${item.serving}`} ·{" "}
          {shown.calories} kcal · {shown.protein}p {shown.carbs}c {shown.fat}f
        </p>
      </div>
      <input type="hidden" name="name" value={unit === "g" ? `${item.name} (${amount} g)` : item.name} />
      <input type="hidden" name="foodId" value={item.id} />
      <input type="hidden" name="meal" value={meal} />
      <input type="hidden" name="calories" value={item.calories} />
      <input type="hidden" name="protein" value={item.proteinG} />
      <input type="hidden" name="carbs" value={item.carbsG} />
      <input type="hidden" name="fat" value={item.fatG} />
      <input type="hidden" name="fiber" value={item.fiberG} />
      <input type="hidden" name="servings" value={valid ? servings : 0} />
      <Input
        type="number"
        step="any"
        min="0"
        value={Number.isNaN(amount) ? "" : amount}
        onChange={(event) => setAmount(event.target.valueAsNumber)}
        aria-label={`Amount of ${item.name}`}
        className="w-20"
      />
      {perServing ? (
        <Select
          value={unit}
          onChange={(event) => {
            const next = event.target.value === "g" ? "g" : "serving";
            setUnit(next);
            setAmount(next === "g" ? perServing : 1);
          }}
          aria-label={`Unit for ${item.name}`}
          className="w-auto"
        >
          <option value="serving">serving</option>
          <option value="g">g</option>
        </Select>
      ) : null}
      <Button type="submit" variant="secondary" disabled={!valid} className="px-3 py-1.5 text-xs">
        Log
      </Button>
    </form>
  );
}

export function CustomFoodForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    saveCustomFoodAction,
    null,
  );
  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name" htmlFor="custom-name">
          <Input id="custom-name" name="name" required />
        </Field>
        <Field label="Serving" htmlFor="custom-serving">
          <Input id="custom-serving" name="serving" placeholder="100 g" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Calories" htmlFor="custom-cal">
          <Input id="custom-cal" name="calories" type="number" min={0} required />
        </Field>
        <Field label="Protein g" htmlFor="custom-p">
          <Input id="custom-p" name="protein" type="number" min={0} />
        </Field>
        <Field label="Carbs g" htmlFor="custom-c">
          <Input id="custom-c" name="carbs" type="number" min={0} />
        </Field>
        <Field label="Fat g" htmlFor="custom-f">
          <Input id="custom-f" name="fat" type="number" min={0} />
        </Field>
      </div>
      {state?.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.message ? <p className="text-sm text-brand">{state.message}</p> : null}
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Save food"}
      </Button>
    </form>
  );
}
