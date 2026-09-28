import { notFound } from "next/navigation";
import { Badge, Button, Card, Disclaimer, SectionHeading } from "@/components/ui";
import { toggleFavoriteAction } from "@/app/actions";
import { getExercise } from "@/lib/content/exercises";
import { exerciseHistory, favorites } from "@/lib/logs";
import { estimatedOneRepMax, suggestProgression } from "@/lib/planner/workouts";
import { requireSession } from "@/lib/session";

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSession();
  const { id } = await params;
  const exercise = getExercise(id);
  if (!exercise) notFound();

  const history = exerciseHistory(user.id, exercise.id);
  const progression = suggestProgression({
    history: history.map((set) => ({
      weightKg: set.weight_kg,
      reps: set.reps,
      date: set.date,
    })),
    repRange: exercise.defaultReps,
  });
  const isFavourite = favorites(user.id, "exercise").some(
    (item) => item.item_id === exercise.id,
  );
  const best = history.reduce(
    (max, set) => Math.max(max, estimatedOneRepMax(set.weight_kg, set.reps)),
    0,
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{exercise.name}</h1>
          <p className="text-sm text-muted">
            {exercise.targets.join(", ")} · {exercise.defaultSets} ×{" "}
            {exercise.defaultReps} · {exercise.restSeconds}s rest
          </p>
        </div>
        <form action={toggleFavoriteAction}>
          <input type="hidden" name="itemType" value="exercise" />
          <input type="hidden" name="itemId" value={exercise.id} />
          <input type="hidden" name="path" value={`/train/exercises/${exercise.id}`} />
          <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">
            {isFavourite ? "Saved ✓" : "Save"}
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge tone="brand">{exercise.group}</Badge>
        <Badge>{exercise.difficulty}</Badge>
        {exercise.equipment.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>

      <Card>
        <SectionHeading title="Set up" />
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          {exercise.setup.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <SectionHeading title="How to do it" />
        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          {exercise.steps.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-muted">Breathing: {exercise.breathing}</p>
        {exercise.tempo ? (
          <p className="text-sm text-muted">Tempo: {exercise.tempo}</p>
        ) : null}
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <SectionHeading title="Form tips" />
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            {exercise.formTips.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <SectionHeading title="Common mistakes" />
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            {exercise.mistakes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <SectionHeading title="Make it easier or harder" />
        <p className="text-sm">
          <strong>Easier:</strong> {exercise.easier}
        </p>
        <p className="mt-1.5 text-sm">
          <strong>Harder:</strong> {exercise.harder}
        </p>
      </Card>

      <Card>
        <SectionHeading
          title="Your history"
          subtitle={
            best ? `Best estimated 1RM about ${Math.round(best)} kg` : undefined
          }
        />
        {history.length ? (
          <>
            <p className="mb-3 text-sm text-muted">{progression.message}</p>
            <ul className="divide-y divide-border text-sm">
              {history
                .slice(-10)
                .reverse()
                .map((set, index) => (
                  <li
                    key={`${set.date}-${index}`}
                    className="flex justify-between py-1.5"
                  >
                    <span>
                      {set.weight_kg} kg × {set.reps}
                    </span>
                    <span className="text-muted">{set.date}</span>
                  </li>
                ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted">
            No sets logged yet. Start a session from the Train tab to track this lift.
          </p>
        )}
      </Card>

      <Disclaimer />
    </div>
  );
}
