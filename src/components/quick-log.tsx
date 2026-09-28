"use client";

import { useActionState } from "react";
import {
  addWaterAction,
  logWeightAction,
  setStepsAction,
  type ActionResult,
} from "@/app/actions";
import { Button, Field, Input, ProgressBar } from "./ui";

export function WaterQuickLog({
  consumedMl,
  goalMl,
  units,
}: {
  consumedMl: number;
  goalMl: number;
  units: "metric" | "imperial";
}) {
  const presets =
    units === "imperial"
      ? [
          { label: "8 oz", ml: 237 },
          { label: "12 oz", ml: 355 },
          { label: "16 oz", ml: 473 },
        ]
      : [
          { label: "250 ml", ml: 250 },
          { label: "500 ml", ml: 500 },
          { label: "750 ml", ml: 750 },
        ];

  return (
    <div className="space-y-3">
      <ProgressBar
        value={consumedMl}
        max={goalMl}
        label={units === "imperial" ? "Water (ml)" : "Water (ml)"}
        color="var(--protein)"
      />
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <form action={addWaterAction} key={preset.ml}>
            <input type="hidden" name="amountMl" value={preset.ml} />
            <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">
              +{preset.label}
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}

export function StepsQuickLog({
  steps,
  goal,
}: {
  steps: number;
  goal: number;
}) {
  return (
    <div className="space-y-3">
      <ProgressBar value={steps} max={goal} label="Steps" color="var(--accent)" />
      <form action={setStepsAction} className="flex gap-2">
        <Input
          name="steps"
          type="number"
          min={0}
          max={100000}
          defaultValue={steps || ""}
          aria-label="Steps today"
          className="flex-1"
        />
        <Button type="submit" variant="secondary">
          Save
        </Button>
      </form>
    </div>
  );
}

export function WeightQuickLog({ unit }: { unit: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    logWeightAction,
    null,
  );
  return (
    <form action={formAction} className="space-y-3">
      <Field label={`Today's weight (${unit})`} htmlFor="quick-weight">
        <Input
          id="quick-weight"
          name="weight"
          type="number"
          step="0.1"
          required
        />
      </Field>
      {state?.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.message ? (
        <p className="text-sm text-brand">{state.message}</p>
      ) : null}
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Log weight"}
      </Button>
    </form>
  );
}
