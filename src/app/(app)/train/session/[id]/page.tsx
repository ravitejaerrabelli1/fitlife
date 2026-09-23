import { notFound } from "next/navigation";
import { Card, Disclaimer } from "@/components/ui";
import {
  WorkoutTracker,
  type TrackerExercise,
} from "@/components/workout-tracker";
import { all, get } from "@/lib/db";
import { EXERCISES, getExercise } from "@/lib/content/exercises";
import { exerciseHistory } from "@/lib/logs";
import {
  availableEquipmentTags,
  generateWorkoutProgram,
  suggestProgression,
} from "@/lib/planner/workouts";
import { requireOnboardedProfile } from "@/lib/session";
import type { Equipment, Experience, Goal } from "@/lib/calc/types";

interface SessionRow {
  id: string;
  name: string;
  day_key: string;
  status: string;
  date: string;
}

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, profile } = await requireOnboardedProfile();
  const { id } = await params;
  const session = get<SessionRow>(
    "SELECT id, name, day_key, status, date FROM workout_sessions WHERE id = ? AND user_id = ?",
    [id, user.id],
  );
  if (!session) notFound();

  const equipment = (profile.equipment.length
    ? profile.equipment
    : ["bodyweight"]) as Equipment[];
  const program = generateWorkoutProgram({
    goal: (profile.goal ?? "maintain") as Goal,
    experience: (profile.experience ?? "beginner") as Experience,
    daysPerWeek: profile.workout_days ?? 3,
    sessionMinutes: profile.workout_minutes ?? 45,
    equipment,
  });
  const day =
    program.days.find((item) => item.key === session.day_key) ?? program.days[0];
  const tags = availableEquipmentTags(equipment);

  const loggedSets = all<{
    exercise_id: string;
    set_number: number;
    weight_kg: number;
    reps: number;
  }>(
    "SELECT exercise_id, set_number, weight_kg, reps FROM workout_sets WHERE session_id = ? AND user_id = ?",
    [session.id, user.id],
  );

  const exercises: TrackerExercise[] = day.exercises.map((planned) => {
    const base = getExercise(planned.exerciseId);
    const history = exerciseHistory(user.id, planned.exerciseId);
    const progression = suggestProgression({
      history: history.map((set) => ({
        weightKg: set.weight_kg,
        reps: set.reps,
        date: set.date,
      })),
      repRange: planned.reps,
    });
    return {
      exerciseId: planned.exerciseId,
      name: planned.name,
      sets: planned.sets,
      reps: planned.reps,
      restSeconds: planned.restSeconds,
      notes: planned.notes,
      suggestion: progression.message,
      suggestedWeightKg: progression.suggestedWeightKg,
      loggedSets: loggedSets
        .filter((set) => set.exercise_id === planned.exerciseId)
        .map((set) => ({
          setNumber: set.set_number,
          weightKg: set.weight_kg,
          reps: set.reps,
        })),
      alternatives: EXERCISES.filter(
        (candidate) =>
          candidate.id !== planned.exerciseId &&
          base != null &&
          candidate.group === base.group &&
          candidate.equipment.some((tag) => tags.includes(tag)),
      )
        .slice(0, 6)
        .map((candidate) => ({ id: candidate.id, name: candidate.name })),
    };
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">{session.name}</h1>
        <p className="text-sm text-muted">
          {session.date} ·{" "}
          {session.status === "complete" ? "completed" : "in progress"} · {day.focus}
        </p>
      </div>

      {session.status === "complete" ? (
        <Card>
          <p className="text-sm">
            This session is finished. Sets are saved and will feed your progression
            suggestions.
          </p>
        </Card>
      ) : null}

      <WorkoutTracker
        sessionId={session.id}
        exercises={exercises}
        weightUnit={profile.units === "imperial" ? "lb" : "kg"}
      />

      <Disclaimer />
    </div>
  );
}
