"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  finishWorkoutAction,
  logSetAction,
  substituteExerciseAction,
} from "@/app/actions";
import { Badge, Button, Card, Input, SectionHeading, Select } from "./ui";

export interface TrackerExercise {
  exerciseId: string;
  name: string;
  activeExerciseId: string;
  activeName: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes: string;
  suggestion: string;
  /** Already converted to the profile's display unit. */
  suggestedWeight?: number;
  loggedSets: { setNumber: number; weight: number; reps: number }[];
  alternatives: { id: string; name: string }[];
  plannedTakenElsewhere: boolean;
}

export function WorkoutTracker({
  sessionId,
  exercises,
  weightUnit,
}: {
  sessionId: string;
  exercises: TrackerExercise[];
  weightUnit: string;
}) {
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});
  const [rest, setRest] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const resting = rest !== null;

  useEffect(() => {
    if (!resting) return;
    timer.current = setInterval(() => {
      setRest((current) => {
        if (current === null) return null;
        if (current <= 1) return null;
        return current - 1;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [resting]);

  return (
    <div className="space-y-4">
      {rest !== null ? (
        <div
          className="sticky top-16 z-10 flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-2 shadow-sm"
          role="status"
          aria-live="polite"
        >
          <span className="text-sm font-medium">
            Rest: {Math.floor(rest / 60)}:{String(rest % 60).padStart(2, "0")}
          </span>
          <Button
            variant="ghost"
            className="px-3 py-1 text-xs"
            onClick={() => setRest(null)}
          >
            Skip rest
          </Button>
        </div>
      ) : null}

      {exercises.map((exercise) => {
        const activeId = exercise.activeExerciseId;
        const activeName = exercise.activeName;
        const replacedWith = activeId === exercise.exerciseId ? "" : activeId;
        const isSkipped = skipped[exercise.exerciseId];

        return (
          <Card key={exercise.exerciseId} className={isSkipped ? "opacity-60" : ""}>
            <SectionHeading
              title={activeName}
              subtitle={`${exercise.sets} × ${exercise.reps} · ${exercise.restSeconds}s rest`}
              action={
                <Button
                  variant="ghost"
                  className="px-3 py-1 text-xs"
                  onClick={() =>
                    setSkipped((current) => ({
                      ...current,
                      [exercise.exerciseId]: !current[exercise.exerciseId],
                    }))
                  }
                >
                  {isSkipped ? "Unskip" : "Skip"}
                </Button>
              }
            />
            {!isSkipped ? (
              <>
                <p className="text-xs text-muted">{exercise.suggestion}</p>
                {exercise.alternatives.length ? (
                  <form action={substituteExerciseAction} className="mt-2">
                    <input type="hidden" name="sessionId" value={sessionId} />
                    <input
                      type="hidden"
                      name="plannedExerciseId"
                      value={exercise.exerciseId}
                    />
                    <label className="block text-xs text-muted">
                      Swap for
                      <Select
                        key={activeId}
                        className="mt-1"
                        name="substituteId"
                        defaultValue={replacedWith}
                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                      >
                        <option value="" disabled={exercise.plannedTakenElsewhere}>
                          {exercise.name} (as planned)
                          {exercise.plannedTakenElsewhere ? " — in use" : ""}
                        </option>
                        {exercise.alternatives.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </Select>
                    </label>
                  </form>
                ) : null}

                <ul className="mt-3 space-y-2">
                  {Array.from({ length: exercise.sets }, (_, index) => {
                    const setNumber = index + 1;
                    const logged = exercise.loggedSets.find(
                      (set) => set.setNumber === setNumber,
                    );
                    return (
                      <li key={setNumber}>
                        <form
                          action={logSetAction}
                          onSubmit={() => setRest(exercise.restSeconds)}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <span className="w-12 text-xs text-muted">
                            Set {setNumber}
                          </span>
                          <input type="hidden" name="sessionId" value={sessionId} />
                          <input type="hidden" name="exerciseId" value={activeId} />
                          <input type="hidden" name="exerciseName" value={activeName} />
                          <input type="hidden" name="setNumber" value={setNumber} />
                          <Input
                            name="weight"
                            type="number"
                            step="any"
                            min="0"
                            defaultValue={
                              logged?.weight ?? exercise.suggestedWeight ?? ""
                            }
                            aria-label={`Weight for set ${setNumber} (${weightUnit})`}
                            className="w-24"
                          />
                          <Input
                            name="reps"
                            type="number"
                            min="0"
                            defaultValue={logged?.reps ?? ""}
                            aria-label={`Reps for set ${setNumber}`}
                            className="w-20"
                          />
                          <Input
                            name="rpe"
                            type="number"
                            min="1"
                            max="10"
                            placeholder="RPE"
                            aria-label={`RPE for set ${setNumber}`}
                            className="w-20"
                          />
                          <Button
                            type="submit"
                            variant={logged ? "secondary" : "primary"}
                            className="px-3 py-1.5 text-xs"
                          >
                            {logged ? "Update" : "Done"}
                          </Button>
                          {logged ? <Badge tone="brand">logged</Badge> : null}
                        </form>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  href={`/train/exercises/${activeId}`}
                  className="mt-2 inline-block text-xs text-brand underline"
                >
                  How to do this exercise
                </Link>
              </>
            ) : null}
          </Card>
        );
      })}

      <Card>
        <SectionHeading title="Finish" />
        <form action={finishWorkoutAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="sessionId" value={sessionId} />
          <label className="text-sm">
            <span className="mb-1.5 block font-medium">Duration (min)</span>
            <Input name="duration" type="number" min="1" className="w-28" />
          </label>
          <label className="flex-1 text-sm">
            <span className="mb-1.5 block font-medium">Notes</span>
            <Input name="notes" placeholder="How did it feel?" />
          </label>
          <Button type="submit">Finish workout</Button>
        </form>
      </Card>
    </div>
  );
}
