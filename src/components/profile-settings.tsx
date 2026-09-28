"use client";

import { useActionState } from "react";
import { updateProfileAction, type ActionResult } from "@/app/actions";
import { Button, Card, Field, Input, SectionHeading, Select } from "./ui";
import type { Profile } from "@/lib/profile";

const ACTIVITY = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Lightly active" },
  { value: "moderate", label: "Moderately active" },
  { value: "very", label: "Very active" },
  { value: "extreme", label: "Extremely active" },
];

const GOALS = [
  { value: "lose", label: "Lose weight" },
  { value: "maintain", label: "Maintain" },
  { value: "gain", label: "Gain weight" },
  { value: "bulk", label: "Build muscle" },
  { value: "recomp", label: "Recomposition" },
];

const EQUIPMENT = [
  "full_gym",
  "home_gym",
  "dumbbells",
  "barbells",
  "machines",
  "bands",
  "bodyweight",
];

export function ProfileSettings({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    updateProfileAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="notificationsSubmitted" value="1" />

      <Card>
        <SectionHeading title="About you" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="First name" htmlFor="p-name">
            <Input id="p-name" name="first_name" defaultValue={profile.first_name} />
          </Field>
          <Field label="Age" htmlFor="p-age">
            <Input
              id="p-age"
              name="age"
              type="number"
              min={13}
              max={100}
              defaultValue={profile.age ?? ""}
            />
          </Field>
          <Field label="Sex" htmlFor="p-sex">
            <Select id="p-sex" name="sex" defaultValue={profile.sex ?? "female"}>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </Select>
          </Field>
          <Field label="Units" htmlFor="p-units">
            <Select id="p-units" name="units" defaultValue={profile.units}>
              <option value="metric">Metric</option>
              <option value="imperial">Imperial</option>
            </Select>
          </Field>
          <Field label="Height (cm)" htmlFor="p-height">
            <Input
              id="p-height"
              name="height_cm"
              type="number"
              step="0.5"
              defaultValue={profile.height_cm ?? ""}
            />
          </Field>
          <Field label="Weight (kg)" htmlFor="p-weight">
            <Input
              id="p-weight"
              name="weight_kg"
              type="number"
              step="0.1"
              defaultValue={profile.weight_kg ?? ""}
            />
          </Field>
          <Field label="Body fat %" htmlFor="p-bf" hint="Optional — improves BMR accuracy.">
            <Input
              id="p-bf"
              name="body_fat_pct"
              type="number"
              step="0.1"
              defaultValue={profile.body_fat_pct ?? ""}
            />
          </Field>
          <Field label="Activity level" htmlFor="p-activity">
            <Select
              id="p-activity"
              name="activity_level"
              defaultValue={profile.activity_level ?? "moderate"}
            >
              {ACTIVITY.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Card>
        <SectionHeading title="Goal and targets" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Goal" htmlFor="p-goal">
            <Select id="p-goal" name="goal" defaultValue={profile.goal ?? "maintain"}>
              {GOALS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Pace" htmlFor="p-pace">
            <Select id="p-pace" name="pace" defaultValue={profile.pace ?? "moderate"}>
              <option value="slow">Gradual</option>
              <option value="moderate">Moderate</option>
              <option value="faster">Faster</option>
            </Select>
          </Field>
          <Field label="Macro preference" htmlFor="p-macro">
            <Select
              id="p-macro"
              name="macro_preference"
              defaultValue={profile.macro_preference}
            >
              <option value="balanced">Balanced</option>
              <option value="higher_protein">Higher protein</option>
              <option value="higher_carb">Higher carb</option>
              <option value="lower_carb">Lower carb</option>
            </Select>
          </Field>
          <Field
            label="Manual calorie target"
            htmlFor="p-cal"
            hint="Leave blank to use the calculated target."
          >
            <Input
              id="p-cal"
              name="calorie_override"
              type="number"
              min={1000}
              max={6000}
              defaultValue={profile.calorie_override ?? ""}
            />
          </Field>
          <Field label="Water goal (ml)" htmlFor="p-water">
            <Input
              id="p-water"
              name="water_goal_ml"
              type="number"
              min={500}
              max={6000}
              step={50}
              defaultValue={profile.water_goal_ml}
            />
          </Field>
          <Field label="Step goal" htmlFor="p-steps">
            <Input
              id="p-steps"
              name="step_goal"
              type="number"
              min={1000}
              max={30000}
              step={500}
              defaultValue={profile.step_goal}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <SectionHeading title="Training" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Experience" htmlFor="p-exp">
            <Select
              id="p-exp"
              name="experience"
              defaultValue={profile.experience ?? "beginner"}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </Field>
          <Field label="Lifting days per week" htmlFor="p-days">
            <Input
              id="p-days"
              name="workout_days"
              type="number"
              min={2}
              max={6}
              defaultValue={profile.workout_days ?? 3}
            />
          </Field>
          <Field label="Session length (min)" htmlFor="p-minutes">
            <Input
              id="p-minutes"
              name="workout_minutes"
              type="number"
              min={20}
              max={120}
              step={5}
              defaultValue={profile.workout_minutes ?? 45}
            />
          </Field>
          <Field label="Cardio days per week" htmlFor="p-cardio">
            <Input
              id="p-cardio"
              name="cardio_days"
              type="number"
              min={0}
              max={7}
              defaultValue={profile.cardio_days ?? 3}
            />
          </Field>
        </div>
        <fieldset className="mt-3">
          <legend className="mb-2 text-sm font-medium">Equipment</legend>
          <input type="hidden" name="equipmentSubmitted" value="1" />
          <div className="flex flex-wrap gap-3">
            {EQUIPMENT.map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="equipment"
                  value={item}
                  defaultChecked={profile.equipment.includes(item as never)}
                />
                {item.replace("_", " ")}
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card>
        <SectionHeading title="Food preferences" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Allergies" htmlFor="p-allergies" hint="Comma separated.">
            <Input id="p-allergies" name="allergies" defaultValue={profile.allergies} />
          </Field>
          <Field label="Disliked foods" htmlFor="p-dislikes" hint="Comma separated.">
            <Input id="p-dislikes" name="dislikes" defaultValue={profile.dislikes} />
          </Field>
        </div>
      </Card>

      <Card>
        <SectionHeading title="App" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Detail level" htmlFor="p-mode">
            <Select id="p-mode" name="mode" defaultValue={profile.mode}>
              <option value="beginner">Beginner — simpler screens</option>
              <option value="advanced">Advanced — show all the numbers</option>
            </Select>
          </Field>
          <Field label="Theme preference" htmlFor="p-theme">
            <Select
              key={profile.theme}
              id="p-theme"
              name="theme"
              defaultValue={profile.theme}
            >
              <option value="system">Follow system</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </Field>
        </div>
        <fieldset className="mt-3">
          <legend className="mb-2 text-sm font-medium">Reminders</legend>
          <div className="flex flex-wrap gap-3">
            {Object.entries(profile.notifications).map(([key, enabled]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name={`notify_${key}`}
                  defaultChecked={enabled}
                />
                {key}
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      {state?.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.message ? <p className="text-sm text-brand">{state.message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
