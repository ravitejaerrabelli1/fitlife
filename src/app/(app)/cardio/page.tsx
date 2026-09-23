import { Badge, Card, Disclaimer, EmptyState, SectionHeading } from "@/components/ui";
import { CardioLogForm } from "@/components/cardio-form";
import { CARDIO_ACTIVITIES } from "@/lib/content/cardio";
import { generateCardioPlan } from "@/lib/planner/cardio";
import { cardioHistory } from "@/lib/logs";
import { requireOnboardedProfile } from "@/lib/session";
import type { Experience, Goal } from "@/lib/calc/types";

export default async function CardioPage() {
  const { user, profile } = await requireOnboardedProfile();
  const experience = (profile.experience ?? "beginner") as Experience;
  const plan = generateCardioPlan({
    goal: (profile.goal ?? "maintain") as Goal,
    experience,
    daysPerWeek: profile.cardio_days ?? 3,
    weightKg: profile.weight_kg ?? 70,
  });
  const history = cardioHistory(user.id, 10);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Cardio</h1>
        <p className="text-sm text-muted">
          {plan.daysPerWeek} sessions a week · about {plan.weeklyMinutes} minutes
        </p>
      </div>

      <Card>
        <p className="text-sm text-muted">{plan.rationale}</p>
      </Card>

      {plan.slots.length ? (
        plan.slots.map((slot) => (
          <Card key={`${slot.dayIndex}-${slot.activityId}`}>
            <SectionHeading
              title={`${slot.dayLabel} — ${slot.name}`}
              subtitle={`${slot.minutes} min · ~${slot.estimatedCalories} kcal`}
              action={<Badge tone="brand">{slot.intensity}</Badge>}
            />
            <p className="text-sm">{slot.guidance}</p>
            <p className="mt-2 text-xs text-muted">Warm-up: {slot.warmUp}</p>
            <p className="text-xs text-muted">Cool-down: {slot.coolDown}</p>
          </Card>
        ))
      ) : (
        <EmptyState
          title="No cardio scheduled"
          description="Set cardio days in your profile to get a weekly schedule."
        />
      )}

      <Card>
        <SectionHeading title="Log a session" />
        <CardioLogForm activities={CARDIO_ACTIVITIES} />
      </Card>

      <Card>
        <SectionHeading title="Activity guide" />
        <ul className="divide-y divide-border text-sm">
          {CARDIO_ACTIVITIES.map((activity) => (
            <li key={activity.id} className="py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{activity.name}</span>
                <Badge>{activity.intensity}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">
                {experience === "advanced"
                  ? activity.advanced
                  : experience === "intermediate"
                    ? activity.intermediate
                    : activity.beginner}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      {history.length ? (
        <Card>
          <SectionHeading title="Recent cardio" />
          <ul className="divide-y divide-border text-sm">
            {history.map((session) => (
              <li key={session.id} className="flex justify-between py-2">
                <span>
                  {session.activity_name} · {session.minutes} min
                </span>
                <span className="text-muted">
                  {session.date} · ~{session.calories} kcal
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
