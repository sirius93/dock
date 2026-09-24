export interface Rule {
  id: string;
  name: string;
  match: string[];
  target: "pwa" | "tab";
  account: "authuser" | "none";
  existingWindow: "navigate" | "focus";
  protectActiveCall?: boolean;
  builtin?: boolean;
  enabled: boolean;
}

export interface AppWindow {
  windowId: number;
  tabId: number;
  app: string;
  account: string | null;
  url: string;
  title: string;
  lastFocused: number;
  inCall: boolean;
}
