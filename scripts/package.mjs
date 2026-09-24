// Zips the already-self-contained dist/ for Chrome Web Store upload. Shells
// out to the system `zip` rather than adding an archiver dependency.
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";

const manifest = JSON.parse(readFileSync("dist/manifest.json", "utf8"));
const outDir = "dist-package";
const zipPath = `../${outDir}/dock-v${manifest.version}.zip`;

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
execSync(`cd dist && zip -q -r "${zipPath}" .`, { stdio: "inherit" });
console.log(`Wrote ${outDir}/dock-v${manifest.version}.zip`);
