import * as esbuild from "esbuild";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";

const watch = process.argv.includes("--watch");

// dist/ is the whole loadable extension: manifest + icons + bundled JS +
// static popup/options HTML+CSS, all copied/emitted directly into it so
// "Load unpacked" can point straight at dist/ with nothing left outside it.
const entries = [
  { in: "src/router.ts", out: "dist/router.js", format: "esm" }, // background.type = "module"
  { in: "src/content-script.ts", out: "dist/content-script.js", format: "iife" },
  { in: "src/popup/popup.ts", out: "dist/popup/popup.js", format: "esm" },
  { in: "src/options/options.ts", out: "dist/options/options.js", format: "esm" },
];

function copyStaticFiles() {
  mkdirSync("dist/icons", { recursive: true });
  mkdirSync("dist/popup", { recursive: true });
  mkdirSync("dist/options", { recursive: true });

  copyFileSync("manifest.json", "dist/manifest.json");

  // icons/ also holds the mascot master PNG and its own README (source
  // assets, not shipped) — copy exactly the icon files the manifest
  // references, not the whole directory.
  const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
  const iconPaths = new Set([
    ...Object.values(manifest.icons ?? {}),
    ...Object.values(manifest.action?.default_icon ?? {}),
  ]);
  for (const path of iconPaths) copyFileSync(path, `dist/${path}`);

  copyFileSync("src/popup/popup.html", "dist/popup/popup.html");
  copyFileSync("src/popup/popup.css", "dist/popup/popup.css");
  copyFileSync("src/options/options.html", "dist/options/options.html");
  copyFileSync("src/options/options.css", "dist/options/options.css");
}

const contexts = await Promise.all(
  entries.map((entry) =>
    esbuild.context({
      entryPoints: [entry.in],
      outfile: entry.out,
      bundle: true,
      format: entry.format,
      target: "chrome110",
      sourcemap: true,
    }),
  ),
);

copyStaticFiles();

if (watch) {
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log("Watching for changes… (rerun `npm run build` if you edit manifest.json, icons, or html/css)");
} else {
  await Promise.all(contexts.map((ctx) => ctx.rebuild()));
  await Promise.all(contexts.map((ctx) => ctx.dispose()));
  console.log("Built dist/ — load it unpacked at chrome://extensions");
}
