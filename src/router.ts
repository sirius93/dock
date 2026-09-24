import { activeRules, isPaused, loadSettings } from "./storage";
import { findMatchingRule } from "./rules";
import { extractAccountKey, isAccountSwitcherUrl, unwrapGoogleRedirect } from "./accounts";
import { decideRoute, decideSelfNavigation } from "./router-logic";
import { Registry } from "./registry";
import { baseFromPattern, findPwaForRule, launchPwaAtUrl } from "./pwa";
import { assignColour } from "./colours";
import type { DockSettings } from "./storage";
import type { AppWindow } from "./types";

const registry = new Registry();
let registryReady: Promise<void> = refreshRegistry();

// Per-URL debounce: a window navigating itself (because we just routed it)
// shouldn't be re-caught as a fresh incoming link. Spec: 2s window.
const DEBOUNCE_MS = 2000;
const recentlyRouted = new Map<string, number>();

// Content script reports shift-clicked hrefs here; skip routing them once.
const BYPASS_TTL_MS = 3000;
const bypassUrls = new Map<string, number>();

const suggestedInstall = new Set<string>();

function refreshRegistry(): Promise<void> {
  registryReady = loadSettings().then((settings) =>
    registry.rebuild(activeRules(settings), settings.emailToIndex),
  );
  return registryReady;
}

chrome.runtime.onStartup.addListener(() => void refreshRegistry());
chrome.runtime.onInstalled.addListener(() => void refreshRegistry());

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  const now = Date.now();
  for (const w of registry.all()) {
    if (w.windowId === windowId) w.lastFocused = now;
  }
  await updateBadgeForWindow(windowId);
});

chrome.tabs.onRemoved.addListener((tabId) => registry.removeByTabId(tabId));

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (isBypassMessage(message)) {
    bypassUrls.set(message.url, Date.now());
  }
});

chrome.webNavigation.onCreatedNavigationTarget.addListener((details) => {
  void handleIncomingUrl(details.url, details.tabId);
});

chrome.tabs.onCreated.addListener((tab) => {
  const url = tab.pendingUrl || tab.url;
  if (tab.id !== undefined && url) void handleIncomingUrl(url, tab.id);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) void handleIncomingUrl(changeInfo.url, tabId);
});

async function handleIncomingUrl(rawUrl: string, tabId: number): Promise<void> {
  if (isAccountSwitcherUrl(rawUrl)) return; // wait for the final redirect target

  const url = unwrapGoogleRedirect(rawUrl);
  await registryReady;

  // This tab is itself a tracked app window navigating on its own (a normal
  // click inside the PWA, or an in-app account switch) — not a stray link
  // that needs routing. Handle it separately so we never navigate/close a
  // window because it navigated itself.
  const trackedWindow = registry.getByTabId(tabId);
  if (trackedWindow) {
    await handleSelfNavigation(trackedWindow, url, tabId);
    return;
  }

  if (isRecentlyRouted(url)) return;
  if (consumeBypass(rawUrl) || consumeBypass(url)) return;

  const settings = await loadSettings();
  if (isPaused(settings)) return;

  const rule = findMatchingRule(url, activeRules(settings));
  if (!rule) return;

  const sourceTab = await chrome.tabs.get(tabId).catch(() => undefined);
  if (sourceTab?.windowId !== undefined) {
    const sourceWindow = await chrome.windows.get(sourceTab.windowId).catch(() => undefined);
    // Chrome's own "open supported links" already landed this in a PWA window — don't double-route.
    if (sourceWindow?.type === "app") return;
  }

  const account = extractAccountKey(url, settings.emailToIndex);
  const existingAppWindow =
    account !== null ? registry.get(rule.id, account) : registry.mostRecentlyFocused(rule.id);

  const isHomeUrl = isHomeUrlFor(url, rule.match[0] ?? "");
  const pwa = rule.target === "pwa" ? await findPwaForRule(rule) : undefined;

  const action = decideRoute({
    rule,
    targetUrl: url,
    existing: existingAppWindow
      ? {
          tabId: existingAppWindow.tabId,
          windowId: existingAppWindow.windowId,
          url: existingAppWindow.url,
          inCall: existingAppWindow.inCall,
        }
      : undefined,
    pwaInstalled: pwa !== undefined,
    isHomeUrl,
  });

  markRouted(url);

  switch (action.type) {
    case "navigate": {
      await chrome.tabs.update(action.tabId, { url: action.url });
      await closeStrayTab(tabId);
      await focusTabWindow(action.tabId);
      await notifyRouted(rule.name, account, settings);
      break;
    }
    case "focus": {
      await chrome.windows.update(action.windowId, { focused: true });
      await chrome.tabs.update(action.tabId, { active: true });
      await closeStrayTab(tabId);
      await notifyRouted(rule.name, account, settings);
      break;
    }
    case "open-new": {
      if (!pwa) break; // shouldn't happen: decideRoute only returns open-new when pwaInstalled
      await launchPwaAtUrl(pwa, url);
      await closeStrayTab(tabId);
      await refreshRegistry();
      if (account) await persistColour(account, settings);
      await notifyRouted(rule.name, account, settings);
      break;
    }
    case "leave": {
      suggestInstallOnce(rule.id, rule.name);
      break;
    }
  }
}

