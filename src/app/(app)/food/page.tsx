import { redirect } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  LinkButton,
  ProgressBar,
  SectionHeading,
  Select,
} from "@/components/ui";
import { CustomFoodForm, FoodLogRow, ManualFoodForm } from "@/components/food-forms";
import { deleteFoodLogAction } from "@/app/actions";
import {
  customFoods,
  getNutritionLogs,
  recentFoods,
  sumLogs,
} from "@/lib/logs";
import { searchFoods } from "@/lib/content/food-search";
import { RESTAURANT_ESTIMATES } from "@/lib/content/foods";
import { computeTargets } from "@/lib/profile";
import { requireOnboardedProfile } from "@/lib/session";
import { today } from "@/lib/db";
import { localHour } from "@/lib/dates";
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

  const { q = "", mode = "search", meal = defaultMeal(profile.time_zone) } = await searchParams;
  const date = today(profile.time_zone);
  const logs = getNutritionLogs(user.id, date);
  const totals = sumLogs(logs);

  const results: FoodItem[] =
    mode === "restaurant"
      ? RESTAURANT_ESTIMATES
      : q
        ? searchFoods(q, 25)
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
        <nav aria-label="Food sections" className="mt-3 flex flex-wrap gap-2">
          <LinkButton href="/recipes" variant="secondary" className="px-3 py-1.5 text-xs">
            Recipes
          </LinkButton>
          <LinkButton href="/meal-plan" variant="secondary" className="px-3 py-1.5 text-xs">
            Meal plan
          </LinkButton>
          <LinkButton href="/favorites" variant="secondary" className="px-3 py-1.5 text-xs">
            Favourites
          </LinkButton>
        </nav>
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
            placeholder="Search 7,800+ foods, e.g. apple, dosa"
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
              : q
                ? `No foods match "${q}". Check the spelling, or add it with Quick entry or Save a custom food below.`
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
        <SectionHeading
          title="Quick entry"
          subtitle="Start typing, pick a food, then enter how much you ate. The nutrition updates as you type."
        />
        <ManualFoodForm
          defaultMeal={meal}
          savedFoods={saved.map((item) => ({
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
          }))}
        />
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
    <FoodLogRow
      item={item}
      meal={meal}
      badge={item.restaurant ? <Badge tone="warn">estimate</Badge> : null}
    />
  );
}

function defaultMeal(timeZone: string): string {
  const hour = localHour(timeZone);
  if (hour < 10) return "breakfast";
  if (hour < 12) return "morning_snack";
  if (hour < 15) return "lunch";
  if (hour < 18) return "afternoon_snack";
  return "dinner";
}
