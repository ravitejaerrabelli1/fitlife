"use client";

import { useActionState } from "react";
import { logMeasurementsAction, type ActionResult } from "@/app/actions";
import { Button, Field, Input, Textarea } from "./ui";

const FIELDS = [
  { name: "waist", label: "Waist" },
  { name: "neck", label: "Neck" },
  { name: "hip", label: "Hips" },
  { name: "chest", label: "Chest" },
  { name: "arm", label: "Arm" },
  { name: "thigh", label: "Thigh" },
];

export function MeasurementForm({ unit }: { unit: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    logMeasurementsAction,
    null,
  );
  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FIELDS.map((field) => (
          <Field
            key={field.name}
            label={`${field.label} (${unit})`}
            htmlFor={`m-${field.name}`}
          >
            <Input
              id={`m-${field.name}`}
              name={field.name}
              type="number"
              step="0.1"
              min="0"
            />
          </Field>
        ))}
      </div>
      <Field
        label="Photo note"
        htmlFor="m-photo"
        hint="Photos stay on your device — record a note here instead."
      >
        <Textarea id="m-photo" name="photoNote" rows={2} />
      </Field>
      {state?.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.message ? <p className="text-sm text-brand">{state.message}</p> : null}
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Save measurements"}
      </Button>
    </form>
  );
}
