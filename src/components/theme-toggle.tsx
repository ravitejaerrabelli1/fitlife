"use client";

import { useEffect } from "react";

type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

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

/** Applies the saved theme preference; the preference itself is edited on the Profile page. */
export function ThemeSync({ preference }: { preference: ThemePreference }) {
  useEffect(() => {
    apply(preference);
  }, [preference]);
  return null;
}
