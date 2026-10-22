import { describe, expect, it } from "vitest";
import { addDays, isValidTimeZone, localDate, localHour } from "./dates";

// 2026-10-09 20:00 UTC = 2026-10-10 01:30 in India (UTC+5:30).
const lateEveningUtc = new Date("2026-10-09T20:00:00Z");

describe("localDate", () => {
  it("uses the user's calendar day, not the UTC day", () => {
    expect(localDate("Asia/Kolkata", lateEveningUtc)).toBe("2026-10-10");
    expect(localDate("UTC", lateEveningUtc)).toBe("2026-10-09");
    expect(localDate("America/Los_Angeles", new Date("2026-10-10T03:00:00Z"))).toBe(
      "2026-10-09",
    );
  });

  it("switches day exactly at local midnight", () => {
    expect(localDate("Asia/Kolkata", new Date("2026-10-09T18:29:59Z"))).toBe("2026-10-09");
    expect(localDate("Asia/Kolkata", new Date("2026-10-09T18:30:00Z"))).toBe("2026-10-10");
  });

  it("falls back to UTC for missing or invalid zones", () => {
    expect(localDate("", lateEveningUtc)).toBe("2026-10-09");
    expect(localDate(null, lateEveningUtc)).toBe("2026-10-09");
    expect(localDate("Not/AZone", lateEveningUtc)).toBe("2026-10-09");
  });
});

describe("localHour", () => {
  it("returns the hour in the user's zone", () => {
    expect(localHour("Asia/Kolkata", lateEveningUtc)).toBe(1);
    expect(localHour("UTC", lateEveningUtc)).toBe(20);
    expect(localHour("UTC", new Date("2026-10-09T00:15:00Z"))).toBe(0);
  });
});

describe("isValidTimeZone", () => {
  it("accepts IANA zones and rejects junk", () => {
    expect(isValidTimeZone("Asia/Kolkata")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("")).toBe(false);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
    expect(isValidTimeZone("'; DROP TABLE profiles; --")).toBe(false);
    expect(isValidTimeZone("A".repeat(65))).toBe(false);
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries without drift", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-03-07", 2)).toBe("2026-03-09");
  });
});
