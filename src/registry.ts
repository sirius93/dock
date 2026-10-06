import type { AppWindow, Rule } from "./types";
import { findMatchingRule } from "./rules";
import { extractAccountEmailFromTitle, extractAccountKey } from "./accounts";

// Meet shows the call as the tab's audible+title state; this regex catches the
// "in call" title Meet sets. Cheap alternative to a content script (spike risk #3).
const MEET_CALL_TITLE_RE = /Meet( -|:)|meet\.google\.com.*\|/i;

/**
 * In-memory registry of tracked app windows, keyed by windowId — one entry
 * per actual Chrome window, never collapsed. (A previous version keyed by
 * "app:account", which meant two windows of the same app signed into the
 * same account silently overwrote each other during rebuild() — the
 * switcher could never show more than one window per app+account, even
 * though that's exactly the duplicate case it exists to show you so you can
 * Tidy it.) Rebuilt whenever the service worker wakes.
 */
export class Registry {
  private windows = new Map<number, AppWindow>();

  /** The canonical window for an app+account — most recently focused, if more than one is open. */
  get(app: string, account: string | null): AppWindow | undefined {
    let best: AppWindow | undefined;
    for (const w of this.windows.values()) {
      if (w.app !== app || w.account !== account) continue;
      if (!best || w.lastFocused > best.lastFocused) best = w;
    }
    return best;
  }

  getByTabId(tabId: number): AppWindow | undefined {
    for (const w of this.windows.values()) {
      if (w.tabId === tabId) return w;
    }
    return undefined;
  }

  /** Number of tracked app windows currently signed in as `account`. */
  countForAccount(account: string | null): number {
    return this.all().filter((w) => w.account === account).length;
  }

  /** Most recently focused window for an app, regardless of account. */
  mostRecentlyFocused(app: string): AppWindow | undefined {
    let best: AppWindow | undefined;
    for (const w of this.windows.values()) {
      if (w.app !== app) continue;
      if (!best || w.lastFocused > best.lastFocused) best = w;
    }
    return best;
  }

  all(): AppWindow[] {
    return [...this.windows.values()];
  }

  set(win: AppWindow): void {
    this.windows.set(win.windowId, win);
  }

  removeByTabId(tabId: number): void {
    for (const [k, w] of this.windows) {
      if (w.tabId === tabId) this.windows.delete(k);
    }
  }

  /** Re-tag a tracked window after it navigates itself to a new URL/account in place. */
  retag(tabId: number, account: string | null, url: string, title?: string): void {
    const win = this.getByTabId(tabId);
    if (!win) return;
    win.account = account;
    win.url = url;
    if (title !== undefined) win.title = title;
  }

  clear(): void {
    this.windows.clear();
  }

  async rebuild(rules: Rule[], emailToIndex: Record<string, string>): Promise<void> {
    this.clear();
    const chromeWindows = await chrome.windows.getAll({ populate: true });
    for (const win of chromeWindows) {
      if (win.type !== "app" || !win.tabs) continue;
      const tab = win.tabs[0];
      if (!tab?.url || tab.id === undefined || win.id === undefined) continue;

      const rule = findMatchingRule(tab.url, rules);
      if (!rule) continue;

      const account = accountForTab(tab.url, tab.title ?? "", emailToIndex);
      this.set({
        windowId: win.id,
        tabId: tab.id,
        app: rule.id,
        account,
        url: tab.url,
        title: tab.title ?? "",
        lastFocused: win.focused ? Date.now() : 0,
        inCall: rule.protectActiveCall === true && Boolean(tab.audible) && MEET_CALL_TITLE_RE.test(tab.title ?? ""),
      });
    }
  }
}

function accountForTab(
  url: string,
  title: string,
  emailToIndex: Record<string, string>,
): string | null {
  const fromUrl = extractAccountKey(url, emailToIndex);
  if (fromUrl !== null) return fromUrl;
  const email = extractAccountEmailFromTitle(title);
  return email ? (emailToIndex[email] ?? email) : null;
}
