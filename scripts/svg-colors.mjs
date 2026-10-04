#!/usr/bin/env node
// Every color in a brand SVG must be a token (or a neutral used by the grayscale and white
// variants), so a token change can't silently leave logos on old colors.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const tokens = JSON.parse(readFileSync(join(ROOT, "tokens/tokens.json"), "utf8"));
const allowed = new Set(Object.values(tokens.color).map((c) => c.value.toLowerCase()));
for (const neutral of ["#ffffff", "#000000", "#222222", "#555555"]) allowed.add(neutral);
const problems = [];
for (const f of readdirSync(join(ROOT, "brand/svg")).filter((f) => f.endsWith(".svg"))) {
  const svg = readFileSync(join(ROOT, "brand/svg", f), "utf8");
  for (const [, hex] of svg.matchAll(/(?:fill|stroke|stop-color)="(#[0-9a-fA-F]{3,8})"/g))
    if (!allowed.has(hex.toLowerCase())) problems.push(`brand/svg/${f}: ${hex} is not a token color`);
}
if (problems.length) {
  console.error([...new Set(problems)].map((p) => `  ✗ ${p}`).join("\n"));
  process.exit(1);
}
console.log("Brand SVG colors all come from tokens.");
