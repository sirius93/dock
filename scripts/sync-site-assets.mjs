// Copies the mascot icon and store-listing screenshots into site/images/ so
// the site is a self-contained folder deployable on its own (no reaching
// outside site/ via ../ once it's hosted at nandan.dev/dock, which won't
// have the rest of the repo alongside it). Rerun after regenerating icons
// (make-icons.mjs) or screenshots (make-screenshots.mjs).
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("site/images", { recursive: true });

const files = {
  "icons/icon32.png": "site/images/icon32.png",
  "icons/icon128.png": "site/images/icon128.png",
  "store-listing/screenshots/01-switcher.png": "site/images/switcher.png",
  "store-listing/screenshots/02-settings.png": "site/images/settings.png",
  "store-listing/screenshots/03-value-prop.png": "site/images/value-prop.png",
};

for (const [from, to] of Object.entries(files)) {
  copyFileSync(from, to);
  console.log(`${from} -> ${to}`);
}
