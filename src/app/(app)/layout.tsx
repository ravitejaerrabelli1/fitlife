import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireSession } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            Fit<span className="text-brand">Forge</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-muted"
            >
              Search
            </Link>
            {user.role === "admin" ? (
              <Link
                href="/admin"
                className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-muted"
              >
                Admin
              </Link>
            ) : null}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
