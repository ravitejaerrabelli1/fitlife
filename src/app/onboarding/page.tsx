import { OnboardingWizard } from "@/components/onboarding-wizard";
import { getProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";

export default async function OnboardingPage() {
  const user = await requireSession();
  const profile = getProfile(user.id);

  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Let&apos;s set up your plan</h1>
      <p className="mt-1 text-sm text-muted">
        Five short steps. You can change any of it later.
      </p>
      <div className="mt-6">
        <OnboardingWizard firstName={profile?.first_name ?? ""} />
      </div>
    </main>
  );
}
