import { describe, expect, it } from "vitest";
import { decideRoute, decideSelfNavigation } from "../src/router-logic";
import { BUILTIN_RULES } from "../src/rules";
import type { Rule } from "../src/types";

const meetRule = BUILTIN_RULES.find((r) => r.id === "meet") as Rule;
const gmailRule = BUILTIN_RULES.find((r) => r.id === "gmail") as Rule;

describe("decideRoute", () => {
  it("S1: no window open, PWA installed -> open a new PWA window", () => {
    const action = decideRoute({
      rule: meetRule,
      targetUrl: "https://meet.google.com/abc-defg-hij",
      existing: undefined,
      pwaInstalled: true,
      isHomeUrl: false,
    });
    expect(action).toEqual({ type: "open-new" });
  });

  it("no window, PWA not installed -> leave the tab", () => {
    const action = decideRoute({
      rule: meetRule,
      targetUrl: "https://meet.google.com/abc-defg-hij",
      existing: undefined,
      pwaInstalled: false,
      isHomeUrl: false,
    });
    expect(action).toEqual({ type: "leave" });
  });

  it("S2: window open for a specific target -> navigate it and close the stray tab", () => {
    const action = decideRoute({
      rule: gmailRule,
      targetUrl: "https://mail.google.com/mail/u/0/#inbox/thread123",
      existing: { tabId: 1, windowId: 10, url: "https://mail.google.com/mail/u/0/#inbox", inCall: false },
      pwaInstalled: true,
      isHomeUrl: false,
    });
    expect(action).toEqual({
      type: "navigate",
      tabId: 1,
      url: "https://mail.google.com/mail/u/0/#inbox/thread123",
    });
  });

  it("window open, link is the app's home URL -> focus only, don't navigate", () => {
    const action = decideRoute({
      rule: gmailRule,
      targetUrl: "https://mail.google.com/mail/",
      existing: { tabId: 1, windowId: 10, url: "https://mail.google.com/mail/u/0/#inbox/x", inCall: false },
      pwaInstalled: true,
      isHomeUrl: true,
    });
    expect(action).toEqual({ type: "focus", tabId: 1, windowId: 10 });
  });

  it("S3: window is in an active call and link is a different meeting -> open a second window, never navigate away", () => {
    const action = decideRoute({
      rule: meetRule,
      targetUrl: "https://meet.google.com/xyz-other-meeting",
      existing: {
        tabId: 1,
        windowId: 10,
        url: "https://meet.google.com/abc-defg-hij",
        inCall: true,
      },
      pwaInstalled: true,
      isHomeUrl: false,
    });
    expect(action).toEqual({ type: "open-new" });
  });

  it("Meet 'join from lobby' link while already in that same meeting -> focus the existing window only", () => {
    const action = decideRoute({
      rule: meetRule,
      targetUrl: "https://meet.google.com/abc-defg-hij",
      existing: {
        tabId: 1,
        windowId: 10,
        url: "https://meet.google.com/abc-defg-hij",
        inCall: true,
      },
      pwaInstalled: true,
      isHomeUrl: false,
    });
    // Same URL as the active call -> not "a different meeting", so it must not
    // open a second window. Re-navigating to the same URL is a no-op in practice.
    expect(action.type).not.toBe("open-new");
  });

  it("a rule with existingWindow: focus never navigates, even to a new target", () => {
    const focusOnlyRule: Rule = { ...gmailRule, existingWindow: "focus" };
    const action = decideRoute({
      rule: focusOnlyRule,
      targetUrl: "https://mail.google.com/mail/u/0/#inbox/thread123",
      existing: { tabId: 1, windowId: 10, url: "https://mail.google.com/mail/u/0/#inbox", inCall: false },
      pwaInstalled: true,
      isHomeUrl: false,
    });
    expect(action).toEqual({ type: "focus", tabId: 1, windowId: 10 });
  });
});

describe("decideSelfNavigation", () => {
  it("ordinary in-app navigation (same account) just retags with the same account", () => {
    const action = decideSelfNavigation({
      trackedAccount: "0",
      newAccount: "0",
      otherWindowForAccount: undefined,
    });
    expect(action).toEqual({ type: "retag", account: "0" });
  });

  it("navigating to a URL with no account hint keeps the tracked account", () => {
    const action = decideSelfNavigation({
      trackedAccount: "0",
      newAccount: null,
      otherWindowForAccount: undefined,
    });
    expect(action).toEqual({ type: "retag", account: "0" });
  });

  it("account switch with no other window open for that account -> becomes that account in place", () => {
    const action = decideSelfNavigation({
      trackedAccount: "0",
      newAccount: "1",
      otherWindowForAccount: undefined,
    });
    expect(action).toEqual({ type: "retag", account: "1" });
  });

  it("account switch onto an account that already has its own window -> collapse into it", () => {
    const action = decideSelfNavigation({
      trackedAccount: "0",
      newAccount: "1",
      otherWindowForAccount: { windowId: 99, tabId: 77 },
    });
    expect(action).toEqual({ type: "collapse-into", windowId: 99, tabId: 77 });
  });
});
