#!/usr/bin/env node
// Fails if any text/background pair listed in tokens.json misses WCAG AA (4.5:1).
import { readFileSync } from "node:fs";

const t = JSON.parse(readFileSync(new URL("../tokens/tokens.json", import.meta.url), "utf8"));
const hex = (name) => t.color[name]?.value ?? (name === "white" ? "#ffffff" : null);
const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

let failed = 0;
for (const [fg, bg] of t.contrast.pairs) {
  if (!hex(fg) || !hex(bg)) {
    console.error(`  ✗ unknown token in pair ${fg} on ${bg}`);
    failed++;
    continue;
  }
  const r = ratio(hex(fg), hex(bg));
  const ok = r >= 4.5;
  if (!ok) failed++;
  console.log(`  ${ok ? "✓" : "✗"} ${fg} on ${bg}: ${r.toFixed(2)}:1`);
}
if (failed) {
  console.error(`${failed} pair(s) below WCAG AA 4.5:1.`);
  process.exit(1);
}
console.log("All text/background pairs meet WCAG AA.");
