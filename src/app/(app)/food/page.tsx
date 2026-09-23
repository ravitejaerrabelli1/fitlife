import { redirect } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  ProgressBar,
  SectionHeading,
  Select,
} from "@/components/ui";
import { CustomFoodForm, ManualFoodForm } from "@/components/food-forms";
import { deleteFoodLogAction, quickLogFoodAction } from "@/app/actions";
import {
  customFoods,
  getNutritionLogs,
  recentFoods,
  sumLogs,
} from "@/lib/logs";
import { RESTAURANT_ESTIMATES, searchFoods } from "@/lib/content/foods";
import { computeTargets } from "@/lib/profile";
import { requireOnboardedProfile } from "@/lib/session";
import { today } from "@/lib/db";
import type { FoodItem } from "@/lib/content/types";

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  morning_snack: "Morning snack",
  lunch: "Lunch",
  afternoon_snack: "Afternoon snack",
  dinner: "Dinner",
  evening_snack: "Evening snack",
};

export default async function FoodPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; mode?: string; meal?: string }>;
}) {
  const { user, profile } = await requireOnboardedProfile();
  const targets = computeTargets(profile);
  if (!targets) redirect("/onboarding");

  const { q = "", mode = "search", meal = defaultMeal() } = await searchParams;
  const date = today();
  const logs = getNutritionLogs(user.id, date);
  const totals = sumLogs(logs);

  const results: FoodItem[] =
    mode === "restaurant"
      ? RESTAURANT_ESTIMATES
      : q
        ? searchFoods(q).slice(0, 25)
        : [];
  const recent = recentFoods(user.id, 8);
  const saved = customFoods(user.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Food</h1>
        <p className="text-sm text-muted">
          {Math.round(totals.calories)} of {targets.effectiveCalories} kcal today
        </p>
      </div>

      <Card className="space-y-3">
        <ProgressBar
          value={totals.calories}
          max={targets.effectiveCalories}
          label="Calories"
        />
        <div className="grid grid-cols-3 gap-3">
          <ProgressBar
            value={totals.proteinG}
            max={targets.macros.proteinG}
            label="Protein"
            color="var(--protein)"
          />
          <ProgressBar
            value={totals.carbsG}
            max={targets.macros.carbsG}
            label="Carbs"
            color="var(--carbs)"
          />
          <ProgressBar
            value={totals.fatG}
            max={targets.macros.fatG}
            label="Fat"
            color="var(--fat)"
          />
        </div>
      </Card>

      <Card>
        <SectionHeading
          title="Add food"
          subtitle="Search the database, or switch to restaurant estimates when eating out."
        />
        <form className="flex flex-wrap gap-2" action="/food">
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search foods"
            aria-label="Search foods"
            className="min-w-40 flex-1"
          />
          <Select name="meal" defaultValue={meal} aria-label="Meal">
            {Object.entries(MEAL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select name="mode" defaultValue={mode} aria-label="Mode">
            <option value="search">Foods</option>
            <option value="restaurant">Restaurant</option>
          </Select>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <ul className="mt-3 divide-y divide-border">
          {results.map((item) => (
            <li key={item.id} className="py-2">
              <FoodRow item={item} meal={meal} />
            </li>
          ))}
        </ul>
        {!results.length ? (
          <p className="mt-3 text-sm text-muted">
            {mode === "restaurant"
              ? "No restaurant estimates available."
              : "Search for a food to log it, or use a recent item below."}
          </p>
        ) : null}
      </Card>

      {recent.length ? (
        <Card>
          <SectionHeading title="Recent" />
          <ul className="divide-y divide-border">
            {recent.map((item) => (
              <li key={item.name} className="py-2">
                <FoodRow
                  item={{
                    id: `recent-${item.name}`,
                    name: item.name,
                    brand: "Recent",
                    serving: "as logged",
                    calories: item.calories,
                    proteinG: item.protein_g,
                    carbsG: item.carbs_g,
                    fatG: item.fat_g,
                    fiberG: item.fiber_g,
                    tags: [],
                  }}
                  meal={meal}
                />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {saved.length ? (
        <Card>
          <SectionHeading title="Your foods" />
          <ul className="divide-y divide-border">
            {saved.map((item) => (
              <li key={item.id} className="py-2">
                <FoodRow
                  item={{
                    id: item.id,
                    name: item.name,
                    brand: item.brand || "Saved",
                    serving: item.serving,
                    calories: item.calories,
                    proteinG: item.protein_g,
                    carbsG: item.carbs_g,
                    fatG: item.fat_g,
                    fiberG: item.fiber_g,
                    tags: [],
                  }}
                  meal={meal}
                />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <SectionHeading title="Quick entry" subtitle="Log something not in the list." />
        <ManualFoodForm defaultMeal={meal} />
      </Card>

      <Card>
        <SectionHeading
          title="Save a custom food"
          subtitle="Saved foods stay in your account for reuse."
        />
        <CustomFoodForm />
      </Card>

      <Card>
        <SectionHeading title="Today's log" />
        {logs.length ? (
          <ul className="divide-y divide-border">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{log.name}</p>
                  <p className="text-xs text-muted">
                    {MEAL_LABELS[log.meal] ?? log.meal} · {Math.round(log.calories)} kcal ·{" "}
                    {Math.round(log.protein_g)}p {Math.round(log.carbs_g)}c{" "}
                    {Math.round(log.fat_g)}f
                  </p>
                </div>
                <form action={deleteFoodLogAction}>
                  <input type="hidden" name="id" value={log.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    className="px-2 py-1 text-xs text-danger"
                    aria-label={`Remove ${log.name}`}
                  >
                    Remove
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Nothing logged yet"
            description="Search above or use quick entry to add your first item."
          />
        )}
      </Card>
    </div>
  );
}

function FoodRow({ item, meal }: { item: FoodItem; meal: string }) {
  return (
    <form
      action={quickLogFoodAction}
      className="flex flex-wrap items-center justify-between gap-2"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {item.name}{" "}
          {item.restaurant ? <Badge tone="warn">estimate</Badge> : null}
        </p>
        <p className="text-xs text-muted">
          {item.serving} · {item.calories} kcal · {item.proteinG}p {item.carbsG}c{" "}
          {item.fatG}f
        </p>
      </div>
      <input type="hidden" name="name" value={item.name} />
      <input type="hidden" name="foodId" value={item.id} />
      <input type="hidden" name="meal" value={meal} />
      <input type="hidden" name="calories" value={item.calories} />
      <input type="hidden" name="protein" value={item.proteinG} />
      <input type="hidden" name="carbs" value={item.carbsG} />
      <input type="hidden" name="fat" value={item.fatG} />
      <input type="hidden" name="fiber" value={item.fiberG} />
      <Input
        name="servings"
        type="number"
        step="0.25"
        min="0.25"
        defaultValue={1}
        aria-label={`Servings of ${item.name}`}
        className="w-20"
      />
      <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">
        Log
      </Button>
    </form>
  );
}

function defaultMeal(): string {
  const hour = new Date().getHours();
  if (hour < 10) return "breakfast";
  if (hour < 12) return "morning_snack";
  if (hour < 15) return "lunch";
  if (hour < 18) return "afternoon_snack";
  return "dinner";
}
