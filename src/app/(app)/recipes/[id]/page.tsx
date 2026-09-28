import { notFound } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  Input,
  SectionHeading,
  Select,
} from "@/components/ui";
import { quickLogFoodAction, toggleFavoriteAction } from "@/app/actions";
import { getRecipe } from "@/lib/content/recipes";
import { MEAL_SLOTS } from "@/lib/content/types";
import { scaleNutrition, scaleRecipe } from "@/lib/calc/engine";
import { favorites } from "@/lib/logs";
import { requireSession } from "@/lib/session";

export default async function RecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ servings?: string }>;
}) {
  const user = await requireSession();
  const { id } = await params;
  const { servings: servingsParam } = await searchParams;
  const recipe = getRecipe(id);
  if (!recipe) notFound();

  const servings = Math.min(
    12,
    Math.max(0.5, Number(servingsParam) || recipe.servings),
  );
  const ingredients = scaleRecipe(recipe.ingredients, recipe.servings, servings);
  const perServing = scaleNutrition(
    {
      calories: recipe.calories,
      proteinG: recipe.proteinG,
      carbsG: recipe.carbsG,
      fatG: recipe.fatG,
    },
    1,
    1,
  );
  const isFavourite = favorites(user.id, "recipe").some(
    (item) => item.item_id === recipe.id,
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">{recipe.name}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone="brand">{recipe.cuisine.replace("_", " ")}</Badge>
          {recipe.tags.map((tag) => (
            <Badge key={tag}>{tag.replace("_", " ")}</Badge>
          ))}
        </div>
      </div>

      <Card>
        <SectionHeading
          title="Per serving"
          subtitle={`${recipe.prepMinutes} minutes · base recipe makes ${recipe.servings}`}
          action={
            <form action={toggleFavoriteAction}>
              <input type="hidden" name="itemType" value="recipe" />
              <input type="hidden" name="itemId" value={recipe.id} />
              <input type="hidden" name="path" value={`/recipes/${recipe.id}`} />
              <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">
                {isFavourite ? "Saved ✓" : "Save"}
              </Button>
            </form>
          }
        />
        <dl className="grid grid-cols-4 gap-3 text-center text-sm">
          <div>
            <dt className="text-xs text-muted">Calories</dt>
            <dd className="font-semibold">{perServing.calories}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Protein</dt>
            <dd className="font-semibold">{perServing.proteinG} g</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Carbs</dt>
            <dd className="font-semibold">{perServing.carbsG} g</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Fat</dt>
            <dd className="font-semibold">{perServing.fatG} g</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <SectionHeading title="Ingredients" subtitle={`Scaled to ${servings} servings`} />
        <form action={`/recipes/${recipe.id}`} className="mb-3 flex gap-2">
          <Input
            name="servings"
            type="number"
            step="0.5"
            min="0.5"
            max="12"
            defaultValue={servings}
            aria-label="Servings"
            className="w-24"
          />
          <Button type="submit" variant="secondary">
            Rescale
          </Button>
        </form>
        <ul className="divide-y divide-border text-sm">
          {ingredients.map((ingredient) => (
            <li key={ingredient.name} className="flex justify-between py-1.5">
              <span>{ingredient.name}</span>
              <span className="text-muted">
                {ingredient.quantity} {ingredient.unit}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <SectionHeading title="Method" />
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          {recipe.instructions.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Card>

      <Card>
        <SectionHeading title="Log this" />
        <form action={quickLogFoodAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="name" value={recipe.name} />
          <input type="hidden" name="foodId" value={recipe.id} />
          <input type="hidden" name="source" value="recipe" />
          <input type="hidden" name="calories" value={recipe.calories} />
          <input type="hidden" name="protein" value={recipe.proteinG} />
          <input type="hidden" name="carbs" value={recipe.carbsG} />
          <input type="hidden" name="fat" value={recipe.fatG} />
          <input type="hidden" name="fiber" value={recipe.fiberG} />
          <Select name="meal" defaultValue={recipe.slots[0]} aria-label="Meal">
            {MEAL_SLOTS.map((slot) => (
              <option key={slot.key} value={slot.key}>
                {slot.label}
              </option>
            ))}
          </Select>
          <Input
            name="servings"
            type="number"
            step="0.25"
            min="0.25"
            defaultValue={1}
            aria-label="Servings eaten"
            className="w-24"
          />
          <Button type="submit">Log</Button>
        </form>
      </Card>
    </div>
  );
}