async function handleSelfNavigation(tracked: AppWindow, url: string, tabId: number): Promise<void> {
  const settings = await loadSettings();
  const newAccount = extractAccountKey(url, settings.emailToIndex);
  const other = registry.get(tracked.app, newAccount ?? tracked.account);

  const decision = decideSelfNavigation({
    trackedAccount: tracked.account,
    newAccount,
    otherWindowForAccount: other ? { windowId: other.windowId, tabId: other.tabId } : undefined,
  });

  if (decision.type === "collapse-into") {
    await chrome.windows.update(decision.windowId, { focused: true });
    await chrome.tabs.update(decision.tabId, { active: true });
    registry.removeByTabId(tabId);
    await closeStrayTab(tabId);
  } else {
    registry.retag(tabId, decision.account, url);
    if (decision.account && decision.account !== tracked.account) {
      await persistColour(decision.account, settings);
    }
  }
}

function isHomeUrlFor(url: string, firstPattern: string): boolean {
  const base = baseFromPattern(firstPattern).replace(/\/$/, "");
  return url.replace(/\/$/, "") === base;
}

function isRecentlyRouted(url: string): boolean {
  const last = recentlyRouted.get(url);
  return last !== undefined && Date.now() - last < DEBOUNCE_MS;
}

function markRouted(url: string): void {
  recentlyRouted.set(url, Date.now());
  for (const [k, t] of recentlyRouted) {
    if (Date.now() - t > DEBOUNCE_MS) recentlyRouted.delete(k);
  }
}

function consumeBypass(url: string): boolean {
  const seenAt = bypassUrls.get(url);
  if (seenAt === undefined) return false;
  bypassUrls.delete(url);
  return Date.now() - seenAt < BYPASS_TTL_MS;
}

function isBypassMessage(message: unknown): message is { type: "dock-bypass"; url: string } {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as { type?: unknown }).type === "dock-bypass" &&
    typeof (message as { url?: unknown }).url === "string"
  );
}

async function closeStrayTab(tabId: number): Promise<void> {
  await chrome.tabs.remove(tabId).catch(() => {});
}

async function focusTabWindow(tabId: number): Promise<void> {
  const tab = await chrome.tabs.get(tabId).catch(() => undefined);
  if (tab?.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true });
}

async function persistColour(account: string, settings: DockSettings): Promise<void> {
  if (settings.colours[account]) return;
  const colour = assignColour(account, settings.colours);
  await chrome.storage.local.set({ colours: { ...settings.colours, [account]: colour } });
}

async function notifyRouted(
  appName: string,
  account: string | null,
  settings: DockSettings,
): Promise<void> {
  if (!settings.toastsEnabled) return;
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: `Opened in ${appName}`,
    message: account ? account : "",
    buttons: [{ title: "Undo" }],
  });
}

function suggestInstallOnce(ruleId: string, ruleName: string): void {
  if (suggestedInstall.has(ruleId)) return;
  suggestedInstall.add(ruleId);
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: `Install ${ruleName}?`,
    message: `Dock can route ${ruleName} links once it's installed as an app.`,
  });
}

async function updateBadgeForWindow(windowId: number): Promise<void> {
  const win = registry.all().find((w) => w.windowId === windowId);
  const settings = await loadSettings();
  const colour = win?.account ? settings.colours[win.account] : undefined;
  await chrome.action.setBadgeBackgroundColor({ color: colour ?? "#00000000" });
  await chrome.action.setBadgeText({ text: colour ? " " : "" });
}
