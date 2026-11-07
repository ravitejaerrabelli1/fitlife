import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { resetLinkPath, tokenFromHash } from "./reset-link";

const token = "0f8e2c1a-1111-4222-8333-944455556666abcdefabcdefabcdefabcdefabcd";

describe("reset links", () => {
  it("puts the token in the fragment, not the path or query", () => {
    const url = new URL(resetLinkPath(token), "https://fitlife.example");
    expect(url.pathname).toBe("/reset");
    expect(url.search).toBe("");
    expect(url.hash).toBe(`#${token}`);
  });

  it("round-trips the token from the fragment", () => {
    expect(tokenFromHash(`#${token}`)).toBe(token);
  });

  it("ignores empty or malformed fragments", () => {
    expect(tokenFromHash("")).toBe("");
    expect(tokenFromHash("#")).toBe("");
    expect(tokenFromHash("#short")).toBe("");
    expect(tokenFromHash("#<script>alert(1)</script>")).toBe("");
    expect(tokenFromHash(`#${"a".repeat(129)}`)).toBe("");
  });
});

describe("reset page headers", () => {
  it("sends no Referer from any reset page", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    for (const path of ["/reset", "/reset/:token"]) {
      const rule = rules.find((r) => r.source === path);
      expect(rule?.headers).toContainEqual({ key: "Referrer-Policy", value: "no-referrer" });
    }
  });
});
