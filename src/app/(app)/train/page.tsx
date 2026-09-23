import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  LinkButton,
  SectionHeading,
} from "@/components/ui";
import { startWorkoutAction } from "@/app/actions";
import { generateWorkoutProgram } from "@/lib/planner/workouts";
import { workoutHistory } from "@/lib/logs";
import { requireOnboardedProfile } from "@/lib/session";
import type { Equipment, Experience, Goal } from "@/lib/calc/types";

export default async function TrainPage() {
  const { user, profile } = await requireOnboardedProfile();
  const program = generateWorkoutProgram({
    goal: (profile.goal ?? "maintain") as Goal,
    experience: (profile.experience ?? "beginner") as Experience,
    daysPerWeek: profile.workout_days ?? 3,
    sessionMinutes: profile.workout_minutes ?? 45,
    equipment: (profile.equipment.length
      ? profile.equipment
      : ["bodyweight"]) as Equipment[],
  });
  const history = workoutHistory(user.id, 6);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Training</h1>
          <p className="text-sm text-muted">{program.name}</p>
        </div>
        <LinkButton href="/train/exercises" variant="secondary" className="px-3 py-1.5 text-xs">
          Exercise library
        </LinkButton>
      </div>

      <Card>
        <p className="text-sm text-muted">{program.rationale}</p>
      </Card>

      {program.days.map((day) => (
        <Card key={day.key}>
          <SectionHeading
            title={day.name}
            subtitle={`${day.focus} · about ${day.estimatedMinutes} min`}
            action={
              <form action={startWorkoutAction}>
                <input type="hidden" name="name" value={day.name} />
                <input type="hidden" name="dayKey" value={day.key} />
                <Button type="submit" className="px-3 py-1.5 text-xs">
                  Start
                </Button>
              </form>
            }
          />
          <ul className="divide-y divide-border">
            {day.exercises.map((exercise) => (
              <li key={exercise.exerciseId} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <Link
                    href={`/train/exercises/${exercise.exerciseId}`}
                    className="text-sm font-medium underline-offset-2 hover:underline"
                  >
                    {exercise.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {exercise.sets} × {exercise.reps} · {exercise.restSeconds}s rest
                  </p>
                </div>
                <Badge>{exercise.difficulty}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      ))}

      {history.length ? (
        <Card>
          <SectionHeading title="Recent sessions" />
          <ul className="divide-y divide-border text-sm">
            {history.map((session) => (
              <li key={session.id} className="flex justify-between py-2">
                <Link href={`/train/session/${session.id}`} className="underline-offset-2 hover:underline">
                  {session.name}
                </Link>
                <span className="text-muted">
                  {session.date} · {session.status === "complete" ? "done" : "in progress"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
