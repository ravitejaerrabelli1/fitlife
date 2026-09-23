"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

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

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(subscribe, getSnapshot, () => "light");

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("fitlife-theme", next);
    } catch {
      // Ignore storage failures (private mode).
    }
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
