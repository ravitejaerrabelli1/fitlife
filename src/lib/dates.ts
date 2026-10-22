export const DEFAULT_TIME_ZONE = "UTC";

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone || timeZone.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

function zoneOrDefault(timeZone: string | null | undefined): string {
  return timeZone && isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIME_ZONE;
}

function parts(timeZone: string | null | undefined, at: Date) {
  const values: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone: zoneOrDefault(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at)) {
    values[part.type] = part.value;
  }
  return values;
}

/** Calendar date (YYYY-MM-DD) in the given IANA time zone; unknown zones use UTC. */
export function localDate(timeZone?: string | null, at: Date = new Date()): string {
  const { year, month, day } = parts(timeZone, at);
  return `${year}-${month}-${day}`;
}

/** Hour of day (0–23) in the given IANA time zone; unknown zones use UTC. */
export function localHour(timeZone?: string | null, at: Date = new Date()): number {
  return Number(parts(timeZone, at).hour);
}

/** Adds whole days to a YYYY-MM-DD date without time-zone or DST drift. */
export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
