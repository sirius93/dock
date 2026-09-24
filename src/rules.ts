import type { Rule } from "./types";

// Built-ins per spec F5. Users can disable, not delete, so `builtin: true`
// rules are filtered out of delete UI rather than modeled as separate state.
export const BUILTIN_RULES: Rule[] = [
  {
    id: "gmail",
    name: "Gmail",
    match: ["https://mail.google.com/mail/*"],
    target: "pwa",
    account: "authuser",
    existingWindow: "navigate",
    builtin: true,
    enabled: true,
  },
  {
    id: "meet",
    name: "Google Meet",
    match: ["https://meet.google.com/*"],
    target: "pwa",
    account: "authuser",
    existingWindow: "navigate",
    protectActiveCall: true,
    builtin: true,
    enabled: true,
  },
  {
    id: "calendar",
    name: "Google Calendar",
    match: ["https://calendar.google.com/calendar/*"],
    target: "pwa",
    account: "authuser",
    existingWindow: "navigate",
    builtin: true,
    enabled: true,
  },
  {
    id: "drive",
    name: "Google Drive",
    match: ["https://drive.google.com/*"],
    target: "pwa",
    account: "authuser",
    existingWindow: "navigate",
    builtin: true,
    enabled: true,
  },
  {
    id: "docs",
    name: "Google Docs",
    match: ["https://docs.google.com/document/*"],
    target: "pwa",
    account: "authuser",
    existingWindow: "navigate",
    builtin: true,
    enabled: true,
  },
  {
    id: "sheets",
    name: "Google Sheets",
    match: ["https://docs.google.com/spreadsheets/*"],
    target: "pwa",
    account: "authuser",
    existingWindow: "navigate",
    builtin: true,
    enabled: true,
  },
  {
    id: "slides",
    name: "Google Slides",
    match: ["https://docs.google.com/presentation/*"],
    target: "pwa",
    account: "authuser",
    existingWindow: "navigate",
    builtin: true,
    enabled: true,
  },
  {
    id: "chat",
    name: "Google Chat",
    match: ["https://chat.google.com/*"],
    target: "pwa",
    account: "authuser",
    existingWindow: "navigate",
    builtin: true,
    enabled: true,
  },
];

/** "https://meet.google.com/*" -> RegExp. `*` is the only wildcard. */
function patternToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .split("*")
    .map((chunk) => chunk.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${escaped}$`);
}

export function matchesPattern(url: string, patterns: string[]): boolean {
  return patterns.some((p) => patternToRegExp(p).test(url));
}

/** First enabled rule (in list order) whose patterns match the URL. */
export function findMatchingRule(url: string, rules: Rule[]): Rule | undefined {
  return rules.find((rule) => rule.enabled && matchesPattern(url, rule.match));
}
