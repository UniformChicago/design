#!/usr/bin/env node
// Publishing guard: only brand files listed in brand/assets.txt may exist, and nothing that
// looks like a credential may be committed.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const allowed = new Set(
  readFileSync(join(ROOT, "brand/assets.txt"), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean),
);
const SKIP = new Set(["node_modules", ".git"]);
const CREDENTIAL = /(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|AGE-SECRET-KEY-)/;
const problems = [];

for (const f of readdirSync(join(ROOT, "brand/svg"))) {
  if (!allowed.has(f)) problems.push(`brand/svg/${f}: not in brand/assets.txt`);
}
const walk = (d) => {
  for (const e of readdirSync(d)) {
    if (SKIP.has(e)) continue;
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (
      !/\.(woff2|png|ico)$/.test(p) &&
      relative(ROOT, p) !== "scripts/forbidden.mjs" &&
      CREDENTIAL.test(readFileSync(p, "utf8"))
    )
      problems.push(`${relative(ROOT, p)}: looks like a credential`);
  }
};
walk(ROOT);
if (problems.length) {
  console.error(problems.map((p) => `  ✗ ${p}`).join("\n"));
  process.exit(1);
}
console.log("Brand assets match the allowlist; no credentials found.");
