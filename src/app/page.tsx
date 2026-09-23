import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { Card, Disclaimer, LinkButton } from "@/components/ui";

const FEATURES = [
  {
    title: "Calories and macros",
    body: "Mifflin-St Jeor or Katch-McArdle estimates, with conservative goal adjustments and floors that keep intake sensible.",
  },
  {
    title: "Meal plans and recipes",
    body: "1, 3, 7 or 14 day plans across six cuisines, with swaps, scaling and a consolidated grocery list.",
  },
  {
    title: "Training that fits your week",
    body: "Full body, upper/lower or push-pull-legs programmes built from your equipment, experience and session length.",
  },
  {
    title: "Cardio and steps",
    body: "Low, moderate and high intensity sessions scheduled around lifting, with MET-based calorie estimates.",
  },
  {
    title: "Progress you can read",
    body: "Rolling weight averages, calorie and protein adherence, strength volume and waist trends.",
  },
  {
    title: "Your data stays yours",
    body: "Email and password accounts, one-click export, and account deletion that removes everything.",
  },
];

export default async function Home() {
  const user = await getSessionUser();
  if (user) {
    const profile = getProfile(user.id);
    redirect(profile?.onboarded ? "/dashboard" : "/onboarding");
  }

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-5 py-12">
      <p className="text-sm font-semibold tracking-wide text-brand uppercase">
        FitLife
      </p>
      <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
        Nutrition and training, built around the person actually doing it.
      </h1>
      <p className="mt-3 text-muted">
        Answer a few questions and get calorie and macro estimates, a meal plan
        with a grocery list, a training programme for your equipment, and
        tracking that reacts to trends rather than single days.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <LinkButton href="/signup">Create an account</LinkButton>
        <LinkButton href="/signin" variant="secondary">
          Sign in
        </LinkButton>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <Card key={feature.title} as="article">
            <h2 className="font-semibold">{feature.title}</h2>
            <p className="mt-1 text-sm text-muted">{feature.body}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-surface-muted p-4">
        <h2 className="text-sm font-semibold">Before you start</h2>
        <div className="mt-2">
          <Disclaimer />
        </div>
      </div>
    </main>
  );
}
