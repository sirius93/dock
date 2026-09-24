import type { Rule } from "./types";
import { BUILTIN_RULES } from "./rules";

export interface DockSettings {
  customRules: Rule[];
  disabledBuiltins: string[];
  emailToIndex: Record<string, string>;
  colours: Record<string, string>;
  pausedUntil: number | null; // epoch ms, or null = not paused
  toastsEnabled: boolean;
  faviconOverlayEnabled: boolean;
  shiftBypassEnabled: boolean;
}

const DEFAULTS: DockSettings = {
  customRules: [],
  disabledBuiltins: [],
  emailToIndex: {},
  colours: {},
  pausedUntil: null,
  toastsEnabled: true,
  faviconOverlayEnabled: false,
  shiftBypassEnabled: true,
};

export async function loadSettings(): Promise<DockSettings> {
  const stored = await chrome.storage.local.get(DEFAULTS);
  return stored as DockSettings;
}

export async function saveSettings(patch: Partial<DockSettings>): Promise<void> {
  await chrome.storage.local.set(patch);
}

/** All active rules: built-ins (minus disabled) followed by custom rules, in that priority order. */
export function activeRules(settings: DockSettings): Rule[] {
  const builtins = BUILTIN_RULES.map((rule) => ({
    ...rule,
    enabled: !settings.disabledBuiltins.includes(rule.id),
  }));
  return [...builtins, ...settings.customRules];
}

export function isPaused(settings: DockSettings): boolean {
  return settings.pausedUntil !== null && settings.pausedUntil > Date.now();
}
