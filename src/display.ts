import { extractAccountEmailFromTitle } from "./accounts";

/**
 * Human label for an account. The routing/registry code keys accounts by the
 * `authuser` index (e.g. "0", "1") because that's what's stable and present
 * on every URL — but showing that raw index in the UI ("0", "1", "6") is
 * meaningless to a person. Prefer the email a Gmail-style tab title exposes;
 * fall back to a numbered label when no title has given one up yet.
 */
export function accountLabel(account: string | null, title: string): string | null {
  const email = extractAccountEmailFromTitle(title);
  if (email) return email;
  return account !== null ? `Account ${account}` : null;
}

const BARE_EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Tab titles repeat the account email and app/brand name the switcher
 * already shows in the group header and app label, e.g.
 * "Inbox - jane@co.com - Gmail" -> "Inbox". Strips the trailing brand
 * segment and any bare-email segment; titles that don't look like that
 * pattern (a Meet code, a single-word title) pass through unchanged.
 */
export function cleanWindowTitle(rawTitle: string): string {
  const parts = rawTitle
    .split(" - ")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1) return rawTitle;

  const kept = parts.filter((p, i) => {
    if (i === parts.length - 1) return false; // trailing app/brand name
    if (BARE_EMAIL_RE.test(p)) return false; // bare email segment
    return true;
  });

  return kept.length > 0 ? kept.join(" - ") : (parts[0] ?? rawTitle);
}
