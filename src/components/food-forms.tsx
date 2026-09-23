"use client";

import { useActionState } from "react";
import {
  logFoodAction,
  saveCustomFoodAction,
  type ActionResult,
} from "@/app/actions";
import { Button, Field, Input, Select } from "./ui";

const MEALS = [
  { value: "breakfast", label: "Breakfast" },
  { value: "morning_snack", label: "Morning snack" },
  { value: "lunch", label: "Lunch" },
  { value: "afternoon_snack", label: "Afternoon snack" },
  { value: "dinner", label: "Dinner" },
  { value: "evening_snack", label: "Evening snack" },
];

export function ManualFoodForm({ defaultMeal }: { defaultMeal: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    logFoodAction,
    null,
  );
  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name" htmlFor="manual-name">
          <Input id="manual-name" name="name" required />
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Calories" htmlFor="manual-cal">
          <Input id="manual-cal" name="calories" type="number" min={0} required />
        </Field>
        <Field label="Protein g" htmlFor="manual-p">
          <Input id="manual-p" name="protein" type="number" min={0} />
        </Field>
        <Field label="Carbs g" htmlFor="manual-c">
          <Input id="manual-c" name="carbs" type="number" min={0} />
        </Field>
        <Field label="Fat g" htmlFor="manual-f">
          <Input id="manual-f" name="fat" type="number" min={0} />
        </Field>
      </div>
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
