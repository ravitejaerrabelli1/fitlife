import Link from "next/link";
import { Badge, Card, EmptyState, Input, Button, SectionHeading, Select } from "@/components/ui";
import { EXERCISES, MUSCLE_GROUPS } from "@/lib/content/exercises";
import { requireSession } from "@/lib/session";

export default async function ExerciseLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; group?: string; equipment?: string }>;
}) {
  await requireSession();
  const { q = "", group = "", equipment = "" } = await searchParams;

  const filtered = EXERCISES.filter((exercise) => {
    if (q && !exercise.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (group && exercise.group !== group) return false;
    if (equipment && !exercise.equipment.includes(equipment as never)) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Exercise library</h1>
        <p className="text-sm text-muted">{filtered.length} exercises</p>
      </div>

      <Card>
        <form action="/train/exercises" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Input name="q" defaultValue={q} placeholder="Search" aria-label="Search exercises" />
          <Select name="group" defaultValue={group} aria-label="Muscle group">
            <option value="">All muscles</option>
            {MUSCLE_GROUPS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </Select>
          <Select name="equipment" defaultValue={equipment} aria-label="Equipment">
            <option value="">Any equipment</option>
            {["barbell", "dumbbell", "machine", "cable", "bodyweight", "band"].map(
              (tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ),
            )}
          </Select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>
      </Card>

      {MUSCLE_GROUPS.map((groupItem) => {
        const items = filtered.filter((exercise) => exercise.group === groupItem.key);
        if (!items.length) return null;
        return (
          <Card key={groupItem.key}>
            <SectionHeading title={groupItem.label} subtitle={`${items.length} exercises`} />
            <ul className="divide-y divide-border">
              {items.map((exercise) => (
                <li key={exercise.id} className="flex items-center justify-between gap-3 py-2">
                  <Link
                    href={`/train/exercises/${exercise.id}`}
                    className="text-sm font-medium underline-offset-2 hover:underline"
                  >
                    {exercise.name}
                  </Link>
                  <span className="flex gap-1.5">
                    <Badge>{exercise.difficulty}</Badge>
                    <Badge tone="brand">{exercise.equipment[0]}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}

      {!filtered.length ? (
        <EmptyState
          title="No exercises match"
          description="Try clearing the equipment or muscle filter."
        />
      ) : null}
    </div>
  );
}
