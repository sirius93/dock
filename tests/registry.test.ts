import { describe, expect, it } from "vitest";
import { Registry } from "../src/registry";
import type { AppWindow } from "../src/types";

function win(overrides: Partial<AppWindow>): AppWindow {
  return {
    windowId: 1,
    tabId: 1,
    app: "gmail",
    account: "0",
    url: "https://mail.google.com/mail/u/0/",
    title: "Inbox",
    lastFocused: 0,
    inCall: false,
    ...overrides,
  };
}

describe("Registry", () => {
  it("keeps two windows of the same app signed into the same account as separate entries", () => {
    // Regression test: the registry used to key its internal map by
    // "app:account", so a second window for the same app+account silently
    // overwrote the first during rebuild() — the switcher could never show
    // a duplicate, even though showing duplicates (so Tidy can close them)
    // is the whole point.
    const registry = new Registry();
    registry.set(win({ windowId: 1, tabId: 1, app: "gmail", account: "0" }));
    registry.set(win({ windowId: 2, tabId: 2, app: "gmail", account: "0" }));

    expect(registry.all()).toHaveLength(2);
    expect(registry.countForAccount("0")).toBe(2);
    expect(registry.getByTabId(1)).toBeDefined();
    expect(registry.getByTabId(2)).toBeDefined();
  });

  it("get() returns the most recently focused among duplicate app+account windows", () => {
    const registry = new Registry();
    registry.set(win({ windowId: 1, tabId: 1, app: "gmail", account: "0", lastFocused: 10 }));
    registry.set(win({ windowId: 2, tabId: 2, app: "gmail", account: "0", lastFocused: 20 }));

    expect(registry.get("gmail", "0")?.tabId).toBe(2);
  });

  it("getByTabId finds a window regardless of app/account", () => {
    const registry = new Registry();
    registry.set(win({ tabId: 5, account: "1" }));
    expect(registry.getByTabId(5)?.account).toBe("1");
    expect(registry.getByTabId(999)).toBeUndefined();
  });

  it("countForAccount counts across apps", () => {
    const registry = new Registry();
    registry.set(win({ tabId: 1, app: "gmail", account: "work@x.com" }));
    registry.set(win({ tabId: 2, app: "meet", windowId: 2, account: "work@x.com" }));
    registry.set(win({ tabId: 3, app: "gmail", windowId: 3, account: "personal@x.com" }));
    expect(registry.countForAccount("work@x.com")).toBe(2);
    expect(registry.countForAccount("personal@x.com")).toBe(1);
    expect(registry.countForAccount("nobody@x.com")).toBe(0);
  });

  it("retag updates a tracked window's account and url in place", () => {
    const registry = new Registry();
    registry.set(win({ tabId: 1, app: "gmail", account: "0" }));

    registry.retag(1, "1", "https://mail.google.com/mail/u/1/");

    expect(registry.get("gmail", "0")).toBeUndefined();
    const retagged = registry.get("gmail", "1");
    expect(retagged?.tabId).toBe(1);
    expect(retagged?.url).toBe("https://mail.google.com/mail/u/1/");
  });

  it("retag on an untracked tab is a no-op", () => {
    const registry = new Registry();
    registry.retag(404, "1", "https://mail.google.com/mail/u/1/");
    expect(registry.all()).toHaveLength(0);
  });

  it("removeByTabId drops exactly that window", () => {
    const registry = new Registry();
    registry.set(win({ tabId: 1, app: "gmail" }));
    registry.set(win({ tabId: 2, app: "meet", windowId: 2 }));
    registry.removeByTabId(1);
    expect(registry.all()).toHaveLength(1);
    expect(registry.all()[0]?.tabId).toBe(2);
  });
});
