import { CARDIO_ACTIVITIES } from "../content/cardio";
import { calculateEstimatedCardioCalories } from "../calc/engine";
import type { CardioActivity } from "../content/types";
import type { Experience, Goal } from "../calc/types";

export interface CardioSlot {
  dayIndex: number;
  dayLabel: string;
  activityId: string;
  name: string;
  intensity: CardioActivity["intensity"];
  minutes: number;
  estimatedCalories: number;
  guidance: string;
  warmUp: string;
  coolDown: string;
}

export interface CardioPlan {
  daysPerWeek: number;
  rationale: string;
  weeklyMinutes: number;
  slots: CardioSlot[];
}

const DAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** Spreads sessions across the week so hard days are not stacked back to back. */
const DAY_SPREAD: Record<number, number[]> = {
  1: [2],
  2: [1, 4],
  3: [0, 2, 4],
  4: [0, 2, 4, 6],
  5: [0, 1, 3, 4, 6],
  6: [0, 1, 2, 4, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
};

type Mix = { low: number; moderate: number; high: number };

const GOAL_MIX: Record<Goal, Mix> = {
  lose: { low: 0.4, moderate: 0.45, high: 0.15 },
  maintain: { low: 0.35, moderate: 0.45, high: 0.2 },
  gain: { low: 0.6, moderate: 0.3, high: 0.1 },
  bulk: { low: 0.7, moderate: 0.3, high: 0 },
  recomp: { low: 0.4, moderate: 0.4, high: 0.2 },
};

const GOAL_RATIONALE: Record<Goal, string> = {
  lose: "Mostly easy and moderate work so cardio adds activity without hurting recovery from lifting.",
  maintain: "A balanced mix that supports general fitness and heart health.",
  gain: "Lighter cardio volume so most of your energy goes into strength training.",
  bulk: "Minimal, easy cardio to keep conditioning while prioritising the calorie surplus.",
  recomp: "Moderate cardio alongside lifting, keeping intensity manageable.",
};

const EXPERIENCE_MINUTES: Record<Experience, { low: number; moderate: number; high: number }> = {
  beginner: { low: 25, moderate: 20, high: 12 },
  intermediate: { low: 35, moderate: 30, high: 18 },
  advanced: { low: 45, moderate: 40, high: 24 },
};

export interface CardioPlanOptions {
  goal: Goal;
  experience: Experience;
  daysPerWeek: number;
  weightKg: number;
  preferredActivityIds?: string[];
}

export function generateCardioPlan(options: CardioPlanOptions): CardioPlan {
  const daysPerWeek = Math.min(7, Math.max(0, options.daysPerWeek));
  if (daysPerWeek === 0) {
    return {
      daysPerWeek: 0,
      rationale:
        "No cardio scheduled. Daily steps still count — aim to keep general activity up.",
      weeklyMinutes: 0,
      slots: [],
    };
  }

  const mix = GOAL_MIX[options.goal];
  const order = buildIntensityOrder(daysPerWeek, mix);
  const days = DAY_SPREAD[daysPerWeek] ?? DAY_SPREAD[3];
  const minutesByIntensity = EXPERIENCE_MINUTES[options.experience];
  const preferred = options.preferredActivityIds ?? [];

  const usedActivities: string[] = [];
  const slots: CardioSlot[] = order.map((intensity, index) => {
    const activity = pickActivity(intensity, preferred, usedActivities);
    usedActivities.push(activity.id);
    const minutes = minutesByIntensity[intensity];
    return {
      dayIndex: days[index],
      dayLabel: DAY_LABELS[days[index]],
      activityId: activity.id,
      name: activity.name,
      intensity,
      minutes,
      estimatedCalories: calculateEstimatedCardioCalories({
        met: activity.met,
        minutes,
        weightKg: options.weightKg,
      }),
      guidance: activity[options.experience],
      warmUp: activity.warmUp,
      coolDown: activity.coolDown,
    };
  });

  return {
    daysPerWeek,
    rationale: GOAL_RATIONALE[options.goal],
    weeklyMinutes: slots.reduce((total, slot) => total + slot.minutes, 0),
    slots,
  };
}

function buildIntensityOrder(
  daysPerWeek: number,
  mix: Mix,
): CardioActivity["intensity"][] {
  const counts = {
    high: Math.round(mix.high * daysPerWeek),
    moderate: Math.round(mix.moderate * daysPerWeek),
    low: 0,
  };
  counts.low = Math.max(0, daysPerWeek - counts.high - counts.moderate);
  let total = counts.low + counts.moderate + counts.high;
  while (total > daysPerWeek) {
    if (counts.high > 0) counts.high--;
    else if (counts.moderate > 0) counts.moderate--;
    else counts.low--;
    total--;
  }
  while (total < daysPerWeek) {
    counts.low++;
    total++;
  }

  const order: CardioActivity["intensity"][] = [];
  const pools = { low: counts.low, moderate: counts.moderate, high: counts.high };
  const rotation: CardioActivity["intensity"][] = ["moderate", "low", "high", "low"];
  let i = 0;
  while (order.length < daysPerWeek) {
    const intensity = rotation[i % rotation.length];
    if (pools[intensity] > 0) {
      pools[intensity]--;
      order.push(intensity);
    } else if (pools.low > 0) {
      pools.low--;
      order.push("low");
    } else if (pools.moderate > 0) {
      pools.moderate--;
      order.push("moderate");
    } else if (pools.high > 0) {
      pools.high--;
      order.push("high");
    }
    i++;
  }
  return order;
}

function pickActivity(
  intensity: CardioActivity["intensity"],
  preferred: string[],
  used: string[],
): CardioActivity {
  const pool = CARDIO_ACTIVITIES.filter((a) => a.intensity === intensity);
  const preferredMatch = pool.find(
    (a) => preferred.includes(a.id) && !used.includes(a.id),
  );
  if (preferredMatch) return preferredMatch;
  const unused = pool.find((a) => !used.includes(a.id));
  return unused ?? pool[0];
}
