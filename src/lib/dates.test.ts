import { describe, expect, it } from "vitest";
import { addDays, isIsoDate, isValidTimeZone, localDate, localHour } from "./dates";

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

describe("isIsoDate", () => {
  it("accepts real calendar dates, including leap days", () => {
    expect(isIsoDate("2026-11-04")).toBe(true);
    expect(isIsoDate("2028-02-29")).toBe(true);
  });

  it("rejects impossible or malformed dates", () => {
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2026-02-31")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("2026-1-1")).toBe(false);
    expect(isIsoDate("2026-11-04T00:00")).toBe(false);
    expect(isIsoDate("")).toBe(false);
  });
});

describe("daylight saving transitions", () => {
  it("keeps New York midnight on the local calendar across spring-forward", () => {
    // 2026-03-08: clocks jump 02:00 EST → 03:00 EDT.
    expect(localDate("America/New_York", new Date("2026-03-08T04:59:00Z"))).toBe("2026-03-07");
    expect(localDate("America/New_York", new Date("2026-03-08T05:00:00Z"))).toBe("2026-03-08");
    expect(localDate("America/New_York", new Date("2026-03-09T03:59:00Z"))).toBe("2026-03-08");
    expect(localDate("America/New_York", new Date("2026-03-09T04:00:00Z"))).toBe("2026-03-09");
  });

  it("keeps New York midnight on the local calendar across fall-back", () => {
    // 2026-11-01: clocks fall back 02:00 EDT → 01:00 EST.
    expect(localDate("America/New_York", new Date("2026-11-01T03:59:00Z"))).toBe("2026-10-31");
    expect(localDate("America/New_York", new Date("2026-11-01T04:00:00Z"))).toBe("2026-11-01");
    expect(localDate("America/New_York", new Date("2026-11-02T04:59:00Z"))).toBe("2026-11-01");
    expect(localDate("America/New_York", new Date("2026-11-02T05:00:00Z"))).toBe("2026-11-02");
    // The repeated 01:00 hour stays on the same day.
    expect(localHour("America/New_York", new Date("2026-11-01T05:30:00Z"))).toBe(1);
    expect(localHour("America/New_York", new Date("2026-11-01T06:30:00Z"))).toBe(1);
  });

  it("follows London's switch to BST", () => {
    // 2026-03-29: clocks jump 01:00 GMT → 02:00 BST.
    expect(localDate("Europe/London", new Date("2026-03-28T23:59:00Z"))).toBe("2026-03-28");
    expect(localDate("Europe/London", new Date("2026-03-29T22:59:00Z"))).toBe("2026-03-29");
    expect(localDate("Europe/London", new Date("2026-03-29T23:00:00Z"))).toBe("2026-03-30");
  });

  it("adds whole calendar days across a DST weekend", () => {
    expect(addDays("2026-03-07", 1)).toBe("2026-03-08");
    expect(addDays("2026-10-31", 2)).toBe("2026-11-02");
  });
});
