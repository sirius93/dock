<div align="center">
  <img src="icons/icon128.png" width="120" height="120" alt="Dock's otter-doctor mascot" />

  # Dock

  **Every web-app link, in the right window, for the right account.**

  [![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Add%20to%20Chrome-4285F4)](https://chromewebstore.google.com/detail/bplpcnlojimklccelhknjjipbjhaflgi)
  ![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
  ![Manifest V3](https://img.shields.io/badge/manifest-v3-informational)
</div>

---

Clicking a Meet link in Gmail, Calendar, or Slack usually opens a new browser
tab instead of the Meet PWA you already have installed. After a day of that
you've got duplicate Gmail tabs, stray Meet tabs, and PWA windows you can't
tell apart — and it gets worse the moment you have more than one Google
account.

Dock is a Chrome extension that fixes this without replacing your browser.
It catches matching links and routes them into the right already-installed
PWA window, for the right account, and gives you one shortcut to jump to any
app window instantly. **It makes no network requests** — nothing it does
ever leaves your device.

See [`Dock — v1 Spec Web App Link Router & Switcher.md`](<Dock — v1 Spec Web App Link Router & Switcher.md>)
for the full product spec this implements.

## Features

- **Link routing** — a Gmail, Meet, Calendar, Drive, Docs, Sheets, Slides, or
  Chat link opens (or focuses) the matching PWA window instead of a new tab.
  Holding Shift bypasses it for that one click.
- **Account awareness** — routes to the window for the account the link
  actually names (`authuser=`, `/u/N/`, or a stored mapping), and keeps a
  window's identity correct even when you switch accounts from inside the
  PWA itself, reusing an already-open window for that account instead of
  spawning a duplicate.
- **Switcher** (`Ctrl/Cmd+Shift+Space`) — a fuzzy-searchable popup listing
  every app window, grouped by account with an open-window count per login,
  live calls surfaced first, one-click close per window or per account.
- **Account colour tags** — each login gets an automatically assigned,
  editable colour, shown as a toolbar badge and in the switcher.
- **Custom rules** — add your own app (Figma, Notion, anything) with a match
  pattern, target behaviour, and account strategy. Built-in Google Workspace
  rules can be disabled but not deleted. Import/export rules as JSON.

## Status

Early. The core routing flow (rules engine, account extraction, the
navigate/focus/open-new decision, the switcher) is implemented and unit
tested. A few things the spec calls out as "spike first" are implemented but
**not yet verified against real installed PWAs** — see
[CONTRIBUTING.md](CONTRIBUTING.md#whats-most-useful-right-now) for exactly
what's unverified and how to help. Not built yet: onboarding screens, the
favicon overlay, end-to-end tests.

## Install

**[Add to Chrome](https://chromewebstore.google.com/detail/bplpcnlojimklccelhknjjipbjhaflgi)**
— Dock is live on the Chrome Web Store.

Prefer to build it yourself, or want the current `main` instead of the
published version?

```
git clone https://github.com/sirius93/dock.git
cd dock
npm install
npm run build
```

Then `chrome://extensions` → enable Developer Mode → **Load unpacked** →
select the `dist/` folder that `npm run build` produced. `npm run watch`
rebuilds the JS on save.

## Usage

1. Install the Google apps you use as PWAs (the install icon in Chrome's
   address bar, or `chrome://apps`).
2. Click any matching link — it lands in the existing PWA window, or opens
   the PWA if none is open, instead of a new tab.
3. `Ctrl/Cmd+Shift+Space` opens the switcher: type to fuzzy-search app,
   account, or tab title; Enter focuses; `Ctrl+W` or the row's ✕ closes it.
4. Add your own apps, edit account colours, and toggle behaviour (toasts,
   Shift-bypass) from the extension's Settings page.

## Privacy

Dock keeps rules, account colours, and its in-memory window registry —
nothing about your browsing history, and no network requests, ever. One
small content script runs on Google Workspace pages (and any domain you add
a custom rule for) so Shift-click can bypass routing for that one click; it
reads only the clicked link's href and the Shift key state, nothing else
from the page. See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for the full
detail, and the spec's **Privacy and security** section for the original
design intent (the favicon overlay it describes isn't built yet).

## Architecture

Manifest V3, one service worker, no build framework beyond esbuild. Routing
logic is written as pure, tested functions (`src/rules.ts`, `src/accounts.ts`,
`src/router-logic.ts`) separate from the thin `chrome.*`-calling layer that
wires them to real events (`src/router.ts`, `src/registry.ts`). See
[CONTRIBUTING.md](CONTRIBUTING.md#where-things-live) for the full file map.

## Contributing

PRs and bug reports welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for
setup, conventions, and what's most useful to work on right now.

## License

[MIT](LICENSE) © Nandan Kumar
