"use client";

import { useEffect } from "react";
import { setTimeZoneAction } from "@/app/actions";

export function TimeZoneSync({ saved }: { saved: string }) {
  useEffect(() => {
    const sync = () => {
      if (document.visibilityState === "hidden") return;
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timeZone && timeZone !== saved) void setTimeZoneAction(timeZone);
    };
    sync();
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [saved]);
  return null;
}
