"use client";

import { useActionState, useState, type ChangeEvent, type ReactNode } from "react";
import {
  logFoodAction,
  quickLogFoodAction,
  saveCustomFoodAction,
  type ActionResult,
} from "@/app/actions";
import {
  nutritionFor,
  searchFoods,
  servingGrams,
  type AmountUnit,
} from "@/lib/content/foods";
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

function suggestFoods(query: string, savedFoods: FoodItem[]): FoodItem[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const saved = savedFoods.filter((food) => food.name.toLowerCase().includes(q));
  return [...saved, ...searchFoods(q)].slice(0, 6);
}

function portionLabel(food: FoodItem, amount: string, unit: AmountUnit): string {
  if (unit === "g") return `${food.name} (${amount} g)`;
  return Number(amount) === 1 ? food.name : `${food.name} (${amount} × ${food.serving})`;
}

export function ManualFoodForm({
  defaultMeal,
  savedFoods = [],
}: {
  defaultMeal: string;
  savedFoods?: FoodItem[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<AmountUnit>("g");
  const [manual, setManual] = useState<Macros>(EMPTY_MACROS);

  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (prev, formData) => {
      const result = await logFoodAction(prev, formData);
      if (result.ok) {
        setQuery("");
        setSelected(null);
        setAmount("");
        setManual(EMPTY_MACROS);
      }
      return result;
    },
    null,
  );

  const suggestions = selected ? [] : suggestFoods(query, savedFoods);
  const showSuggestions = open && query.trim().length >= 2;
  const perServing = selected ? servingGrams(selected.serving) : undefined;
  const totals = selected ? nutritionFor(selected, Number(amount), unit) : undefined;

  const choose = (food: FoodItem) => {
    const grams = servingGrams(food.serving);
    setSelected(food);
    setQuery(food.name);
    setUnit(grams ? "g" : "serving");
    setAmount(String(grams ?? 1));
    setOpen(false);
  };
  const setManualMacro = (key: keyof Macros) => (event: ChangeEvent<HTMLInputElement>) =>
    setManual({ ...manual, [key]: event.target.value });

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Food" htmlFor="manual-name">
          <div className="relative">
            <Input
              id="manual-name"
              role="combobox"
              aria-expanded={showSuggestions}
              aria-controls="manual-food-suggestions"
              aria-autocomplete="list"
              placeholder="e.g. idli, chicken biryani"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelected(null);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(false);
                if (event.key === "Enter" && !selected && suggestions.length && showSuggestions) {
                  event.preventDefault();
                  choose(suggestions[0]);
                }
              }}
              required
              autoComplete="off"
            />
            {showSuggestions ? (
              <ul
                id="manual-food-suggestions"
                role="listbox"
                className="absolute z-20 mt-1 max-h-72 w-[min(22rem,calc(100vw-3rem))] overflow-y-auto rounded-xl border border-border bg-surface shadow-lg"
              >
                {suggestions.map((food) => (
                  <li key={food.id} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(food)}
                      className="w-full px-3 py-2 text-left hover:bg-surface-muted"
                    >
                      <span className="block text-sm font-medium">{food.name}</span>
                      <span className="block text-xs text-muted">
                        {food.calories} kcal per {food.serving} · {food.proteinG}p {food.carbsG}c{" "}
                        {food.fatG}f
                      </span>
                    </button>
                  </li>
                ))}
                {!suggestions.length ? (
                  <li className="px-3 py-2 text-xs text-muted">
                    No match for &ldquo;{query.trim()}&rdquo;. Enter the nutrition yourself below.
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
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

      {selected ? (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="How much?" htmlFor="manual-amount">
              <Input
                id="manual-amount"
                type="number"
                min={0}
                step="any"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="w-28"
              />
            </Field>
            <Select
              value={unit}
              onChange={(event) => {
                const next: AmountUnit = event.target.value === "g" ? "g" : "serving";
                setUnit(next);
                setAmount(String(next === "g" ? (perServing ?? 1) : 1));
              }}
              aria-label="Unit"
              className="w-auto"
            >
              {perServing ? <option value="g">grams</option> : null}
              <option value="serving">× {selected.serving}</option>
            </Select>
            <Button
              type="button"
              variant="ghost"
              className="px-3 py-2 text-xs"
              onClick={() => {
                setSelected(null);
                setQuery("");
              }}
            >
              Change food
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2 rounded-xl bg-surface-muted p-3 text-center" aria-live="polite">
            {[
              { label: "kcal", value: totals?.calories },
              { label: "Protein", value: totals?.proteinG, unit: "g" },
              { label: "Carbs", value: totals?.carbsG, unit: "g" },
              { label: "Fat", value: totals?.fatG, unit: "g" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-lg font-semibold">
                  {item.value ?? "–"}
                  {item.value != null && item.unit ? <span className="text-xs">{item.unit}</span> : null}
                </p>
                <p className="text-xs text-muted">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted">
            Based on {selected.calories} kcal per {selected.serving}
            {totals ? ` · fiber ${totals.fiberG} g` : " · enter an amount above 0"}.
          </p>
          <input type="hidden" name="name" value={portionLabel(selected, amount, unit)} />
          <input type="hidden" name="foodId" value={selected.id} />
          <input type="hidden" name="calories" value={totals?.calories ?? ""} />
          <input type="hidden" name="protein" value={totals?.proteinG ?? ""} />
          <input type="hidden" name="carbs" value={totals?.carbsG ?? ""} />
          <input type="hidden" name="fat" value={totals?.fatG ?? ""} />
          <input type="hidden" name="fiber" value={totals?.fiberG ?? ""} />
        </>
      ) : (
        <>
          <p className="text-xs text-muted">
            Pick a food from the list to fill in the nutrition, or enter it yourself for the whole
            portion.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Calories" htmlFor="manual-cal">
              <Input id="manual-cal" name="calories" type="number" min={0} step="any" value={manual.calories} onChange={setManualMacro("calories")} required />
            </Field>
            <Field label="Protein g" htmlFor="manual-p">
              <Input id="manual-p" name="protein" type="number" min={0} step="any" value={manual.protein} onChange={setManualMacro("protein")} />
            </Field>
            <Field label="Carbs g" htmlFor="manual-c">
              <Input id="manual-c" name="carbs" type="number" min={0} step="any" value={manual.carbs} onChange={setManualMacro("carbs")} />
            </Field>
            <Field label="Fat g" htmlFor="manual-f">
              <Input id="manual-f" name="fat" type="number" min={0} step="any" value={manual.fat} onChange={setManualMacro("fat")} />
            </Field>
          </div>
          <input type="hidden" name="name" value={query.trim()} />
        </>
      )}
      <input type="hidden" name="servings" value={1} />
      {state?.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.message ? <p className="text-sm text-brand">{state.message}</p> : null}
      <Button type="submit" disabled={pending || (selected != null && !totals)}>
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
