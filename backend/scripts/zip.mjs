import { readdirSync, mkdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { zip } from "zip-a-folder";

const funcDir = resolve("dist/functions");
const zipsDir = resolve("dist/zips");
mkdirSync(zipsDir, { recursive: true });

const entries = readdirSync(funcDir)
  .filter(name => statSync(join(funcDir, name)).isDirectory());

for (const dir of entries) {
  await zip(join(funcDir, dir), join(zipsDir, `${dir}.zip`));
  console.log("Zipped:", dir);
}
