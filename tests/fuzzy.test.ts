import { describe, expect, it } from "vitest";
import { fuzzyMatch, fuzzyScore } from "../src/fuzzy";

describe("fuzzyScore", () => {
  it("matches a subsequence", () => {
    expect(fuzzyScore("mt", "Google Meet")).not.toBeNull();
  });

  it("returns null when characters are out of order", () => {
    expect(fuzzyScore("tm", "Meet")).toBeNull();
  });

  it("returns null when a character is missing", () => {
    expect(fuzzyScore("meetx", "Meet")).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(fuzzyScore("MEET", "meet")).not.toBeNull();
  });

  it("scores an earlier / more consecutive match higher", () => {
    const early = fuzzyScore("meet", "Meet - work@company.com");
    const late = fuzzyScore("meet", "work@company.com - Meet");
    expect(early).not.toBeNull();
    expect(late).not.toBeNull();
    expect(early as number).toBeGreaterThan(late as number);
  });
});

describe("fuzzyMatch", () => {
  it("takes the best score across app, account and title", () => {
    expect(fuzzyMatch("work", "Gmail", "work@company.com", "Inbox")).not.toBeNull();
  });

  it("returns null when no field matches", () => {
    expect(fuzzyMatch("zzz", "Gmail", "work@company.com", "Inbox")).toBeNull();
  });
});
