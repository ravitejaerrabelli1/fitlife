"use client";

import { startTransition, useEffect, useSyncExternalStore } from "react";
import { setThemeAction } from "@/app/actions";

type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function resolve(preference: ThemePreference): Theme {
  if (preference === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return preference;
}

function apply(preference: ThemePreference): void {
  document.documentElement.classList.toggle("dark", resolve(preference) === "dark");
  try {
    localStorage.setItem("fitlife-theme", preference);
  } catch {
    // Ignore storage failures (private mode).
  }
}

export function ThemeToggle({ preference }: { preference: ThemePreference }) {
  const theme = useSyncExternalStore<Theme>(subscribe, getSnapshot, () => "light");

  useEffect(() => {
    apply(preference);
  }, [preference]);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    apply(next);
    startTransition(() => {
      void setThemeAction(next);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={theme === "dark"}
      className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-muted"
    >
      {theme === "dark" ? "Dark" : "Light"} mode
    </button>
  );
}
