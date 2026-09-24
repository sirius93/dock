const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

/** Unwrap `google.com/url?q=...` redirects so rules match the real target. */
export function unwrapGoogleRedirect(rawUrl: string): string {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return rawUrl;
  }
  const isGoogleRedirect =
    (u.hostname === "www.google.com" || u.hostname === "google.com") && u.pathname === "/url";
  if (!isGoogleRedirect) return rawUrl;
  const target = u.searchParams.get("q") ?? u.searchParams.get("url");
  return target ?? rawUrl;
}

/** `accounts.google.com` interstitials are never routed; wait for the final URL. */
export function isAccountSwitcherUrl(rawUrl: string): boolean {
  try {
    return new URL(rawUrl).hostname === "accounts.google.com";
  } catch {
    return false;
  }
}

/**
 * Account key from a URL, in spec order: `authuser=`, then `/u/N/`, then a
 * stored email->index mapping matched against any email found in the URL.
 * Returns null when there's no hint (caller falls back to most-recently-focused).
 */
export function extractAccountKey(
  rawUrl: string,
  emailToIndex: Record<string, string> = {},
): string | null {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }

  const authuser = u.searchParams.get("authuser");
  if (authuser !== null) return authuser;

  const pathMatch = u.pathname.match(/\/u\/(\d+)\//);
  if (pathMatch) return pathMatch[1] ?? null;

  const emailMatch = rawUrl.match(EMAIL_RE);
  if (emailMatch && emailMatch[0] in emailToIndex) return emailToIndex[emailMatch[0]] ?? null;

  return null;
}

/** Account email shown in a Gmail/Workspace tab title, e.g. "Inbox - foo@bar.com - Gmail". */
export function extractAccountEmailFromTitle(title: string): string | null {
  const match = title.match(EMAIL_RE);
  return match ? match[0] : null;
}
