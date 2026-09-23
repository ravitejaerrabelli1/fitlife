import { redirect } from "next/navigation";
import { Button, Card, Disclaimer, SectionHeading } from "@/components/ui";
import { ProfileSettings } from "@/components/profile-settings";
import { deleteAccountAction, signOutAction } from "@/app/actions";
import { computeTargets } from "@/lib/profile";
import { requireOnboardedProfile } from "@/lib/session";

export default async function ProfilePage() {
  const { user, profile } = await requireOnboardedProfile();
  const targets = computeTargets(profile);
  if (!targets) redirect("/onboarding");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="text-sm text-muted">{user.email}</p>
      </div>

      <Card>
        <SectionHeading title="Your current estimates" />
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="BMR" value={`${targets.calories.bmr} kcal`} />
          <Stat label="TDEE" value={`${targets.calories.tdee} kcal`} />
          <Stat label="Target" value={`${targets.effectiveCalories} kcal`} />
          <Stat
            label="Protein"
            value={`${targets.macros.proteinG} g`}
          />
          <Stat label="Carbs" value={`${targets.macros.carbsG} g`} />
          <Stat label="Fat" value={`${targets.macros.fatG} g`} />
          <Stat label="BMI" value={targets.bmi ? targets.bmi.toFixed(1) : "—"} />
          <Stat
            label="Body fat"
            value={
              targets.estimatedBodyFat != null
                ? `${targets.estimatedBodyFat.toFixed(1)}%`
                : "—"
            }
          />
        </dl>
        <p className="mt-3 text-xs text-muted">{targets.calories.note}</p>
      </Card>

      <ProfileSettings profile={profile} />

      <Card>
        <SectionHeading
          title="Your data"
          subtitle="Download everything stored against your account."
        />
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/export"
            download="fitlife-export.json"
            className="inline-flex items-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium hover:bg-surface-muted"
          >
            Export my data
          </a>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary">
              Sign out
            </Button>
          </form>
        </div>
        <p className="mt-3 text-xs text-muted">
          We don&apos;t sell your fitness or health data.
        </p>
      </Card>

      <Card>
        <SectionHeading
          title="Delete account"
          subtitle="This removes your profile, logs and plans permanently."
        />
        <form action={deleteAccountAction}>
          <Button type="submit" variant="danger">
            Delete my account
          </Button>
        </form>
      </Card>

      <Disclaimer />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-muted p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-base font-semibold">{value}</dd>
    </div>
  );
}
