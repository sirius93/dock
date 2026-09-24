import type { Rule } from "./types";

export type RouteAction =
  | { type: "navigate"; tabId: number; url: string }
  | { type: "focus"; tabId: number; windowId: number }
  | { type: "open-new" }
  | { type: "leave" };

export interface ExistingWindowState {
  tabId: number;
  windowId: number;
  url: string;
  inCall: boolean;
}

export interface DecideRouteInput {
  rule: Rule;
  targetUrl: string;
  existing: ExistingWindowState | undefined;
  pwaInstalled: boolean;
  /** True when targetUrl is just the app's base/home URL, not a specific target (thread, meeting code, ...). */
  isHomeUrl: boolean;
}

/** Pure decision matching the routing-flow diagram in the spec. Chrome calls happen in router.ts. */
export function decideRoute(input: DecideRouteInput): RouteAction {
  const { rule, targetUrl, existing, pwaInstalled, isHomeUrl } = input;

  if (!existing) {
    return pwaInstalled ? { type: "open-new" } : { type: "leave" };
  }

  const isDifferentActiveCall =
    Boolean(rule.protectActiveCall) && existing.inCall && existing.url !== targetUrl;
  if (isDifferentActiveCall) {
    return { type: "open-new" };
  }

  if (rule.existingWindow === "focus" || isHomeUrl) {
    return { type: "focus", tabId: existing.tabId, windowId: existing.windowId };
  }

  return { type: "navigate", tabId: existing.tabId, url: targetUrl };
}

export type SelfNavAction =
  | { type: "retag"; account: string | null }
  | { type: "collapse-into"; windowId: number; tabId: number };

export interface DecideSelfNavigationInput {
  trackedAccount: string | null;
  /** Account extracted from the URL the window just navigated to itself; null = no hint. */
  newAccount: string | null;
  /** Another already-tracked window for the same app, already signed in as newAccount, if any. */
  otherWindowForAccount: { windowId: number; tabId: number } | undefined;
}

/**
 * A tracked app window navigated its own tab. Ordinary navigation (thread to
 * thread, etc.) just keeps the registry's URL fresh. An in-app account switch
 * that lands on an account another window is already open for should focus
 * that window instead of leaving two windows for the same account — this is
 * what makes account-switching inside a PWA reuse the existing window.
 */
export function decideSelfNavigation(input: DecideSelfNavigationInput): SelfNavAction {
  const account = input.newAccount ?? input.trackedAccount;
  if (account === input.trackedAccount) return { type: "retag", account };
  if (input.otherWindowForAccount) {
    return {
      type: "collapse-into",
      windowId: input.otherWindowForAccount.windowId,
      tabId: input.otherWindowForAccount.tabId,
    };
  }
  return { type: "retag", account };
}
