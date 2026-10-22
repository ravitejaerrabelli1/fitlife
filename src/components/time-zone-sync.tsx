"use client";

import { useEffect } from "react";
import { setTimeZoneAction } from "@/app/actions";

/** Saves the device's time zone so "today" on the server matches the user's calendar day. */
export function TimeZoneSync({ saved }: { saved: string }) {
  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone && timeZone !== saved) void setTimeZoneAction(timeZone);
  }, [saved]);
  return null;
}
