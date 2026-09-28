import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  SectionHeading,
  Select,
} from "@/components/ui";
import {
  generateMealPlanAction,
  logPlannedMealAction,
  swapMealAction,
} from "@/app/actions";
import { get } from "@/lib/db";
import { computeTargets } from "@/lib/profile";
import { requireOnboardedProfile } from "@/lib/session";
import type { MealPlan } from "@/lib/planner/meals";

export default async function MealPlanPage() {
  const { user, profile } = await requireOnboardedProfile();
  const targets = computeTargets(profile);
  if (!targets) redirect("/onboarding");

  const row = get<{ id: string; data: string; created_at: string }>(
    "SELECT id, data, created_at FROM meal_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
    [user.id],
  );
  const plan = row ? (JSON.parse(row.data) as MealPlan) : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Meal plan</h1>
        <p className="text-sm text-muted">
          Built around {targets.effectiveCalories} kcal and{" "}
          {targets.macros.proteinG} g protein a day.
        </p>
      </div>

      <Card>
        <SectionHeading title="Generate a plan" />
        <form action={generateMealPlanAction} className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1.5 block font-medium">Length</span>
            <Select name="days" defaultValue="7">
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
            </Select>
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium">Max prep (min)</span>
            <Input name="maxPrep" type="number" min={5} max={120} className="w-28" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="budget" />
            Budget friendly
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="eveningSnack" />
            Evening snack
          </label>
          <Button type="submit">Generate</Button>
        </form>
        <p className="mt-2 text-xs text-muted">
          Your dietary preferences, allergies and disliked foods are applied
          automatically.
        </p>
      </Card>

      {plan && row ? (
        <>
          {plan.days.map((day) => (
            <Card key={day.dayIndex}>
              <SectionHeading
                title={`Day ${day.dayIndex + 1} — ${day.date}`}
                subtitle={`${Math.round(day.totals.calories)} kcal · ${Math.round(day.totals.proteinG)}g protein · ${Math.round(day.totals.fiberG)}g fibre`}
              />
              <ul className="divide-y divide-border">
                {day.meals.map((meal) => (
                  <li key={meal.slot} className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-muted">{meal.slotLabel}</p>
                        <Link
                          href={`/recipes/${meal.recipeId}?servings=${meal.servings}`}
                          className="font-medium underline-offset-2 hover:underline"
                        >
                          {meal.name}
                        </Link>
                        <p className="text-xs text-muted">
                          {meal.servings}× serving · {meal.calories} kcal ·{" "}
                          {meal.proteinG}p {meal.carbsG}c {meal.fatG}f ·{" "}
                          {meal.prepMinutes} min
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <form action={swapMealAction}>
                          <input type="hidden" name="planId" value={row.id} />
                          <input type="hidden" name="dayIndex" value={day.dayIndex} />
                          <input type="hidden" name="slot" value={meal.slot} />
                          <Button
                            type="submit"
                            variant="secondary"
                            className="px-3 py-1.5 text-xs"
                          >
                            Swap
                          </Button>
                        </form>
                        <form action={logPlannedMealAction}>
                          <input type="hidden" name="date" value={day.date} />
                          <input type="hidden" name="slot" value={meal.slot} />
                          <input type="hidden" name="name" value={meal.name} />
                          <input type="hidden" name="servings" value={meal.servings} />
                          <input type="hidden" name="calories" value={meal.calories} />
                          <input type="hidden" name="protein" value={meal.proteinG} />
                          <input type="hidden" name="carbs" value={meal.carbsG} />
                          <input type="hidden" name="fat" value={meal.fatG} />
                          <input type="hidden" name="fiber" value={meal.fiberG} />
                          <Button type="submit" className="px-3 py-1.5 text-xs">
                            Log
                          </Button>
                        </form>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}

          <Card>
            <SectionHeading
              title="Grocery list"
              subtitle={`${plan.grocery.length} items across ${plan.days.length} days`}
            />
            <ul className="space-y-1.5 text-sm">
              {plan.grocery.map((line) => (
                <li key={`${line.name}-${line.unit}`} className="flex justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <Badge>{line.category}</Badge>
                    {line.name}
                  </span>
                  <span className="text-muted">
                    {line.quantity} {line.unit}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : (
        <EmptyState
          title="No plan yet"
          description="Generate one above and you'll get meals plus a consolidated grocery list."
        />
      )}
    </div>
  );
}
