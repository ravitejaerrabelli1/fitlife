import Link from "next/link";
import { Card, EmptyState, SectionHeading } from "@/components/ui";
import { getExercise } from "@/lib/content/exercises";
import { getRecipe } from "@/lib/content/recipes";
import { favorites } from "@/lib/logs";
import { requireSession } from "@/lib/session";

export default async function FavoritesPage() {
  const user = await requireSession();
  const saved = favorites(user.id);
  const recipes = saved
    .filter((item) => item.item_type === "recipe")
    .map((item) => getRecipe(item.item_id))
    .filter((recipe) => recipe != null);
  const exercises = saved
    .filter((item) => item.item_type === "exercise")
    .map((item) => getExercise(item.item_id))
    .filter((exercise) => exercise != null);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Saved</h1>

      {recipes.length ? (
        <Card>
          <SectionHeading title="Recipes" />
          <ul className="divide-y divide-border text-sm">
            {recipes.map((recipe) => (
              <li key={recipe.id} className="flex justify-between py-2">
                <Link href={`/recipes/${recipe.id}`} className="hover:underline">
                  {recipe.name}
                </Link>
                <span className="text-xs text-muted">
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
              <li key={exercise.id} className="flex justify-between py-2">
                <Link
                  href={`/train/exercises/${exercise.id}`}
                  className="hover:underline"
                >
                  {exercise.name}
                </Link>
                <span className="text-xs text-muted">{exercise.group}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {!recipes.length && !exercises.length ? (
        <EmptyState
          title="Nothing saved yet"
          description="Tap Save on a recipe or exercise and it will show up here."
        />
      ) : null}
    </div>
  );
}
