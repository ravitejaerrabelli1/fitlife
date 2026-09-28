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
  type WorkoutExercise,
} from "@/lib/planner/workouts";
import { requireOnboardedProfile } from "@/lib/session";
import { kgToLb, round } from "@/lib/calc/units";
import type { Equipment, Experience, Goal } from "@/lib/calc/types";

interface SessionRow {
  id: string;
  name: string;
  day_key: string;
  status: string;
  date: string;
  substitutions: string;
  plan: string;
}

interface SessionPlan {
  focus: string;
  exercises: WorkoutExercise[];
}

/** Sessions started before the snapshot column store no plan of their own. */
function parsePlan(raw: string): SessionPlan | null {
  try {
    const parsed: unknown = JSON.parse(raw || "");
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as SessionPlan).exercises)
    ) {
      return parsed as SessionPlan;
    }
  } catch {
    // Fall through to regenerating from the current profile.
  }
  return null;
}

function parseSubstitutions(raw: string): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(raw || "{}");
    if (parsed && typeof parsed === "object") return parsed as Record<string, string>;
  } catch {
    // Fall through to an empty map for corrupt rows.
  }
  return {};
}

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, profile } = await requireOnboardedProfile();
  const { id } = await params;
  const session = get<SessionRow>(
    "SELECT id, name, day_key, status, date, substitutions, plan FROM workout_sessions WHERE id = ? AND user_id = ?",
    [id, user.id],
  );
  if (!session) notFound();

  const equipment = (profile.equipment.length
    ? profile.equipment
    : ["bodyweight"]) as Equipment[];
  const snapshot = parsePlan(session.plan);
  const day =
    snapshot ??
    (() => {
      const program = generateWorkoutProgram({
        goal: (profile.goal ?? "maintain") as Goal,
        experience: (profile.experience ?? "beginner") as Experience,
        daysPerWeek: profile.workout_days ?? 3,
        sessionMinutes: profile.workout_minutes ?? 45,
        equipment,
      });
      const match =
        program.days.find((item) => item.key === session.day_key) ??
        program.days[0];
      return { focus: match.focus, exercises: match.exercises };
    })();
  const tags = availableEquipmentTags(equipment);
  const completed = session.status === "complete";
  const imperial = profile.units === "imperial";
  const weightUnit = imperial ? "lb" : "kg";
  // Weights are stored in kg; the tracker inputs work in the profile's unit.
  const toDisplay = (kg: number) => round(imperial ? kgToLb(kg) : kg, 1);

  const loggedSets = all<{
    exercise_id: string;
    set_number: number;
    weight_kg: number;
    reps: number;
  }>(
    "SELECT exercise_id, set_number, weight_kg, reps FROM workout_sets WHERE session_id = ? AND user_id = ?",
    [session.id, user.id],
  );

  const substitutions = parseSubstitutions(session.substitutions);
  const activeIds = new Set(
    day.exercises.map(
      (planned) => substitutions[planned.exerciseId] ?? planned.exerciseId,
    ),
  );

  const exercises: TrackerExercise[] = day.exercises.map((planned) => {
    const base = getExercise(planned.exerciseId);
    const substitute = getExercise(substitutions[planned.exerciseId] ?? "");
    const activeId = substitute?.id ?? planned.exerciseId;
    const history = exerciseHistory(user.id, activeId);
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
      activeExerciseId: activeId,
      activeName: substitute?.name ?? planned.name,
      sets: planned.sets,
      reps: planned.reps,
      restSeconds: planned.restSeconds,
      notes: planned.notes,
      suggestion: progression.message,
      suggestedWeight:
        progression.suggestedWeightKg == null
          ? undefined
          : toDisplay(progression.suggestedWeightKg),
      loggedSets: loggedSets
        .filter((set) => set.exercise_id === activeId)
        .map((set) => ({
          setNumber: set.set_number,
          weight: toDisplay(set.weight_kg),
          reps: set.reps,
        })),
      alternatives: EXERCISES.filter(
        (candidate) =>
          candidate.id !== planned.exerciseId &&
          !activeIds.has(candidate.id) &&
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

      {completed ? (
        <Card>
          <p className="text-sm">
            This session is finished. Sets are saved and will feed your progression
            suggestions.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {exercises.map((exercise) => (
              <li key={exercise.exerciseId}>
                <span className="font-medium">{exercise.activeName}</span>
                <span className="text-muted">
                  {" "}
                  —{" "}
                  {exercise.loggedSets.length
                    ? exercise.loggedSets
                        .sort((a, b) => a.setNumber - b.setNumber)
                        .map((set) => `${set.weight}${weightUnit} × ${set.reps}`)
                        .join(", ")
                    : "no sets logged"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <WorkoutTracker
          sessionId={session.id}
          exercises={exercises}
          weightUnit={weightUnit}
        />
      )}

      <Disclaimer />
    </div>
  );
}
