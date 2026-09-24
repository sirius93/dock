import { describe, expect, it } from "vitest";
import { accountLabel, cleanWindowTitle } from "../src/display";

describe("accountLabel", () => {
  it("prefers the email from a Gmail-style title", () => {
    expect(accountLabel("0", "Inbox - jane@company.com - Gmail")).toBe("jane@company.com");
  });

  it("falls back to a numbered label when the title has no email", () => {
    expect(accountLabel("1", "Google Meet")).toBe("Account 1");
  });

  it("returns null when there's no account and no email", () => {
    expect(accountLabel(null, "Google Meet")).toBeNull();
  });
});

describe("cleanWindowTitle", () => {
  it("strips the trailing brand name and bare-email segment", () => {
    expect(cleanWindowTitle("Inbox - info@pawrivarik.com - Pawrivarik technologies Mail")).toBe(
      "Inbox",
    );
  });

  it("keeps a page segment that has a count in it", () => {
    expect(cleanWindowTitle("Inbox (606) - nandan.1345@gmail.com - Gmail")).toBe("Inbox (606)");
  });

  it("leaves a single-segment title untouched", () => {
    expect(cleanWindowTitle("Google Meet")).toBe("Google Meet");
  });

  it("keeps a middle segment that isn't an email", () => {
    expect(cleanWindowTitle("Thread subject - Inbox - Gmail")).toBe("Thread subject - Inbox");
  });
});
