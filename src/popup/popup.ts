import { Registry } from "../registry";
import { activeRules, loadSettings, type DockSettings } from "../storage";
import { fuzzyMatch } from "../fuzzy";
import { accountLabel, cleanWindowTitle } from "../display";
import type { AppWindow } from "../types";

type ScoredWindow = AppWindow & { score: number };

interface AccountGroup {
  account: string | null;
  label: string;
  rows: ScoredWindow[];
  hasCall: boolean;
  mostRecent: number;
}

const registry = new Registry();
let settings: DockSettings;
let ruleNames: Record<string, string> = {};

const listEl = document.getElementById("list") as HTMLDivElement;
const searchEl = document.getElementById("search") as HTMLInputElement;

async function init(): Promise<void> {
  settings = await loadSettings();
  ruleNames = Object.fromEntries(activeRules(settings).map((r) => [r.id, r.name]));
  await registry.rebuild(activeRules(settings), settings.emailToIndex);
  render("");
}

searchEl.addEventListener("input", () => render(searchEl.value));
searchEl.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    listEl.querySelector<HTMLElement>(".row")?.focus();
  } else if (e.key === "Enter") {
    const first = listEl.querySelector<HTMLElement>(".row");
    if (first) void focusRow(first);
  }
});

document.getElementById("tidy")?.addEventListener("click", () => void tidy());
document.getElementById("pause")?.addEventListener("click", () => void pause());
document.getElementById("settings")?.addEventListener("click", () => chrome.runtime.openOptionsPage());

function render(query: string): void {
  const rows: ScoredWindow[] = [];
  for (const w of registry.all()) {
    const appName = ruleNames[w.app] ?? w.app;
    const score = query ? fuzzyMatch(query, appName, w.account ?? "", w.title) : 0;
    if (query && score === null) continue;
    rows.push({ ...w, score: score ?? 0 });
  }

  listEl.innerHTML = "";
  if (rows.length === 0) {
    listEl.innerHTML = `<div class="empty">No app windows open</div>`;
    return;
  }

  for (const group of groupByAccount(rows, query)) {
    listEl.appendChild(renderAccountHeader(group));
    for (const row of group.rows) listEl.appendChild(renderRow(row));
  }
}

/** Groups by login so it's obvious how many app windows each account has open, calls first. */
function groupByAccount(rows: ScoredWindow[], query: string): AccountGroup[] {
  const groups = new Map<string, AccountGroup>();
  for (const row of rows) {
    const key = row.account ?? "";
    let group = groups.get(key);
    if (!group) {
      group = {
        account: row.account,
        label: accountLabel(row.account, row.title) ?? "No account",
        rows: [],
        hasCall: false,
        mostRecent: 0,
      };
      groups.set(key, group);
    }
    group.rows.push(row);
    if (row.inCall) group.hasCall = true;
    group.mostRecent = Math.max(group.mostRecent, row.lastFocused);

    // Different apps often show the account at different authuser indices
    // for the same login (a Google quirk), but whichever window's title
    // does expose the real email is more useful to show than "Account N".
    const candidate = accountLabel(row.account, row.title);
    if (candidate?.includes("@")) group.label = candidate;
  }

  for (const group of groups.values()) {
    group.rows.sort((a, b) => {
      if (a.inCall !== b.inCall) return a.inCall ? -1 : 1;
      if (query && a.score !== b.score) return b.score - a.score;
      return b.lastFocused - a.lastFocused;
    });
  }

  return [...groups.values()].sort((a, b) => {
    if (a.hasCall !== b.hasCall) return a.hasCall ? -1 : 1;
    return b.mostRecent - a.mostRecent;
  });
}

function renderAccountHeader(group: AccountGroup): HTMLElement {
  const el = document.createElement("div");
  el.className = "account-header";
  el.setAttribute("role", "presentation");

  const chip = document.createElement("span");
  chip.className = "chip";
  chip.style.background = (group.account && settings.colours[group.account]) || "#999";

  const label = document.createElement("span");
  label.className = "account-label";
  label.textContent = group.label;

  const count = document.createElement("span");
  count.className = "count";
  count.textContent = `${group.rows.length} open`;

  el.append(chip, label, count);

  if (group.rows.length > 1) {
    const closeAll = document.createElement("button");
    closeAll.type = "button";
    closeAll.className = "close-all";
    closeAll.textContent = "Close all";
    closeAll.addEventListener("click", () => void closeGroup(group));
    el.append(closeAll);
  }

  return el;
}

function renderRow(row: ScoredWindow): HTMLElement {
  const el = document.createElement("div");
  el.className = "row";
  el.tabIndex = 0;
  el.setAttribute("role", "option");
  el.dataset.windowId = String(row.windowId);
  el.dataset.tabId = String(row.tabId);

  const appName = ruleNames[row.app] ?? row.app;
  const app = document.createElement("span");
  app.className = "app";
  app.textContent = appName;

  const title = document.createElement("span");
  title.className = "title";
  title.textContent = cleanWindowTitle(row.title);

  el.append(app, title);

  if (row.inCall) {
    const live = document.createElement("span");
    live.className = "live";
    live.textContent = "LIVE";
    el.append(live);
  }

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "close-btn";
  closeBtn.textContent = "✕";
  closeBtn.setAttribute("aria-label", `Close ${appName}`);
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    void closeRow(el);
  });
  el.append(closeBtn);

  el.addEventListener("click", () => void focusRow(el));
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") void focusRow(el);
    else if (e.key.toLowerCase() === "w" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void closeRow(el);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusRowBy(el, 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusRowBy(el, -1);
    }
  });

  return el;
}

/** Account headers sit between rows, so keyboard nav walks the `.row` list, not raw DOM siblings. */
function focusRowBy(from: HTMLElement, offset: number): void {
  const allRows = Array.from(listEl.querySelectorAll<HTMLElement>(".row"));
  const target = allRows[allRows.indexOf(from) + offset];
  if (target) target.focus();
  else if (offset < 0) searchEl.focus();
}

async function focusRow(el: HTMLElement): Promise<void> {
  const windowId = Number(el.dataset.windowId);
  const tabId = Number(el.dataset.tabId);
  await chrome.windows.update(windowId, { focused: true });
  await chrome.tabs.update(tabId, { active: true });
  window.close();
}

async function closeRow(el: HTMLElement): Promise<void> {
  const tabId = Number(el.dataset.tabId);
  await chrome.tabs.remove(tabId).catch(() => {});
  registry.removeByTabId(tabId);
  render(searchEl.value);
}

async function closeGroup(group: AccountGroup): Promise<void> {
  for (const row of group.rows) {
    await chrome.tabs.remove(row.tabId).catch(() => {});
    registry.removeByTabId(row.tabId);
  }
  render(searchEl.value);
}

async function tidy(): Promise<void> {
  const byApp = new Map<string, AppWindow[]>();
  for (const w of registry.all()) {
    const list = byApp.get(w.app) ?? [];
    list.push(w);
    byApp.set(w.app, list);
  }
  for (const wins of byApp.values()) {
    if (wins.length < 2) continue;
    wins.sort((a, b) => b.lastFocused - a.lastFocused);
    for (const dup of wins.slice(1)) {
      await chrome.tabs.remove(dup.tabId).catch(() => {});
    }
  }
  await registry.rebuild(activeRules(settings), settings.emailToIndex);
  render(searchEl.value);
}

async function pause(): Promise<void> {
  await chrome.storage.local.set({ pausedUntil: Date.now() + 60 * 60 * 1000 });
  window.close();
}

void init();
