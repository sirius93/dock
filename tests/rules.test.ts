import { describe, expect, it } from "vitest";
import { BUILTIN_RULES, findMatchingRule, matchesPattern } from "../src/rules";

// Small representative corpus of real-shaped Google links, one cluster per
// built-in rule plus a few near-misses. Grow this from dogfooding logs
// rather than hand-writing to 200+ up front.
const CORPUS: Array<{ url: string; expectedRuleId: string | undefined }> = [
  { url: "https://mail.google.com/mail/u/0/#inbox", expectedRuleId: "gmail" },
  { url: "https://mail.google.com/mail/u/2/#inbox/FMfcgz", expectedRuleId: "gmail" },
  { url: "https://meet.google.com/abc-defg-hij", expectedRuleId: "meet" },
  { url: "https://meet.google.com/abc-defg-hij?authuser=1", expectedRuleId: "meet" },
  { url: "https://calendar.google.com/calendar/u/1/r/eventedit/abc", expectedRuleId: "calendar" },
  { url: "https://drive.google.com/drive/u/0/folders/xyz", expectedRuleId: "drive" },
  { url: "https://drive.google.com/file/d/abc123/view", expectedRuleId: "drive" },
  {
    url: "https://docs.google.com/document/d/abc123/edit?usp=sharing",
    expectedRuleId: "docs",
  },
  {
    url: "https://docs.google.com/spreadsheets/d/abc123/edit#gid=0",
    expectedRuleId: "sheets",
  },
  { url: "https://docs.google.com/presentation/d/abc123/edit", expectedRuleId: "slides" },
  { url: "https://chat.google.com/room/xyz", expectedRuleId: "chat" },
  { url: "https://www.google.com/search?q=meet", expectedRuleId: undefined },
  { url: "https://accounts.google.com/AccountChooser", expectedRuleId: undefined },
  { url: "https://figma.com/file/abc", expectedRuleId: undefined },
  { url: "https://mail.google.com/", expectedRuleId: undefined }, // needs /mail/ path
];

describe("findMatchingRule against a URL corpus", () => {
  for (const { url, expectedRuleId } of CORPUS) {
    it(`${url} -> ${expectedRuleId ?? "no match"}`, () => {
      const match = findMatchingRule(url, BUILTIN_RULES);
      expect(match?.id).toBe(expectedRuleId);
    });
  }
});

describe("matchesPattern", () => {
  it("matches wildcard prefix and suffix", () => {
    expect(matchesPattern("https://meet.google.com/abc", ["https://meet.google.com/*"])).toBe(
      true,
    );
  });

  it("does not match a different host", () => {
    expect(matchesPattern("https://evilmeet.google.com/abc", ["https://meet.google.com/*"])).toBe(
      false,
    );
  });

  it("escapes regex special characters in the non-wildcard parts", () => {
    expect(matchesPattern("https://meetXgoogle.com/abc", ["https://meet.google.com/*"])).toBe(
      false,
    );
  });

  it("respects rule.enabled", () => {
    const disabled = BUILTIN_RULES.map((r) => ({ ...r, enabled: false }));
    expect(findMatchingRule("https://meet.google.com/abc", disabled)).toBeUndefined();
  });
});
