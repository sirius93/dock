import type { Rule } from "./types";

export function baseFromPattern(pattern: string): string {
  return pattern.replace(/\*.*$/, "");
}

/**
 * Best-effort match of an installed PWA to a rule, by comparing the app's
 * homepage URL against the rule's match-pattern base. This is spike risk #1
 * from the spec — verify against real installed PWAs before relying on it.
 */
export async function findPwaForRule(
  rule: Rule,
): Promise<chrome.management.ExtensionInfo | undefined> {
  const apps = await chrome.management.getAll();
  const bases = rule.match.map(baseFromPattern);
  return apps.find((app) => {
    if (app.type !== "hosted_app" && app.type !== "packaged_app") return false;
    if (!app.enabled) return false;
    const homepage = app.homepageUrl ?? "";
    return bases.some((base) => homepage.startsWith(base) || base.startsWith(homepage));
  });
}

/**
 * Launches the PWA and navigates its (single) tab to `url`. Spike risk #2:
 * measure the visible flash between launch and the update landing.
 */
export async function launchPwaAtUrl(
  app: chrome.management.ExtensionInfo,
  url: string,
): Promise<chrome.windows.Window | undefined> {
  const before = new Set((await chrome.windows.getAll()).map((w) => w.id));
  await chrome.management.launchApp(app.id);
  const win = await waitForNewAppWindow(before);
  const tab = win?.tabs?.[0];
  if (win && tab?.id !== undefined && tab.url !== url) {
    await chrome.tabs.update(tab.id, { url });
  }
  return win;
}

async function waitForNewAppWindow(
  beforeIds: Set<number | undefined>,
  timeoutMs = 2000,
): Promise<chrome.windows.Window | undefined> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const windows = await chrome.windows.getAll({ populate: true });
    const found = windows.find((w) => w.type === "app" && !beforeIds.has(w.id));
    if (found) return found;
    await sleep(50);
  }
  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
