# Dock Privacy Policy

_Last updated: 2026-10-08_

Dock is a Chrome extension that routes web-app links to the right installed
PWA window and account. This policy covers what it does and doesn't do with
your data.

This covers two different things, with two different privacy stories:

- **The extension** (everything below the next section) makes no network
  requests at all.
- **The website** (nandan.dev/dock — not the extension) uses Google
  Analytics and Hotjar to see how many people visit and how they use it:
  page views, approximate location from IP, device/browser type, and
  session recordings/heatmaps of on-page behaviour. That's standard website
  analytics, unrelated to anything the installed extension does — the
  extension itself never loads these or any other script from a server.
  See [Google's](https://www.google.com/policies/privacy/) and
  [Hotjar's](https://www.hotjar.com/legal/policies/privacy/) privacy
  policies for what they each collect.

## The extension makes no network requests

Dock does not contact any server, ever. It has no backend, no analytics, no
crash reporting, no update-check beyond Chrome's own extension auto-update.
Nothing the extension does ever leaves your device.

## What Dock stores, and where

All of it stays in `chrome.storage.local` — Chrome's own local storage for
the extension, on your device, never synced to a Google account or anywhere
else:

- **Routing rules** you've added or disabled (app name, URL match pattern,
  target behaviour).
- **Account colours**, keyed by the Google `authuser` index (e.g. `0`, `1`) —
  not by raw email, though Dock resolves that index to the account's email
  for display in the extension's own UI (the switcher and Settings page).
  That resolved email is read from the page title of a tab you already have
  open (e.g. Gmail's tab title includes it) — Dock doesn't ask you to type it
  in or sign in anywhere.
- **A saved email-to-account-index mapping**, if you've configured one, used
  to resolve which account a link belongs to when the URL itself doesn't say.
- **A short-lived, in-memory list of your currently open app windows** (which
  app, which account, the window/tab id, the tab's title) — rebuilt from
  `chrome.windows`/`chrome.tabs` each time the extension's background worker
  starts, and gone when you close Chrome. This is never written to disk.

None of this is browsing history in the usual sense: Dock doesn't log which
sites you visit, doesn't keep a history of past links, and doesn't retain
anything about a tab once it's closed and the window registry drops it.

## What Dock reads, and why

- **Tab URL and title** (`tabs` permission) — to check an incoming link
  against your routing rules, and to show it in the switcher.
- **New-tab navigation events** (`webNavigation` permission) — to catch a
  link opened in a new tab from another window before it finishes loading.
- **Installed apps** (`management` permission) — to find the PWA a rule
  should route into, and launch it.
- **Shift-click state on links** — one small content script runs on Google
  Workspace pages (and any domain you add a custom rule for) that listens for
  a Shift+click on a link and reports only that link's href and the fact
  Shift was held, so routing can be skipped for that one click. It reads
  nothing else from the page: no page content, no form data, no cookies.

## Who can see this data

Nobody but you. It's stored locally, there's no account, no sync, and no
server for it to reach even if Dock tried to send it somewhere.

## Changes to this policy

If what Dock collects or does changes, this file changes with it — it's
version-controlled in the same repository as the code, so the history of
this file is the history of this policy.

## Contact

Open an issue at <https://github.com/sirius93/dock/issues>.
