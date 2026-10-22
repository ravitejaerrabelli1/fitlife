import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { ThemeSync, type ThemePreference } from "@/components/theme-toggle";
import { TimeZoneSync } from "@/components/time-zone-sync";
import { getProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();
  const profile = getProfile(user.id);
  const theme = (profile?.theme ?? "system") as ThemePreference;

  return (
    <div className="flex min-h-full flex-col">
      <ThemeSync preference={theme} />
      <TimeZoneSync saved={profile?.time_zone ?? ""} />
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-3">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            Fit<span className="text-brand">Life</span>
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
