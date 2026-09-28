import { EXERCISES } from "../content/exercises";
import type {
  EquipmentTag,
  Exercise,
  MuscleGroup,
} from "../content/types";
import type { Equipment, Experience, Goal } from "../calc/types";

export interface WorkoutExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  tempo?: string;
  difficulty: Exercise["difficulty"];
  notes: string;
}

export interface WorkoutDay {
  key: string;
  name: string;
  focus: string;
  estimatedMinutes: number;
  exercises: WorkoutExercise[];
}

export interface WorkoutProgram {
  name: string;
  split: string;
  daysPerWeek: number;
  rationale: string;
  days: WorkoutDay[];
}

const EQUIPMENT_MAP: Record<Equipment, EquipmentTag[]> = {
  full_gym: ["barbell", "dumbbell", "machine", "cable", "bodyweight", "band"],
  home_gym: ["dumbbell", "barbell", "bodyweight", "band"],
  dumbbells: ["dumbbell", "bodyweight"],
  barbells: ["barbell", "bodyweight"],
  machines: ["machine", "cable", "bodyweight"],
  bands: ["band", "bodyweight"],
  bodyweight: ["bodyweight"],
};

export function availableEquipmentTags(equipment: Equipment[]): EquipmentTag[] {
  if (!equipment.length) return EQUIPMENT_MAP.bodyweight;
  const tags = new Set<EquipmentTag>();
  for (const item of equipment) {
    for (const tag of EQUIPMENT_MAP[item] ?? []) tags.add(tag);
  }
  return [...tags];
}

const GOAL_SCHEME: Record<
  Goal,
  { compound: { sets: number; reps: string }; isolation: { sets: number; reps: string } }
> = {
  lose: {
    compound: { sets: 3, reps: "8-12" },
    isolation: { sets: 3, reps: "12-15" },
  },
  maintain: {
    compound: { sets: 3, reps: "8-10" },
    isolation: { sets: 3, reps: "10-15" },
  },
  gain: {
    compound: { sets: 4, reps: "6-10" },
    isolation: { sets: 3, reps: "10-12" },
  },
  bulk: {
    compound: { sets: 4, reps: "6-10" },
    isolation: { sets: 3, reps: "10-12" },
  },
  recomp: {
    compound: { sets: 4, reps: "8-10" },
    isolation: { sets: 3, reps: "12-15" },
  },
};

const EXPERIENCE_ALLOWED: Record<Experience, Exercise["difficulty"][]> = {
  beginner: ["beginner"],
  intermediate: ["beginner", "intermediate"],
  advanced: ["beginner", "intermediate", "advanced"],
};

interface SplitDay {
  key: string;
  name: string;
  focus: string;
  groups: { group: MuscleGroup; slots: number }[];
}

