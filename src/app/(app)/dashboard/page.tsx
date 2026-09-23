import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Badge,
  Card,
  Disclaimer,
  LinkButton,
  ProgressBar,
  Ring,
  SectionHeading,
} from "@/components/ui";
import {
  StepsQuickLog,
  WaterQuickLog,
  WeightQuickLog,
} from "@/components/quick-log";
import { today } from "@/lib/db";
import {
  cardioHistory,
  getNutritionLogs,
  getSteps,
  getWaterMl,
  sumLogs,
  workoutHistory,
} from "@/lib/logs";
import { computeTargets } from "@/lib/profile";
import { requireOnboardedProfile } from "@/lib/session";
import { kgToLb } from "@/lib/calc/units";

const GOAL_LABEL: Record<string, string> = {
  lose: "Losing weight",
  maintain: "Maintaining",
  gain: "Gaining weight",
  bulk: "Building muscle",
  recomp: "Recomposition",
};

export default async function DashboardPage() {
  const { user, profile } = await requireOnboardedProfile();
  const targets = computeTargets(profile);
  if (!targets) redirect("/onboarding");

  const date = today();
  const logs = getNutritionLogs(user.id, date);
  const totals = sumLogs(logs);
  const water = getWaterMl(user.id, date);
  const steps = getSteps(user.id, date);
  const workouts = workoutHistory(user.id, 5);
  const todayWorkout = workouts.find((session) => session.date === date);
  const cardio = cardioHistory(user.id, 5).filter((s) => s.date === date);

  const remaining = Math.max(0, targets.effectiveCalories - totals.calories);
  const weeklyChange = targets.calories.weeklyChangeKg;
  const changeLabel =
    profile.units === "imperial"
      ? `${(kgToLb(Math.abs(weeklyChange))).toFixed(1)} lb/week`
      : `${Math.abs(weeklyChange).toFixed(2)} kg/week`;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {greeting()}
            {profile.first_name ? `, ${profile.first_name}` : ""}
          </h1>
          <p className="text-sm text-muted">
            {GOAL_LABEL[profile.goal ?? "maintain"]} ·{" "}
            {weeklyChange === 0
              ? "holding steady"
              : `${weeklyChange < 0 ? "about -" : "about +"}${changeLabel}`}
          </p>
        </div>
        <Badge tone="brand">{targets.effectiveCalories} kcal/day</Badge>
      </div>

      <Card>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Ring
            value={totals.calories}
            max={targets.effectiveCalories}
            caption="Calories"
            sub={`${remaining} left`}
          />
          <div className="w-full flex-1 space-y-3">
            <ProgressBar
              value={totals.proteinG}
              max={targets.macros.proteinG}
              label="Protein (g)"
              color="var(--protein)"
            />
            <ProgressBar
              value={totals.carbsG}
              max={targets.macros.carbsG}
              label="Carbs (g)"
              color="var(--carbs)"
            />
            <ProgressBar
              value={totals.fatG}
              max={targets.macros.fatG}
              label="Fat (g)"
              color="var(--fat)"
            />
            <p className="text-xs text-muted">
              Maintenance is about {targets.calories.maintenanceCalories} kcal.
              {targets.manualOverride ? " Using your manual calorie target." : ""}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <SectionHeading title="Water" />
          <WaterQuickLog
            consumedMl={water}
            goalMl={profile.water_goal_ml}
            units={profile.units}
          />
        </Card>
        <Card>
          <SectionHeading title="Steps" />
          <StepsQuickLog steps={steps} goal={profile.step_goal} />
        </Card>
      </div>

      <Card>
        <SectionHeading
          title="Today's training"
          action={
            <LinkButton href="/train" variant="secondary" className="px-3 py-1.5 text-xs">
              Open plan
            </LinkButton>
          }
        />
        {todayWorkout ? (
          <p className="text-sm">
            {todayWorkout.name} —{" "}
            {todayWorkout.status === "complete" ? "completed" : "in progress"}
            {todayWorkout.status !== "complete" ? (
              <>
                {" · "}
                <Link
                  href={`/train/session/${todayWorkout.id}`}
                  className="text-brand underline"
                >
                  continue
                </Link>
              </>
            ) : null}
          </p>
        ) : (
          <p className="text-sm text-muted">
            Nothing logged yet today. Your programme is on the Train tab.
          </p>
        )}
        {cardio.length ? (
          <p className="mt-2 text-sm text-muted">
            Cardio: {cardio.map((c) => `${c.activity_name} ${c.minutes}m`).join(", ")}
          </p>
        ) : null}
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <SectionHeading title="Quick add" />
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/food" variant="secondary" className="px-3 py-1.5 text-xs">
              Log food
            </LinkButton>
            <LinkButton href="/meal-plan" variant="secondary" className="px-3 py-1.5 text-xs">
              Meal plan
            </LinkButton>
            <LinkButton href="/train" variant="secondary" className="px-3 py-1.5 text-xs">
              Start workout
            </LinkButton>
            <LinkButton href="/cardio" variant="secondary" className="px-3 py-1.5 text-xs">
              Log cardio
            </LinkButton>
          </div>
        </Card>
        <Card>
          <SectionHeading title="Weigh in" />
          <WeightQuickLog unit={profile.units === "imperial" ? "lb" : "kg"} />
        </Card>
      </div>

      {logs.length ? (
        <Card>
          <SectionHeading title="Logged today" subtitle={`${logs.length} entries`} />
          <ul className="divide-y divide-border text-sm">
            {logs.slice(0, 6).map((log) => (
              <li key={log.id} className="flex justify-between py-2">
                <span className="truncate">{log.name}</span>
                <span className="text-muted">{Math.round(log.calories)} kcal</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Disclaimer />
    </div>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
