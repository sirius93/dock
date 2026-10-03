# Chrome Web Store listing content

Draft copy for the Chrome Web Store Developer Dashboard listing. This is a
Chrome extension, so it publishes through the **Chrome Web Store**
(chrome.google.com/webstore/devconsole), not the Google Play Store — Play is
for Android/ChromeOS apps, which this isn't.

Everything here is draft content to paste in and adjust, not a filed
submission. The **Privacy practices** section in particular is something
Google has you certify as accurate — read it against the current code before
submitting, don't just paste it blind.

This copy was checked against what Chrome Web Store review actually looks at
(manifest/permission audit, description-vs-code accuracy, privacy policy
requirement) — see **Known limitations** at the bottom for what's still
worth knowing before you submit.

**Rejection history**: rejected twice for keyword spam, same violation ref
("Yellow Argon") both times.

1. First pass: the description named the full app list ("Gmail, Meet,
   Calendar, Drive, Docs, Sheets, Slides, or Chat") twice — once in the
   opening sentence, again in the feature bullets. Fix: cut it from the
   opening sentence, kept it once in the bullets.
2. Second pass: **rejected again, flagging that same single remaining
   list.** So the trigger isn't duplication — a single comma-separated run
   of 8 trademarked product names reads as a keyword list to Google's
   reviewer regardless of how many times it appears or how naturally it's
   worded into a sentence.

Fixed by removing every enumerated app-name list from the description —
not just deduplicating. "Google Workspace" now appears as a single umbrella
term (twice, each a plain sentence, never followed by a comma-list), and
the one place a reader actually needs the full list — Settings — is shown
in the screenshots instead of spelled out in text. If you're tempted to add
`Gmail, Meet, Calendar, ...` back into the description for clarity, don't —
point to the screenshot or to Settings instead.

## Store listing tab

**Title**
```
Dock — Link Router & Switcher
```

**Summary** (short description, shown in search results — 105/132 characters)
```
Every web-app link, in the right window, for the right account. No stray tabs. No network requests, ever.
```

**Category**: Productivity
**Language**: English (United States)

**Detailed description**
```
Dock sends every matching work-app link to the window it actually belongs
in — the installed PWA, for the right account — instead of leaving a stray
browser tab.

THE PROBLEM

Clicking a video-call link from your inbox or calendar usually opens a new
browser tab instead of the app you already have installed. After a day of
that you've got duplicate inbox tabs, stray call tabs, and app windows you
can't tell apart. It gets worse the moment you have more than one account
signed in.

WHAT DOCK DOES

• Routes matching links into the existing app window, or opens the installed
  PWA if none is open — no more stray tabs.
• Reads the account a link actually names (authuser, /u/N/, or a saved
  mapping) and routes to that account's window — even when you switch
  accounts from inside the PWA itself, Dock reuses the window that's already
  open for that account instead of spawning a duplicate.
• One shortcut (Ctrl/Cmd+Shift+Space) opens a fuzzy-searchable switcher
  listing every app window, grouped by login with an open-window count per
  account, live calls surfaced first.
• Close any single window with one click, or an entire account's windows at
  once.
• Each login gets its own colour, shown as a toolbar badge and throughout the
  switcher.
• Built-in rules cover the Google Workspace apps you already use — see the
  full list in Settings. Add your own for anything else: Figma, Notion,
  whatever you use as a PWA.
• Hold Shift while clicking a link on a supported page to open it as a
  normal tab instead, just that once.

PRIVACY

Dock makes no network requests — nothing it does ever leaves your device.
The only data it keeps is your rules, your account colours, and a list of
currently open app windows, stored locally in Chrome's own storage. The one
content script it runs (so Shift-click can bypass routing on Workspace
pages) reads nothing from the page beyond which link you clicked.

Dock doesn't replace your browser, doesn't require an account, and doesn't
talk to any server. It's a small tool that fixes one specific annoyance:
links that should open where you already have the app open, opening
somewhere else instead.

Source code: https://github.com/sirius93/dock
Privacy policy: https://nandan.dev/dock/privacy.html
```

**Screenshots** (`screenshots/`, 1280×800, generated with `npm run build && node scripts/make-screenshots.mjs`)
1. `01-switcher.png` — the switcher, grouped by account with open-window counts and a live call.
2. `02-settings.png` — built-in + custom rules and account colours in Settings.
3. `03-value-prop.png` — the before/after: stray tabs vs. one correctly-routed window.

**Icon**: `icons/icon128.png` (the store wants a 128×128 PNG; this is the same one in the extension).

**Support URL**
```
https://nandan.dev/dock/support.html
```
Real troubleshooting entries grounded in current known gaps (wrong-account
routing, the Workspace-only Shift-bypass limit, etc.), not a generic
template — and the only channel it points to is GitHub issues, since that's
the only one that actually exists.

## Privacy practices tab

**Privacy policy URL**
```
https://nandan.dev/dock/privacy.html
```
(Falls back to
`https://github.com/sirius93/dock/blob/main/PRIVACY_POLICY.md` — the same
content, kept in sync by hand — if the site isn't deployed yet when you
submit.)

Required here even though Dock stores everything locally: Chrome's Developer
Program Policy treats an account email — which Dock resolves and displays in
its own UI (the switcher, Settings) — as personal data regardless of whether
it's transmitted anywhere. "We don't send it anywhere" doesn't exempt you
from posting a policy; it just means the policy is short.

**Single purpose description**
```
Routes links to Google Workspace (and user-added) web apps into the correct
already-installed PWA window for the correct account, instead of opening a
new browser tab.
```

**Permission justifications**

| Permission | Justification |
| --- | --- |
| `tabs` | Reads the URL and title of newly opened or navigating tabs to check them against routing rules, and to focus, navigate, or close the matched tab/window. |
| `webNavigation` | Catches links opened in a new tab from another window (`onCreatedNavigationTarget`) before the stray tab finishes loading, so it can be routed and closed without a visible flash. |
| `management` | Detects which Google Workspace (or user-added) apps are installed as PWAs (`chrome.management.getAll`) and launches the correct one (`chrome.management.launchApp`) when no matching window is already open. |
| `storage` | Saves the user's rules, account colours, and settings locally via `chrome.storage.local`. Nothing is synced or sent off-device. |
| `notifications` | Shows the "Opened in \<app\>" toast after routing a link, and the one-time "Install this app?" prompt when a matching link arrives but the PWA isn't installed yet. |
| Host permission `*://*.google.com/*` | Lets the built-in rules match and act on Google Workspace URLs without a runtime prompt, since every user gets these rules by default — see Settings for the full list of covered apps. |
| Optional host permission `*://*/*` | Requested at runtime, only when a user adds a custom rule for a domain Dock doesn't already have access to (e.g. figma.com) — never granted upfront. |

**Data usage disclosures** (the "Does your extension collect or use..." checklist)

Two need a real answer, not a reflexive "No":

- **Personally identifiable information**: technically **Yes** — Dock
  resolves and displays an account's email (read from a tab's title, e.g.
  Gmail's) in its own switcher/Settings UI, and may store an email→account
  mapping locally if you configure one. Check "Yes" and describe it as: used
  only to label which window belongs to which login, stored locally, never
  transmitted, not shared or sold. This is exactly why the privacy policy
  above exists — don't check "No" here just because nothing leaves the
  device, that's a different question than whether PII is collected/used.
- **Web history**: Dock reads a tab's URL and title to check them against
  routing rules, but doesn't persist, transmit, or otherwise retain that —
  it's held in an in-memory registry cleared when the browser closes.
  Whether that counts as "using web history" depends on the Chrome Web
  Store form's current wording (it's changed before); read the question as
  shown, don't assume based on this doc.