const SPLITS: Record<number, { split: string; rationale: string; days: SplitDay[] }> = {
  2: {
    split: "Full body",
    rationale:
      "Two sessions per week works best as full-body training so every muscle is trained twice.",
    days: [
      {
        key: "fb-a",
        name: "Full Body A",
        focus: "Squat and push emphasis",
        groups: [
          { group: "legs", slots: 2 },
          { group: "chest", slots: 1 },
          { group: "back", slots: 1 },
          { group: "shoulders", slots: 1 },
          { group: "core", slots: 1 },
        ],
      },
      {
        key: "fb-b",
        name: "Full Body B",
        focus: "Hinge and pull emphasis",
        groups: [
          { group: "legs", slots: 2 },
          { group: "back", slots: 2 },
          { group: "chest", slots: 1 },
          { group: "biceps", slots: 1 },
          { group: "core", slots: 1 },
        ],
      },
    ],
  },
  3: {
    split: "Full body",
    rationale:
      "Three full-body sessions give frequent practice on the main movement patterns.",
    days: [
      {
        key: "fb-a",
        name: "Full Body A",
        focus: "Squat and push",
        groups: [
          { group: "legs", slots: 2 },
          { group: "chest", slots: 2 },
          { group: "back", slots: 1 },
          { group: "core", slots: 1 },
        ],
      },
      {
        key: "fb-b",
        name: "Full Body B",
        focus: "Hinge and pull",
        groups: [
          { group: "legs", slots: 2 },
          { group: "back", slots: 2 },
          { group: "shoulders", slots: 1 },
          { group: "biceps", slots: 1 },
        ],
      },
      {
        key: "fb-c",
        name: "Full Body C",
        focus: "Balanced",
        groups: [
          { group: "legs", slots: 2 },
          { group: "chest", slots: 1 },
          { group: "back", slots: 1 },
          { group: "shoulders", slots: 1 },
          { group: "triceps", slots: 1 },
          { group: "core", slots: 1 },
        ],
      },
    ],
  },
  4: {
    split: "Upper / Lower",
    rationale:
      "Four days fits an upper/lower split, training each half of the body twice a week.",
    days: [
      {
        key: "upper-a",
        name: "Upper A",
        focus: "Horizontal push and pull",
        groups: [
          { group: "chest", slots: 2 },
          { group: "back", slots: 2 },
          { group: "shoulders", slots: 1 },
          { group: "triceps", slots: 1 },
        ],
      },
      {
        key: "lower-a",
        name: "Lower A",
        focus: "Squat emphasis",
        groups: [
          { group: "legs", slots: 4 },
          { group: "core", slots: 2 },
        ],
      },
      {
        key: "upper-b",
        name: "Upper B",
        focus: "Vertical push and pull",
        groups: [
          { group: "back", slots: 2 },
          { group: "shoulders", slots: 2 },
          { group: "chest", slots: 1 },
          { group: "biceps", slots: 1 },
        ],
      },
      {
        key: "lower-b",
        name: "Lower B",
        focus: "Hinge emphasis",
        groups: [
          { group: "legs", slots: 4 },
          { group: "core", slots: 2 },
        ],
      },
    ],
  },
  5: {
    split: "Upper / Lower / Push / Pull / Legs",
    rationale:
      "Five days allows more volume per muscle while keeping at least two rest days.",
    days: [
      {
        key: "upper",
        name: "Upper Body",
        focus: "Balanced upper body",
        groups: [
          { group: "chest", slots: 2 },
          { group: "back", slots: 2 },
          { group: "shoulders", slots: 1 },
          { group: "biceps", slots: 1 },
        ],
      },
      {
        key: "lower",
        name: "Lower Body",
        focus: "Legs and core",
        groups: [
          { group: "legs", slots: 4 },
          { group: "core", slots: 2 },
        ],
      },
      {
        key: "push",
        name: "Push",
        focus: "Chest, shoulders, triceps",
        groups: [
          { group: "chest", slots: 2 },
          { group: "shoulders", slots: 2 },
          { group: "triceps", slots: 2 },
        ],
      },
      {
        key: "pull",
        name: "Pull",
        focus: "Back and biceps",
        groups: [
          { group: "back", slots: 3 },
          { group: "biceps", slots: 2 },
          { group: "core", slots: 1 },
        ],
      },
      {
        key: "legs",
        name: "Legs",
        focus: "Lower body",
        groups: [
          { group: "legs", slots: 4 },
          { group: "core", slots: 1 },
        ],
      },
    ],
  },
  6: {
    split: "Push / Pull / Legs ×2",
    rationale:
      "Six days suits push/pull/legs run twice, which spreads volume across the week.",
    days: [
      {
        key: "push-a",
        name: "Push A",
        focus: "Chest focus",
        groups: [
          { group: "chest", slots: 3 },
          { group: "shoulders", slots: 1 },
          { group: "triceps", slots: 2 },
        ],
      },
      {
        key: "pull-a",
        name: "Pull A",
        focus: "Back width",
        groups: [
          { group: "back", slots: 3 },
          { group: "biceps", slots: 2 },
          { group: "core", slots: 1 },
        ],
      },
      {
        key: "legs-a",
        name: "Legs A",
        focus: "Squat emphasis",
        groups: [
          { group: "legs", slots: 4 },
          { group: "core", slots: 1 },
        ],
      },
      {
        key: "push-b",
        name: "Push B",
        focus: "Shoulder focus",
        groups: [
          { group: "shoulders", slots: 3 },
          { group: "chest", slots: 2 },
          { group: "triceps", slots: 1 },
        ],
      },
      {
        key: "pull-b",
        name: "Pull B",
        focus: "Back thickness",
        groups: [
          { group: "back", slots: 3 },
          { group: "biceps", slots: 1 },
          { group: "core", slots: 2 },
        ],
      },
      {
        key: "legs-b",
        name: "Legs B",
        focus: "Hinge emphasis",
        groups: [
          { group: "legs", slots: 4 },
          { group: "core", slots: 1 },
        ],
      },
    ],
  },
};

export interface ProgramOptions {
  goal: Goal;
  experience: Experience;
  daysPerWeek: number;
  sessionMinutes: number;
  equipment: Equipment[];
  emphasis?: MuscleGroup[];
}

export function generateWorkoutProgram(options: ProgramOptions): WorkoutProgram {
  const daysPerWeek = Math.min(6, Math.max(2, options.daysPerWeek || 3));
  const template = SPLITS[daysPerWeek];
  const tags = availableEquipmentTags(options.equipment);
  const allowedDifficulty = EXPERIENCE_ALLOWED[options.experience];
  const scheme = GOAL_SCHEME[options.goal];
  const perExerciseMinutes = 8;
  const maxExercises = Math.max(
    3,
    Math.min(8, Math.floor(options.sessionMinutes / perExerciseMinutes)),
  );

  const days = template.days.map((day) => {
    const chosen: WorkoutExercise[] = [];
    const used = new Set<string>();
    const slots = expandSlots(day, options.emphasis ?? []);

    for (const group of slots) {
      if (chosen.length >= maxExercises) break;
      const exercise = pickExercise(group, tags, allowedDifficulty, used);
      if (!exercise) continue;
      used.add(exercise.id);
      const config = exercise.compound ? scheme.compound : scheme.isolation;
      chosen.push({
        exerciseId: exercise.id,
        name: exercise.name,
        sets: config.sets,
        reps: exercise.defaultReps.includes("second")
          ? exercise.defaultReps
          : config.reps,
        restSeconds: exercise.restSeconds,
        tempo: exercise.tempo,
        difficulty: exercise.difficulty,
        notes: exercise.compound
          ? "Leave one to two reps in reserve on your early sets."
          : "Focus on controlled reps rather than maximum load.",
      });
    }

    return {
      key: day.key,
      name: day.name,
      focus: day.focus,
      estimatedMinutes: Math.min(
        options.sessionMinutes,
        chosen.length * perExerciseMinutes,
      ),
      exercises: chosen,
    };
  });

  return {
    name: `${template.split} — ${daysPerWeek} days`,
    split: template.split,
    daysPerWeek,
    rationale: template.rationale,
    days,
  };
}

