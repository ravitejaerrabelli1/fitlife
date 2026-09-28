"use client";

import { useActionState } from "react";
import { logCardioAction, type ActionResult } from "@/app/actions";
import { Button, Field, Input, Select } from "./ui";

export function CardioLogForm({
  activities,
}: {
  activities: { id: string; name: string; defaultMinutes: number }[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    logCardioAction,
    null,
  );
  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Activity" htmlFor="cardio-activity">
          <Select id="cardio-activity" name="activityId" required>
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Minutes" htmlFor="cardio-minutes">
          <Input
            id="cardio-minutes"
            name="minutes"
            type="number"
            min={1}
            max={300}
            defaultValue={30}
          />
        </Field>
        <Field label="Date" htmlFor="cardio-date">
          <Input id="cardio-date" name="date" type="date" />
        </Field>
      </div>
      {state?.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.message ? <p className="text-sm text-brand">{state.message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Logging…" : "Log cardio"}
      </Button>
    </form>
  );
}
