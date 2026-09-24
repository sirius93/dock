<div align="center">
  <img src="icons/icon128.png" width="96" height="96" alt="Dock's otter-doctor mascot" />
</div>

# Contributing to Dock

Thanks for taking a look. Dock is a small project and this guide is meant to
get you from clone to a useful PR without much ceremony.

## Setup

```
git clone https://github.com/sirius93/dock.git
cd dock
npm install
npm run build   # produces the loadable extension in dist/
npm test
```

Load it in Chrome: `chrome://extensions` → enable Developer Mode → **Load
unpacked** → select `dist/`. `npm run watch` rebuilds the TypeScript on save
(reload the extension in `chrome://extensions` to pick up changes); rerun
`npm run build` if you touch `manifest.json`, `icons/`, or the popup/options
HTML/CSS, since watch mode only copies those once.

## Before opening a PR

```
npm test
npx tsc --noEmit
npm run build
```

All three should be clean. There's no CI configured yet, so this is the only
check your PR gets before review — please don't skip it.

## Where things live

- `src/rules.ts`, `src/accounts.ts`, `src/router-logic.ts`, `src/fuzzy.ts`,
  `src/display.ts`, `src/colours.ts` — pure logic, no `chrome.*` calls. This is
  where most of the actual behavior lives and where tests belong.
- `src/registry.ts`, `src/router.ts`, `src/pwa.ts` — the Chrome-facing layer
  that wires the pure logic to `chrome.tabs` / `chrome.windows` /
  `chrome.management` events. Keep this layer thin: if a decision can be
  expressed as a pure function, put it in `router-logic.ts` (or similar) and
  call it from here, rather than burying a branch inside an event handler.
- `src/popup/`, `src/options/` — the switcher and settings UI.
- `tests/` — Vitest, one file per module in `src/`.

See `README.md` for the full architecture and the spec doc
(`Dock — v1 Spec Web App Link Router & Switcher.md`) for the product intent
behind it.

## What's most useful right now

Dock is early — the core routing flow works, but a few things the spec flags
as "spike first" are implemented and unit-tested against fakes, **not yet
verified against real installed PWAs**:

- Does an installed PWA window actually show up as `windowType: "app"` in
  `chrome.windows.getAll`, and can its tab be navigated with
  `chrome.tabs.update`?
- Does `findPwaForRule` (`src/pwa.ts`) actually match installed Google
  Workspace PWAs via `homepageUrl`, or does `chrome.management` report
  something different?
- How much visible flash does `launchPwaAtUrl` produce between launching the
  app and navigating its tab?

If you install Dock, use it for real, and hit one of these, a bug report with
what you saw (or a PR with a fix) is the highest-leverage contribution right
now — more so than new features.

## Style

- No new dependency for something a few lines of TypeScript, the stdlib, or
  an already-installed package can do. `scripts/make-icons.mjs` (hand-rolled
  PNG encoding via `node:zlib`) is the extreme version of this; you don't need
  to go that far, but reach for `npm install` last, not first.
- Prefer a pure, tested function over logic embedded in an event handler.
- Keep changes scoped to what the PR is about — no drive-by refactors mixed
  into a bug fix.
- No code comments explaining *what* the code does; a comment is for a *why*
  that isn't obvious from reading it (a workaround, an edge case from a real
  bug, a constraint from a Chrome API quirk).

## Reporting bugs

Include: the Chrome version, whether the app in question is installed as a
PWA, the URL pattern that misrouted (or didn't route), and what you expected
to happen instead. For anything account-related, mention how many Google
accounts you have signed in and which one hit the issue.

## License

By contributing, you agree your contribution is licensed under the project's
[MIT license](LICENSE).
