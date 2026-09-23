"use client";

import { useActionState, useState } from "react";
import { saveOnboardingAction, type ActionResult } from "@/app/actions";
import {
  Button,
  Card,
  Disclaimer,
  Field,
  Input,
  Select,
  cx,
} from "./ui";

const STEPS = [
  "About you",
  "Your goal",
  "Body measurements",
  "Lifestyle & training",
  "Food preferences",
];

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary — desk job, little exercise" },
  { value: "light", label: "Lightly active — 1-3 sessions a week" },
  { value: "moderate", label: "Moderately active — 3-5 sessions a week" },
  { value: "very", label: "Very active — 6-7 sessions a week" },
  { value: "extreme", label: "Extremely active — physical job or two-a-days" },
];

const GOAL_OPTIONS = [
  { value: "lose", label: "Lose weight", hint: "A modest deficit you can keep to." },
  { value: "maintain", label: "Maintain weight", hint: "Hold steady and train." },
  { value: "gain", label: "Gain weight", hint: "A small, controlled surplus." },
  { value: "bulk", label: "Build muscle", hint: "Surplus with a lifting focus." },
  { value: "recomp", label: "Recomposition", hint: "Lose fat and add muscle slowly." },
];

const EQUIPMENT = [
  { value: "full_gym", label: "Full gym" },
  { value: "home_gym", label: "Home gym" },
  { value: "dumbbells", label: "Dumbbells" },
  { value: "barbells", label: "Barbell" },
  { value: "machines", label: "Machines" },
  { value: "bands", label: "Resistance bands" },
  { value: "bodyweight", label: "Bodyweight only" },
];

const DIET_PREFS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "gluten_free", label: "Gluten free" },
  { value: "dairy_free", label: "Dairy free" },
  { value: "low_carb", label: "Lower carb" },
  { value: "high_protein", label: "Higher protein" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "indian", label: "Indian" },
  { value: "mexican", label: "Mexican" },
  { value: "asian", label: "Asian" },
  { value: "middle_eastern", label: "Middle Eastern" },
  { value: "american", label: "American" },
];

