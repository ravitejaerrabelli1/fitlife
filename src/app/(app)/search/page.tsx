import Link from "next/link";
import { Button, Card, EmptyState, Input, SectionHeading } from "@/components/ui";
import { EXERCISES } from "@/lib/content/exercises";
import { RECIPES } from "@/lib/content/recipes";
import { CARDIO_ACTIVITIES } from "@/lib/content/cardio";
import { searchFoods } from "@/lib/content/foods";
import { requireSession } from "@/lib/session";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireSession();
  const { q = "" } = await searchParams;
  const term = q.trim().toLowerCase();

  const recipes = term
    ? RECIPES.filter((r) => r.name.toLowerCase().includes(term)).slice(0, 8)
    : [];
  const exercises = term
    ? EXERCISES.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          e.targets.some((t) => t.toLowerCase().includes(term)),
      ).slice(0, 8)
    : [];
  const foods = term ? searchFoods(term).slice(0, 8) : [];
  const cardio = term
    ? CARDIO_ACTIVITIES.filter((a) => a.name.toLowerCase().includes(term)).slice(0, 5)
    : [];
  const total = recipes.length + exercises.length + foods.length + cardio.length;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Search</h1>

      <Card>
        <form action="/search" className="flex gap-2">
          <Input
            name="q"
            defaultValue={q}
            placeholder="Recipes, exercises, foods, cardio"
            aria-label="Search everything"
          />
          <Button type="submit">Search</Button>
        </form>
      </Card>

      {recipes.length ? (
        <Card>
          <SectionHeading title="Recipes" />
          <ul className="divide-y divide-border text-sm">
            {recipes.map((recipe) => (
              <li key={recipe.id} className="py-2">
                <Link href={`/recipes/${recipe.id}`} className="hover:underline">
                  {recipe.name}
                </Link>
                <span className="ml-2 text-xs text-muted">
                  {recipe.calories} kcal · {recipe.proteinG}g protein
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {exercises.length ? (
        <Card>
          <SectionHeading title="Exercises" />
          <ul className="divide-y divide-border text-sm">
            {exercises.map((exercise) => (
              <li key={exercise.id} className="py-2">
                <Link
                  href={`/train/exercises/${exercise.id}`}
                  className="hover:underline"
                >
                  {exercise.name}
                </Link>
                <span className="ml-2 text-xs text-muted">{exercise.group}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {foods.length ? (
        <Card>
          <SectionHeading title="Foods" />
          <ul className="divide-y divide-border text-sm">
            {foods.map((food) => (
              <li key={food.id} className="flex justify-between py-2">
                <span>{food.name}</span>
                <span className="text-xs text-muted">
                  {food.serving} · {food.calories} kcal
                </span>
              </li>
            ))}
          </ul>
          <Link href={`/food?q=${encodeURIComponent(q)}`} className="mt-2 inline-block text-sm text-brand underline">
            Log one of these
          </Link>
        </Card>
      ) : null}

      {cardio.length ? (
        <Card>
          <SectionHeading title="Cardio" />
          <ul className="divide-y divide-border text-sm">
            {cardio.map((activity) => (
              <li key={activity.id} className="flex justify-between py-2">
                <span>{activity.name}</span>
                <span className="text-xs text-muted">{activity.intensity}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {term && total === 0 ? (
        <EmptyState
          title="Nothing found"
          description="Try a shorter term, like 'chicken', 'squat' or 'rowing'."
        />
      ) : null}
    </div>
  );
}
