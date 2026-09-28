import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  SectionHeading,
  Select,
} from "@/components/ui";
import { RECIPES } from "@/lib/content/recipes";
import { MEAL_SLOTS } from "@/lib/content/types";
import { favorites } from "@/lib/logs";
import { requireSession } from "@/lib/session";

const CUISINES = [
  "american",
  "indian",
  "mexican",
  "mediterranean",
  "asian",
  "middle_eastern",
];

const DIETS = ["vegetarian", "vegan", "pescatarian", "gluten_free", "dairy_free"];

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireSession();
  const params = await searchParams;
  const favouriteIds = new Set(
    favorites(user.id, "recipe").map((item) => item.item_id),
  );

  const maxCalories = Number(params.maxCalories) || undefined;
  const minProtein = Number(params.minProtein) || undefined;
  const maxPrep = Number(params.maxPrep) || undefined;

  const filtered = RECIPES.filter((recipe) => {
    if (params.q && !recipe.name.toLowerCase().includes(params.q.toLowerCase()))
      return false;
    if (params.cuisine && recipe.cuisine !== params.cuisine) return false;
    if (params.diet && !recipe.tags.includes(params.diet)) return false;
    if (params.slot && !recipe.slots.includes(params.slot as never)) return false;
    if (maxCalories && recipe.calories > maxCalories) return false;
    if (minProtein && recipe.proteinG < minProtein) return false;
    if (maxPrep && recipe.prepMinutes > maxPrep) return false;
    if (params.budget === "on" && !recipe.budgetFriendly) return false;
    if (params.favourites === "on" && !favouriteIds.has(recipe.id)) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Recipes</h1>
        <p className="text-sm text-muted">
          {filtered.length} of {RECIPES.length} recipes
        </p>
      </div>

      <Card>
        <SectionHeading title="Filter" />
        <form action="/recipes" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Input name="q" defaultValue={params.q ?? ""} placeholder="Search" aria-label="Search recipes" />
          <Select name="cuisine" defaultValue={params.cuisine ?? ""} aria-label="Cuisine">
            <option value="">Any cuisine</option>
            {CUISINES.map((cuisine) => (
              <option key={cuisine} value={cuisine}>
                {cuisine.replace("_", " ")}
              </option>
            ))}
          </Select>
          <Select name="diet" defaultValue={params.diet ?? ""} aria-label="Dietary style">
            <option value="">Any diet</option>
            {DIETS.map((diet) => (
              <option key={diet} value={diet}>
                {diet.replace("_", " ")}
              </option>
            ))}
          </Select>
          <Select name="slot" defaultValue={params.slot ?? ""} aria-label="Meal type">
            <option value="">Any meal</option>
            {MEAL_SLOTS.map((slot) => (
              <option key={slot.key} value={slot.key}>
                {slot.label}
              </option>
            ))}
          </Select>
          <Input
            name="maxCalories"
            type="number"
            defaultValue={params.maxCalories ?? ""}
            placeholder="Max kcal"
            aria-label="Maximum calories"
          />
          <Input
            name="minProtein"
            type="number"
            defaultValue={params.minProtein ?? ""}
            placeholder="Min protein g"
            aria-label="Minimum protein"
          />
          <Input
            name="maxPrep"
            type="number"
            defaultValue={params.maxPrep ?? ""}
            placeholder="Max prep min"
            aria-label="Maximum prep time"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="budget" defaultChecked={params.budget === "on"} />
            Budget friendly
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="favourites"
              defaultChecked={params.favourites === "on"}
            />
            Favourites only
          </label>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>
      </Card>

      {filtered.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((recipe) => (
            <Card key={recipe.id} as="li">
              <Link href={`/recipes/${recipe.id}`} className="block">
                <p className="font-medium">{recipe.name}</p>
                <p className="mt-1 text-xs text-muted">
                  {recipe.calories} kcal · {recipe.proteinG}g protein ·{" "}
                  {recipe.prepMinutes} min
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="brand">{recipe.cuisine.replace("_", " ")}</Badge>
                  {recipe.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag}>{tag.replace("_", " ")}</Badge>
                  ))}
                  {favouriteIds.has(recipe.id) ? <Badge tone="warn">saved</Badge> : null}
                </div>
              </Link>
            </Card>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No recipes match"
          description="Loosen a filter — for example raise the calorie ceiling or clear the cuisine."
        />
      )}
    </div>
  );
}