function expandSlots(day: SplitDay, emphasis: MuscleGroup[]): MuscleGroup[] {
  const ordered = [...day.groups].sort((a, b) => {
    const aBoost = emphasis.includes(a.group) ? 1 : 0;
    const bBoost = emphasis.includes(b.group) ? 1 : 0;
    return bBoost - aBoost;
  });
  const slots: MuscleGroup[] = [];
  const maxSlots = Math.max(...ordered.map((g) => g.slots));
  for (let round = 0; round < maxSlots; round++) {
    for (const group of ordered) {
      if (group.slots > round) slots.push(group.group);
    }
  }
  return slots;
}

function pickExercise(
  group: MuscleGroup,
  tags: EquipmentTag[],
  allowedDifficulty: Exercise["difficulty"][],
  used: Set<string>,
): Exercise | null {
  const candidates = EXERCISES.filter(
    (exercise) =>
      exercise.group === group &&
      !used.has(exercise.id) &&
      exercise.equipment.some((tag) => tags.includes(tag)) &&
      allowedDifficulty.includes(exercise.difficulty),
  );
  const pool = candidates.length
    ? candidates
    : EXERCISES.filter(
        (exercise) =>
          exercise.group === group &&
          !used.has(exercise.id) &&
          exercise.equipment.includes("bodyweight"),
      );
  if (!pool.length) return null;
  return [...pool].sort((a, b) => Number(b.compound) - Number(a.compound))[0];
}

export interface SetRecord {
  weightKg: number;
  reps: number;
  date: string;
}

export interface ProgressionSuggestion {
  message: string;
  action: "increase_load" | "increase_reps" | "hold" | "collect_data";
  suggestedWeightKg?: number;
  suggestedReps?: number;
}

/**
 * Suggests the next step only when the top of the prescribed rep range was hit
 * on every set of the most recent session.
 */
export function suggestProgression(input: {
  history: SetRecord[];
  repRange: string;
  reportedPainOrFormIssue?: boolean;
}): ProgressionSuggestion {
  const { history, repRange, reportedPainOrFormIssue } = input;
  if (reportedPainOrFormIssue) {
    return {
      message:
        "You flagged pain or a form issue. Keep the load the same — or reduce it — and prioritise technique before adding weight.",
      action: "hold",
    };
  }
  if (history.length < 2) {
    return {
      message: "Log a couple more sessions so progression can be tracked.",
      action: "collect_data",
    };
  }

  const [minReps, maxReps] = parseRepRange(repRange);
  const latestDate = history[history.length - 1].date;
  const latestSets = history.filter((set) => set.date === latestDate);
  const hitTop = latestSets.every((set) => set.reps >= maxReps);
  const heaviest = Math.max(...latestSets.map((set) => set.weightKg));

  if (hitTop) {
    const increment = heaviest >= 60 ? 2.5 : heaviest >= 20 ? 2 : 1;
    return {
      message: `You completed ${maxReps} reps on every set. Try ${round1(heaviest + increment)} kg next session and work back up the rep range.`,
      action: "increase_load",
      suggestedWeightKg: round1(heaviest + increment),
      suggestedReps: minReps,
    };
  }

  const bestReps = Math.max(...latestSets.map((set) => set.reps));
  return {
    message: `Stay at ${round1(heaviest)} kg and aim for ${Math.min(maxReps, bestReps + 1)} reps on your first set.`,
    action: "increase_reps",
    suggestedWeightKg: round1(heaviest),
    suggestedReps: Math.min(maxReps, bestReps + 1),
  };
}

function parseRepRange(range: string): [number, number] {
  const match = range.match(/(\d+)\s*-\s*(\d+)/);
  if (!match) {
    const single = Number(range.replace(/\D/g, "")) || 10;
    return [single, single];
  }
  return [Number(match[1]), Number(match[2])];
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function sessionVolume(sets: { weightKg: number; reps: number }[]): number {
  return Math.round(sets.reduce((total, set) => total + set.weightKg * set.reps, 0));
}

export function estimatedOneRepMax(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  // Epley formula.
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}
