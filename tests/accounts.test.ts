import { describe, expect, it } from "vitest";
import {
  extractAccountEmailFromTitle,
  extractAccountKey,
  isAccountSwitcherUrl,
  unwrapGoogleRedirect,
} from "../src/accounts";

describe("extractAccountKey", () => {
  it("prefers authuser query param", () => {
    expect(extractAccountKey("https://mail.google.com/mail/u/1/?authuser=2")).toBe("2");
  });

  it("falls back to /u/N/ path segment", () => {
    expect(extractAccountKey("https://mail.google.com/mail/u/1/#inbox")).toBe("1");
  });

  it("falls back to a stored email->index mapping", () => {
    const map = { "work@company.com": "1" };
    expect(
      extractAccountKey("https://meet.google.com/abc?ref=work@company.com", map),
    ).toBe("1");
  });

  it("returns null when there's no hint", () => {
    expect(extractAccountKey("https://meet.google.com/abc")).toBeNull();
  });

  it("returns null for an invalid URL", () => {
    expect(extractAccountKey("not a url")).toBeNull();
  });

  it("authuser=0 is a valid hint, not treated as missing", () => {
    expect(extractAccountKey("https://mail.google.com/mail/?authuser=0")).toBe("0");
  });
});

describe("extractAccountEmailFromTitle", () => {
  it("pulls the email out of a Gmail-style title", () => {
    expect(extractAccountEmailFromTitle("Inbox (3) - jane@company.com - Gmail")).toBe(
      "jane@company.com",
    );
  });

  it("returns null when there's no email", () => {
    expect(extractAccountEmailFromTitle("Google Meet")).toBeNull();
  });
});

describe("unwrapGoogleRedirect", () => {
  it("unwraps a google.com/url?q= redirect", () => {
    expect(
      unwrapGoogleRedirect("https://www.google.com/url?q=https://meet.google.com/abc&sa=D"),
    ).toBe("https://meet.google.com/abc");
  });

  it("leaves non-redirect URLs untouched", () => {
    expect(unwrapGoogleRedirect("https://meet.google.com/abc")).toBe(
      "https://meet.google.com/abc",
    );
  });
});

describe("isAccountSwitcherUrl", () => {
  it("flags accounts.google.com", () => {
    expect(isAccountSwitcherUrl("https://accounts.google.com/AccountChooser")).toBe(true);
  });

  it("does not flag other Google hosts", () => {
    expect(isAccountSwitcherUrl("https://mail.google.com/mail/")).toBe(false);
  });
});
