# Store listing assets

Chrome Web Store copy and screenshots.

- `listing.md` — all the text content (title, summary, description,
  permission justifications, privacy disclosures) to paste into the
  Developer Dashboard.
- `screenshots/` — generated 1280×800 PNGs, regenerate with:
  ```
  node scripts/make-screenshots.mjs
  ```
  (needs Chrome installed locally; set `CHROME_PATH` if it's not at the
  default macOS install location).
- `templates/` — the HTML/CSS scenes the screenshots are rendered from.
  `mock-popup.html` and `mock-options.html` are standalone copies of the real
  popup/options pages with hardcoded sample data in place of the live
  `chrome.*` calls (which don't exist outside the extension), loaded into the
  scenes via `<iframe>` so the real `popup.css`/`options.css` apply exactly
  as they do in the extension. `scene.css` is the shared background/headline
  styling. If you change `popup.css`, `options.css`, or the mascot icon,
  rerun the screenshot script to pick it up — nothing here is wired to
  rebuild automatically.