- Health info, financial info, authentication info, personal communications,
  location: **No** — Dock never reads page content, only a tab's URL and
  title.

**Remote code**: No — the manifest's CSP is `script-src 'self'; object-src 'self'` and there's no remote-code execution anywhere.

## Known limitations

What was wrong in an earlier pass of this doc, fixed as of this one:

- The routing toast's **Undo** button now works (reopens the link as a plain
  tab, bypassing routing for that one tab).
- The **"Shift-click bypasses routing"** Settings toggle now actually gates
  the behaviour, instead of bypass always being on regardless of it.
- Custom rules (Settings → Apps and rules → Add rule, and JSON import) now
  request the needed host permission at add-time via
  `chrome.permissions.request`, instead of silently never working for any
  domain outside `*.google.com` — `optional_host_permissions: ["*://*/*"]`
  in the manifest was previously declared but never actually requested
  anywhere in the code, which is both a Web Store review flag (an unused
  declared permission) and, more importantly, meant the custom-rules feature
  this listing describes didn't work at all for a non-Google domain.
- The non-functional **favicon overlay** Settings checkbox has been removed
  rather than shipped as dead UI. It's still a real spec feature, just not
  built — if it comes back, it needs its own content-script implementation
  and its own permission story (favicon overlay was never covered by a
  manifest permission in the first place, since it hadn't been built).

Still true:

- **Shift-click bypass only works on Google Workspace pages** (and any
  domain you've added a custom rule for *and* separately granted a content
  script to — which Dock doesn't currently request). Granting host
  permission via `chrome.permissions.request` lets Dock's background worker
  read/act on tabs for that domain; it does **not** extend the static
  `content_scripts` match list in `manifest.json`, so Shift-bypass stays
  Google-only unless that's built out with `chrome.scripting.registerContentScripts`.
  The description above scopes the Shift-bypass claim to Workspace links for
  this reason.
- See `README.md`'s **Status** section — the PWA-detection and launch-flash
  spike risks are implemented but not yet verified against real installed
  PWAs. That matters more for your own confidence before shipping than for
  the listing copy, but a rejected PWA-detection assumption would mean the
  core feature doesn't work, so verify it first.
- The privacy policy exists in two places — `PRIVACY_POLICY.md` and
  `site/privacy.html` — kept in sync by hand, not generated from one source.
  If you edit what Dock collects, update both.
