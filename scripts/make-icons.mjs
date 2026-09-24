// Export the generated mascot using macOS's built-in image resizer.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

for (const size of [16, 32, 48, 64, 128, 256, 512, 1024]) {
  const output = `icons/icon${size}.png`;
  execFileSync("sips", ["-z", String(size), String(size), "icons/otter-master.png", "--out", output]);
  const png = readFileSync(output);
  assert.equal(png.readUInt32BE(16), size);
  assert.equal(png.readUInt32BE(20), size);
  assert.equal(png[25], 6, "Keep the mascot's RGBA transparency");
}
console.log("Exported and checked otter icons (16–1024px).");
