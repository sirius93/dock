# Landing page

Static site for `nandan.dev/dock` — plain HTML/CSS, no build step, no JS
beyond native anchor scrolling.

- `index.html` — the landing page.
- `privacy.html` — the privacy policy, rendered to match the site (same
  content as `../PRIVACY_POLICY.md`, kept in sync by hand — see
  `store-listing/listing.md`'s **Known limitations**).
- `support.html` — troubleshooting FAQ and bug-report instructions. The
  entries are real current gaps (see `CONTRIBUTING.md` and
  `store-listing/listing.md`'s **Known limitations**) — update this if those
  change, it'll go stale otherwise.
- `styles.css` — shared styles for all three pages.
- `images/` — mascot icon and the three Chrome Web Store screenshots,
  copied in (not referenced via `../`) so this folder is self-contained and
  deployable on its own. Rerun after regenerating either:
  ```
  node scripts/sync-site-assets.mjs
  ```
  (from the repo root — it uses paths relative to there).

## Deploying

Upload this folder's contents as-is to whatever serves `nandan.dev/dock` —
no build step. If that's a subpath route rather than a static file host,
make sure `/dock/privacy.html` and `/dock/support.html` resolve too, not
just `/dock/`.
