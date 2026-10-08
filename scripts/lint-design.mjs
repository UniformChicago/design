import { readFileSync } from "node:fs";
import { lintDesign } from "../agent/lint.mjs";
const paths = process.argv.slice(2);
if (!paths.length) {
  console.error("Usage: node scripts/lint-design.mjs <html-or-css-file> [...files]");
  process.exit(2);
}
const catalog = JSON.parse(readFileSync(new URL("../dist/catalog.json", import.meta.url), "utf8"));
let failed = false;
for (const path of paths) {
  const findings = lintDesign(readFileSync(path, "utf8"), catalog);
  for (const finding of findings)
    console.error(`${path}:${finding.line} [${finding.rule}] ${finding.message}`);
  failed ||= findings.length > 0;
}
if (failed) process.exitCode = 1;
else console.log("Focused design checks passed. Run browser and accessibility tests separately.");