export function OnboardingWizard({ firstName }: { firstName: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    saveOnboardingAction,
    null,
  );
  const [step, setStep] = useState(0);
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [goal, setGoal] = useState("lose");

  const isLastStep = step === STEPS.length - 1;

  function handleAction(formData: FormData) {
    if (!isLastStep) {
      setStep((current) => Math.min(current + 1, STEPS.length - 1));
      return;
    }
    formAction(formData);
  }

  const weightUnit = units === "metric" ? "kg" : "lb";
  const lengthUnit = units === "metric" ? "cm" : "in";
  const showPace = goal === "lose" || goal === "gain" || goal === "bulk";

  return (
    <form
      action={handleAction}
      className="space-y-5"
      onKeyDown={(event) => {
        const target = event.target as HTMLElement;
        if (!isLastStep && event.key === "Enter" && target.tagName !== "TEXTAREA") {
          event.preventDefault();
          setStep((current) => Math.min(current + 1, STEPS.length - 1));
        }
      }}
    >
      <ol className="flex gap-1.5" aria-label="Onboarding progress">
        {STEPS.map((label, index) => (
          <li key={label} className="flex-1">
            <div
              className={cx(
                "h-1.5 rounded-full",
                index <= step ? "bg-brand" : "bg-surface-muted",
              )}
            />
            <span className="sr-only">
              {label}
              {index === step ? " (current step)" : ""}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted">
        Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </p>

      <Card className="space-y-4">
        <div className={step === 0 ? "space-y-4" : "hidden"}>
          <Field label="First name" htmlFor="firstName">
            <Input
              id="firstName"
              name="firstName"
              defaultValue={firstName}
              autoComplete="given-name"
            />
          </Field>
          <Field label="Units" htmlFor="units">
            <Select
              id="units"
              name="units"
              value={units}
              onChange={(event) =>
                setUnits(event.target.value as "metric" | "imperial")
              }
            >
              <option value="metric">Metric (kg, cm)</option>
              <option value="imperial">Imperial (lb, ft/in)</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age" htmlFor="age">
              <Input id="age" name="age" type="number" min={13} max={100} required />
            </Field>
            <Field label="Sex" htmlFor="sex" hint="Used by the BMR formula.">
              <Select id="sex" name="sex" defaultValue="female">
                <option value="female">Female</option>
                <option value="male">Male</option>
              </Select>
            </Field>
          </div>
          {units === "metric" ? (
            <Field label="Height (cm)" htmlFor="heightCm">
              <Input id="heightCm" name="heightCm" type="number" min={120} max={230} />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Height (ft)" htmlFor="heightFt">
                <Input id="heightFt" name="heightFt" type="number" min={4} max={7} />
              </Field>
              <Field label="Height (in)" htmlFor="heightIn">
                <Input id="heightIn" name="heightIn" type="number" min={0} max={11} />
              </Field>
            </div>
          )}
          <Field label={`Current weight (${weightUnit})`} htmlFor="weight">
            <Input id="weight" name="weight" type="number" step="0.1" required />
          </Field>
          <Field label="Activity level" htmlFor="activityLevel">
            <Select id="activityLevel" name="activityLevel" defaultValue="light">
              {ACTIVITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className={step === 1 ? "space-y-4" : "hidden"}>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">What do you want to do?</legend>
            {GOAL_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={cx(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3",
                  goal === option.value
                    ? "border-brand bg-brand/5"
                    : "border-border",
                )}
              >
                <input
                  type="radio"
                  name="goal"
                  value={option.value}
                  checked={goal === option.value}
                  onChange={() => setGoal(option.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-xs text-muted">{option.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
          {showPace ? (
            <Field
              label="Pace"
              htmlFor="pace"
              hint="Faster is not better — slower paces are easier to sustain and protect muscle."
            >
              <Select id="pace" name="pace" defaultValue="moderate">
                <option value="slow">Gradual</option>
                <option value="moderate">Steady</option>
                <option value="faster">Faster</option>
              </Select>
            </Field>
          ) : (
            <input type="hidden" name="pace" value="moderate" />
          )}
          <Field label="Macro style" htmlFor="macroPreference">
            <Select id="macroPreference" name="macroPreference" defaultValue="balanced">
              <option value="balanced">Balanced</option>
              <option value="higher_protein">Higher protein</option>
              <option value="higher_carb">Higher carb</option>
              <option value="lower_carb">Lower carb</option>
            </Select>
          </Field>
        </div>

        <div className={step === 2 ? "space-y-4" : "hidden"}>
          <p className="text-sm text-muted">
            All optional. Measurements make body-fat estimates and progress
            tracking more useful, but nothing here is required.
          </p>
          <Field label="Body fat %" htmlFor="bodyFat" hint="If you already know it.">
            <Input id="bodyFat" name="bodyFat" type="number" step="0.1" min={3} max={70} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Waist (${lengthUnit})`} htmlFor="waist">
              <Input id="waist" name="waist" type="number" step="0.1" />
            </Field>
            <Field label={`Neck (${lengthUnit})`} htmlFor="neck">
              <Input id="neck" name="neck" type="number" step="0.1" />
            </Field>
            <Field label={`Hips (${lengthUnit})`} htmlFor="hip">
              <Input id="hip" name="hip" type="number" step="0.1" />
            </Field>
          </div>
        </div>

        <div className={step === 3 ? "space-y-4" : "hidden"}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Daily steps" htmlFor="dailySteps">
              <Input id="dailySteps" name="dailySteps" type="number" min={0} max={40000} />
            </Field>
            <Field label="Sleep (hours)" htmlFor="sleepHours">
              <Input id="sleepHours" name="sleepHours" type="number" step="0.5" min={3} max={14} />
            </Field>
          </div>
          <Field label="Occupation type" htmlFor="occupation">
            <Select id="occupation" name="occupation" defaultValue="desk">
              <option value="desk">Mostly seated</option>
              <option value="mixed">Mixed sitting and standing</option>
              <option value="active">On my feet all day</option>
              <option value="manual">Physical/manual work</option>
            </Select>
          </Field>
          <Field label="Experience" htmlFor="experience">
            <Select id="experience" name="experience" defaultValue="beginner">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Training days per week" htmlFor="workoutDays">
              <Input
                id="workoutDays"
                name="workoutDays"
                type="number"
                min={2}
                max={6}
                defaultValue={3}
              />
            </Field>
            <Field label="Minutes per session" htmlFor="workoutMinutes">
              <Input
                id="workoutMinutes"
                name="workoutMinutes"
                type="number"
                min={20}
                max={120}
                step={5}
                defaultValue={45}
              />
            </Field>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Equipment available</legend>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT.map((item) => (
                <label
                  key={item.value}
                  className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="equipment"
                    value={item.value}
                    defaultChecked={item.value === "bodyweight"}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className={step === 4 ? "space-y-4" : "hidden"}>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">
              Dietary preferences and cuisines
            </legend>
            <div className="flex flex-wrap gap-2">
              {DIET_PREFS.map((item) => (
                <label
                  key={item.value}
                  className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <input type="checkbox" name="dietPrefs" value={item.value} />
                  {item.label}
                </label>
              ))}
            </div>
          </fieldset>
          <Field
            label="Allergies"
            htmlFor="allergies"
            hint="Comma separated, e.g. peanut, shellfish. Recipes containing them are excluded."
          >
            <Input id="allergies" name="allergies" placeholder="peanut, shellfish" />
          </Field>
          <Field
            label="Foods you dislike"
            htmlFor="dislikes"
            hint="Comma separated, e.g. mushrooms, olives."
          >
            <Input id="dislikes" name="dislikes" placeholder="mushrooms, olives" />
          </Field>
          <Field label="How much detail do you want?" htmlFor="mode">
            <Select id="mode" name="mode" defaultValue="beginner">
              <option value="beginner">Keep it simple</option>
              <option value="advanced">Show advanced detail</option>
            </Select>
          </Field>
          <Disclaimer />
        </div>
      </Card>

      {state?.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-3">
        {step > 0 ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStep((current) => current - 1)}
          >
            Back
          </Button>
        ) : null}
        {isLastStep ? (
          <Button key="submit" type="submit" className="flex-1" disabled={pending}>
            {pending ? "Building your plan…" : "Build my plan"}
          </Button>
        ) : (
          <Button
            key="next"
            type="button"
            className="flex-1"
            onClick={() => setStep((current) => current + 1)}
          >
            Continue
          </Button>
        )}
      </div>
    </form>
  );
}
