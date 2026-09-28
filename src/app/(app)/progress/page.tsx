import { redirect } from "next/navigation";
import {
  Button,
  Card,
  Disclaimer,
  EmptyState,
  SectionHeading,
} from "@/components/ui";
import {
  IntakeChart,
  SimpleLineChart,
  WeightChart,
} from "@/components/progress-charts";
import { MeasurementForm } from "@/components/measurement-form";
import { WeightQuickLog } from "@/components/quick-log";
import { applyCalorieSuggestionAction } from "@/app/actions";
import {
  calculateWeightTrend,
  suggestCalorieAdjustment,
} from "@/lib/calc/engine";
import { cmToIn, kgToLb } from "@/lib/calc/units";
import {
  cardioHistory,
  dailyCalories,
  getMeasurements,
  getWeightLogs,
  personalRecords,
  recentSteps,
  strengthVolumeByWeek,
  workoutHistory,
} from "@/lib/logs";
import { computeTargets } from "@/lib/profile";
import { requireOnboardedProfile } from "@/lib/session";

const RANGES: Record<string, number> = {
  "30d": 30,
  "90d": 90,
  "1y": 365,
  all: 3650,
};

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { user, profile } = await requireOnboardedProfile();
  const targets = computeTargets(profile);
  if (!targets) redirect("/onboarding");

  const { range = "90d" } = await searchParams;
  const days = RANGES[range] ?? 90;
  const imperial = profile.units === "imperial";
  const weightUnit = imperial ? "lb" : "kg";
  const lengthUnit = imperial ? "in" : "cm";

  const weightLogs = getWeightLogs(user.id).filter(withinDays(days));
  const trend = calculateWeightTrend(
    weightLogs.map((log) => ({ date: log.date, weightKg: log.weight_kg })),
  );
  const intake = dailyCalories(user.id, Math.min(days, 180));
  const averageIntake = intake.length
    ? intake.reduce((sum, day) => sum + day.calories, 0) / intake.length
    : null;
  const weeksOfData = Math.floor(weightLogs.length / 3);
  const suggestion = suggestCalorieAdjustment({
    goal: profile.goal ?? "maintain",
    currentTarget: targets.effectiveCalories,
    averageIntake,
    trend,
    weeksOfData,
  });

  const measurements = getMeasurements(user.id).filter(withinDays(days));
  const steps = recentSteps(user.id, Math.min(days, 90));
  const workouts = workoutHistory(user.id, 60).filter(withinDays(days));
  const cardio = cardioHistory(user.id, 60).filter(withinDays(days));
  const volume = strengthVolumeByWeek(user.id, 12);
  const records = personalRecords(user.id);

  const convertWeight = (value: number) =>
    Math.round((imperial ? kgToLb(value) : value) * 10) / 10;
  const convertLength = (value: number) =>
    Math.round((imperial ? cmToIn(value) : value) * 10) / 10;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Progress</h1>
          <p className="text-sm text-muted">
            Trends use rolling averages, not single-day readings.
          </p>
        </div>
        <form action="/progress" className="flex gap-1.5">
          {Object.keys(RANGES).map((key) => (
            <Button
              key={key}
              type="submit"
              name="range"
              value={key}
              variant={key === range ? "primary" : "secondary"}
              className="px-2.5 py-1 text-xs"
            >
              {key}
            </Button>
          ))}
        </form>
      </div>

      <Card>
        <SectionHeading
          title="Weight"
          subtitle={
            trend.sevenDayAverageKg != null
              ? `7-day average ${convertWeight(trend.sevenDayAverageKg)} ${weightUnit} · trend ${trend.direction}`
              : "Log a few weights to see a trend."
          }
        />
        {trend.points.length > 1 ? (
          <WeightChart
            unit={weightUnit}
            data={trend.points.map((point) => ({
              date: point.date.slice(5),
              weight: convertWeight(point.weightKg),
              average: convertWeight(point.averageKg),
            }))}
          />
        ) : (
          <EmptyState
            title="Not enough weight data"
            description="Weigh in a few times a week for the trend line to become useful."
          />
        )}
        <div className="mt-3">
          <WeightQuickLog unit={weightUnit} />
        </div>
      </Card>

      <Card>
        <SectionHeading
          title="Calorie review"
          subtitle="Suggestions only — nothing changes unless you apply it."
        />
        <p className="text-sm font-medium">{suggestion.headline}</p>
        <p className="mt-1 text-sm text-muted">{suggestion.detail}</p>
        {suggestion.suggestedCalories != null ? (
          <form action={applyCalorieSuggestionAction} className="mt-3">
            <input
              type="hidden"
              name="calories"
              value={suggestion.suggestedCalories}
            />
            <Button type="submit" variant="secondary">
              Use {suggestion.suggestedCalories} kcal as my target
            </Button>
          </form>
        ) : null}
      </Card>

      <Card>
        <SectionHeading title="Intake" subtitle={`Target ${targets.effectiveCalories} kcal`} />
        {intake.length ? (
          <IntakeChart
            target={targets.effectiveCalories}
            data={intake.map((day) => ({
              date: day.date.slice(5),
              calories: Math.round(day.calories),
              protein: Math.round(day.protein_g),
            }))}
          />
        ) : (
          <EmptyState title="No food logged yet" description="Log meals to see intake trends." />
        )}
      </Card>

      {steps.length ? (
        <Card>
          <SectionHeading title="Steps" />
          <SimpleLineChart
            data={steps.map((day) => ({ label: day.date.slice(5), steps: day.steps }))}
            dataKey="steps"
            label="Steps"
            color="var(--accent)"
          />
        </Card>
      ) : null}

      {volume.length ? (
        <Card>
          <SectionHeading title="Strength volume" subtitle="Weekly total load (kg × reps)" />
          <SimpleLineChart
            data={volume.map((week) => ({
              label: week.week,
              volume: Math.round(week.volume),
            }))}
            dataKey="volume"
            label="Volume"
          />
        </Card>
      ) : null}

      {measurements.length ? (
        <Card>
          <SectionHeading title={`Waist (${lengthUnit})`} />
          <SimpleLineChart
            data={measurements
              .filter((row) => row.waist_cm != null)
              .map((row) => ({
                label: row.date.slice(5),
                waist: convertLength(row.waist_cm as number),
              }))}
            dataKey="waist"
            label={`Waist (${lengthUnit})`}
            color="var(--protein)"
          />
        </Card>
      ) : null}

      <Card>
        <SectionHeading title="Measurements" subtitle={`Recorded in ${lengthUnit}`} />
        <MeasurementForm unit={lengthUnit} />
      </Card>

      <Card>
        <SectionHeading title="This period" />
        <ul className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Workouts" value={workouts.length} />
          <Stat label="Cardio sessions" value={cardio.length} />
          <Stat
            label="Avg calories"
            value={averageIntake ? Math.round(averageIntake) : "—"}
          />
          <Stat
            label="Weekly change"
            value={
              trend.weeklyChangeKg != null
                ? `${convertWeight(trend.weeklyChangeKg)} ${weightUnit}`
                : "—"
            }
          />
        </ul>
        <p className="mt-3 text-sm text-muted">
          Progress is rarely linear. Week-to-week noise is normal; the rolling
          average is the signal worth watching.
        </p>
      </Card>

      {records.length ? (
        <Card>
          <SectionHeading title="Personal bests" />
          <ul className="divide-y divide-border text-sm">
            {records.map((record) => (
              <li key={record.exercise_name} className="flex justify-between py-2">
                <span>{record.exercise_name}</span>
                <span className="text-muted">
                  {convertWeight(record.weight_kg)} {weightUnit} × {record.reps}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Disclaimer />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <li className="rounded-xl bg-surface-muted p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </li>
  );
}

function withinDays(days: number) {
  const cutoff = new Date(Date.now() - days * 86400000)
    .toISOString()
    .slice(0, 10);
  return (row: { date: string }) => row.date >= cutoff;
}
