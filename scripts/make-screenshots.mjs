// Renders the Chrome Web Store screenshot scenes (store-listing/templates/
// 0N-*.html) with headless Chrome and checks each PNG is exactly 1280x800
// with no alpha channel, which is what the Web Store requires. No headless-
// browser dependency: shells out to the Chrome already on this machine, same
// as make-icons.mjs reuses `sips` instead of an image library.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
];
const chrome = process.env.CHROME_PATH ?? CHROME_PATHS.find(existsSync);
if (!chrome) {
  console.error("Couldn't find Chrome. Set CHROME_PATH to its binary and retry.");
  process.exit(1);
}

const templatesDir = "store-listing/templates";
const outDir = "store-listing/screenshots";
const scenes = readdirSync(templatesDir)
  .filter((name) => /^\d+-.*\.html$/.test(name))
  .sort();

for (const scene of scenes) {
  const outPath = path.join(outDir, scene.replace(/\.html$/, ".png"));
  const inputUrl = `file://${path.resolve(templatesDir, scene)}`;
  execFileSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--virtual-time-budget=2000",
      "--window-size=1280,800",
      `--screenshot=${outPath}`,
      inputUrl,
    ],
    { stdio: ["ignore", "ignore", "ignore"] }, // headless Chrome's harmless macOS GPU/sandbox stderr noise
  );

  const png = readFileSync(outPath);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const colourType = png[25];
  if (width !== 1280 || height !== 800) {
    throw new Error(`${outPath}: expected 1280x800, got ${width}x${height}`);
  }
  if (colourType === 6 || colourType === 4) {
    throw new Error(`${outPath}: has an alpha channel — Chrome Web Store requires opaque screenshots`);
  }
  console.log(`Wrote ${outPath} (${width}x${height})`);
}
