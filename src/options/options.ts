import { BUILTIN_RULES } from "../rules";
import { activeRules, loadSettings, saveSettings, type DockSettings } from "../storage";
import { Registry } from "../registry";
import { accountLabel } from "../display";
import type { Rule } from "../types";

let settings: DockSettings;
// settings.colours is keyed by the authuser index ("0", "1", ...) because
// that's what routing needs; this maps that raw key to a human label
// (an email, when some open window's title exposes one) for display only.
let labelForAccountKey: Record<string, string> = {};

async function init(): Promise<void> {
  settings = await loadSettings();
  await resolveAccountLabels();
  renderBuiltinRules();
  renderCustomRules();
  renderColours();
  renderBehaviour();
}

async function resolveAccountLabels(): Promise<void> {
  const registry = new Registry();
  await registry.rebuild(activeRules(settings), settings.emailToIndex);
  labelForAccountKey = {};
  for (const w of registry.all()) {
    if (!w.account) continue;
    const label = accountLabel(w.account, w.title);
    const current = labelForAccountKey[w.account];
    if (label && (!current || label.includes("@"))) {
      labelForAccountKey[w.account] = label;
    }
  }
}

function renderBuiltinRules(): void {
  const table = document.getElementById("builtin-rules") as HTMLTableElement;
  table.innerHTML = "";
  for (const rule of BUILTIN_RULES) {
    const row = document.createElement("tr");
    const enabled = !settings.disabledBuiltins.includes(rule.id);

    const nameCell = document.createElement("td");
    nameCell.textContent = rule.name;

    const toggleCell = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = enabled;
    checkbox.addEventListener("change", () => void toggleBuiltin(rule.id, checkbox.checked));
    toggleCell.appendChild(checkbox);

    row.append(nameCell, toggleCell);
    table.appendChild(row);
  }
}

async function toggleBuiltin(ruleId: string, enabled: boolean): Promise<void> {
  const disabledBuiltins = enabled
    ? settings.disabledBuiltins.filter((id) => id !== ruleId)
    : [...settings.disabledBuiltins, ruleId];
  settings = { ...settings, disabledBuiltins };
  await saveSettings({ disabledBuiltins });
}

function renderCustomRules(): void {
  const table = document.getElementById("custom-rules") as HTMLTableElement;
  table.innerHTML = "";
  for (const rule of settings.customRules) {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = rule.name;

    const matchCell = document.createElement("td");
    matchCell.textContent = rule.match.join(", ");

    const deleteCell = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => void deleteCustomRule(rule.id));
    deleteCell.appendChild(deleteBtn);

    row.append(nameCell, matchCell, deleteCell);
    table.appendChild(row);
  }
}

async function deleteCustomRule(ruleId: string): Promise<void> {
  const customRules = settings.customRules.filter((r) => r.id !== ruleId);
  settings = { ...settings, customRules };
  await saveSettings({ customRules });
  renderCustomRules();
}

document.getElementById("add-rule")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = (document.getElementById("rule-name") as HTMLInputElement).value.trim();
  const match = (document.getElementById("rule-match") as HTMLInputElement).value.trim();
  const target = (document.getElementById("rule-target") as HTMLSelectElement).value as Rule["target"];
  const existingWindow = (document.getElementById("rule-existing") as HTMLSelectElement)
    .value as Rule["existingWindow"];
  if (!name || !match) return;

  const rule: Rule = {
    id: `custom-${Date.now()}`,
    name,
    match: [match],
    target,
    account: "authuser",
    existingWindow,
    enabled: true,
  };
  void addCustomRule(rule);
  (e.target as HTMLFormElement).reset();
});

async function addCustomRule(rule: Rule): Promise<void> {
  const customRules = [...settings.customRules, rule];
  settings = { ...settings, customRules };
  await saveSettings({ customRules });
  renderCustomRules();
}

document.getElementById("export")?.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(settings.customRules, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dock-rules.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("import")?.addEventListener("click", () => {
  (document.getElementById("import-file") as HTMLInputElement).click();
});

document.getElementById("import-file")?.addEventListener("change", async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const text = await file.text();
  try {
    const imported = JSON.parse(text) as Rule[];
    const byId = new Map(settings.customRules.map((r) => [r.id, r]));
    for (const rule of imported) byId.set(rule.id, rule);
    const customRules = [...byId.values()];
    settings = { ...settings, customRules };
    await saveSettings({ customRules });
    renderCustomRules();
  } catch {
    alert("That file isn't valid Dock rules JSON.");
  }
});

function renderColours(): void {
  const table = document.getElementById("colours") as HTMLTableElement;
  table.innerHTML = "";
  for (const [accountKey, colour] of Object.entries(settings.colours)) {
    const row = document.createElement("tr");

    const labelCell = document.createElement("td");
    labelCell.textContent = labelForAccountKey[accountKey] ?? `Account ${accountKey}`;

    const colourCell = document.createElement("td");
    const input = document.createElement("input");
    input.type = "color";
    input.value = colour;
    input.addEventListener("change", () => void setColour(accountKey, input.value));
    colourCell.appendChild(input);

    row.append(labelCell, colourCell);
    table.appendChild(row);
  }
}

async function setColour(accountKey: string, colour: string): Promise<void> {
  const colours = { ...settings.colours, [accountKey]: colour };
  settings = { ...settings, colours };
  await saveSettings({ colours });
}

function renderBehaviour(): void {
  const toasts = document.getElementById("toasts") as HTMLInputElement;
  const favicon = document.getElementById("favicon") as HTMLInputElement;
  const shiftBypass = document.getElementById("shift-bypass") as HTMLInputElement;

  toasts.checked = settings.toastsEnabled;
  favicon.checked = settings.faviconOverlayEnabled;
  shiftBypass.checked = settings.shiftBypassEnabled;

  toasts.addEventListener("change", () => void saveSettings({ toastsEnabled: toasts.checked }));
  favicon.addEventListener("change", () =>
    void saveSettings({ faviconOverlayEnabled: favicon.checked }),
  );
  shiftBypass.addEventListener("change", () =>
    void saveSettings({ shiftBypassEnabled: shiftBypass.checked }),
  );
}

void init();
