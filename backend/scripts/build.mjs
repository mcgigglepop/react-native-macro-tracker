import { build } from "esbuild";
import { readdirSync, mkdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const outdir = resolve("dist/functions");
mkdirSync(outdir, { recursive: true });

const srcDirs = ["src/handlers", "src/triggers"];

function listJs(dir) {
  const abs = resolve(dir);
  return readdirSync(abs)
    .filter(f => f.endsWith(".js"))
    .map(f => join(abs, f));
}

const entries = srcDirs
  .filter(d => statSync(resolve(d), { throwIfNoEntry: false }) !== undefined)
  .flatMap(listJs);

// Optional safety so you don't overwrite same-named files
const names = new Set();
for (const p of entries) {
  const base = p.split(/[/\\]/).pop().replace(/\.js$/, "");
  if (names.has(base)) throw new Error(`Duplicate handler name "${base}" across handlers/triggers. Rename one, gremlin.`);
  names.add(base);
}

await build({
  entryPoints: entries,
  outdir,
  platform: "node",
  target: "node20",
  format: "cjs",            // CJS avoids ESM handler drama
  bundle: true,
  sourcemap: false,
  legalComments: "none",
  minify: true,
  entryNames: "[name]/index" // dist/functions/<name>/index.js
});
console.log("Built:", entries.length, "functions");
