import { notFound } from "next/navigation";
import { Card, SectionHeading } from "@/components/ui";
import { all } from "@/lib/db";
import { CARDIO_ACTIVITIES } from "@/lib/content/cardio";
import { EXERCISES } from "@/lib/content/exercises";
import { FOODS, SUPPLEMENTS } from "@/lib/content/foods";
import { RECIPES } from "@/lib/content/recipes";
import { requireSession } from "@/lib/session";

export default async function AdminPage() {
  const user = await requireSession();
  if (user.role !== "admin") notFound();

  const [users] = all<{ count: number }>("SELECT COUNT(*) AS count FROM users");
  const [logs] = all<{ count: number }>(
    "SELECT COUNT(*) AS count FROM nutrition_logs",
  );
  const [sessions] = all<{ count: number }>(
    "SELECT COUNT(*) AS count FROM workout_sessions",
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="text-sm text-muted">
          Content is stored in typed modules under <code>src/lib/content</code>;
          editing those files updates the catalogue for every user.
        </p>
      </div>

      <Card>
        <SectionHeading title="Content catalogue" />
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Recipes" value={RECIPES.length} />
          <Stat label="Exercises" value={EXERCISES.length} />
          <Stat label="Cardio activities" value={CARDIO_ACTIVITIES.length} />
          <Stat label="Foods" value={FOODS.length} />
          <Stat label="Supplements" value={SUPPLEMENTS.length} />
        </dl>
      </Card>

      <Card>
        <SectionHeading title="Usage" />
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Stat label="Users" value={users?.count ?? 0} />
          <Stat label="Food logs" value={logs?.count ?? 0} />
          <Stat label="Workout sessions" value={sessions?.count ?? 0} />
        </dl>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-muted p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  );
}
