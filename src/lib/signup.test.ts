import { describe, expect, it } from "vitest";
import { isSignupAllowed } from "./signup";

describe("isSignupAllowed", () => {
  it("allows everyone when no list is configured", () => {
    expect(isSignupAllowed("anyone@example.test", undefined)).toBe(true);
    expect(isSignupAllowed("anyone@example.test", "")).toBe(true);
    expect(isSignupAllowed("anyone@example.test", " , ")).toBe(true);
  });

  it("allows only listed emails, ignoring case and spaces", () => {
    const list = " Owner@Example.test , friend@example.test";
    expect(isSignupAllowed("owner@example.test", list)).toBe(true);
    expect(isSignupAllowed("FRIEND@example.test", list)).toBe(true);
    expect(isSignupAllowed("stranger@example.test", list)).toBe(false);
    expect(isSignupAllowed("owner@example.test.evil", list)).toBe(false);
  });
});
