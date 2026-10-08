// Renders the docs site's share assets: og.png (1200x630 link preview) and apple-touch-icon.png
// (180x180, used by Safari's share sheet and home screens). Same treatment as the main site's card,
// with "Design" as the descriptor. Run after a brand change: npm run render:share. Outputs are committed.
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = new URL("..", import.meta.url).pathname;
const { color } = JSON.parse(readFileSync(join(ROOT, "tokens/tokens.json"), "utf8"));
const c = (name) => color[name].value;
const svg = (f) => readFileSync(join(ROOT, "dist/svg", f), "utf8");
const font = (f) => pathToFileURL(join(ROOT, "dist/fonts", `${f}.woff2`)).href;

const wordmark = svg("uniform-wordmark-on-dark.svg");
const icon = svg("uniform-icon-on-dark.svg");

// Fine strands sweeping from signal to lake, faded toward the center so the lockup stays clear.
function wave(w, h) {
  let paths = "";
  for (let strand = 0; strand < 52; strand++) {
    const depth = strand / 51;
    let d = "";
    for (let x = -40; x <= w + 40; x += 12) {
      const u = x / w;
      const fold = Math.sin(u * 5.1 + depth * 2.4);
      const ripple = Math.sin(u * 9 + depth * 3) * 0.06;
      const y = h * (0.5 + fold * 0.32 + ripple + (depth - 0.5) * 0.48);
      d += `${x === -40 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)} `;
    }
    const alpha = 0.08 + Math.pow(Math.sin(depth * Math.PI), 4) * 0.25;
    paths += `<path d="${d}" fill="none" stroke="url(#g)" stroke-width="${strand % 6 ? 0.6 : 1.2}" opacity="${alpha.toFixed(3)}"/>`;
  }
  return `<svg width="${w}" height="${h}" style="position:absolute;inset:0" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="${h}" x2="${w}" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="${c("signal-on-dark")}"/><stop offset=".38" stop-color="${c("lake-light")}"/><stop offset="1" stop-color="${c("lake-light")}"/>
      </linearGradient>
      <radialGradient id="r" cx="50%" cy="48%" r="50%">
        <stop offset=".15" stop-color="#fff" stop-opacity="0"/><stop offset=".95" stop-color="#fff"/>
      </radialGradient>
      <mask id="m"><rect width="${w}" height="${h}" fill="url(#r)"/></mask>
    </defs>
    <g mask="url(#m)">${paths}</g>
  </svg>`;
}

const page = `<!doctype html><html><head><style>
  @font-face { font-family: "Public Sans"; font-weight: 600; src: url(${font("public-sans-latin-600-normal")}); }
  body { margin: 0; }
  .og { position: relative; width: 1200px; height: 630px; background: ${c("night")}; display: grid; place-items: center; overflow: hidden; }
  .lockup { position: relative; width: 600px; }
  .lockup svg { display: block; width: 100%; height: auto; }
  .descriptor { margin: -6px 0 0 24px; font: 600 27px/1 "Public Sans"; letter-spacing: 0.14em; color: ${c("mist")}; }
  .icon { width: 180px; height: 180px; background: ${c("night")}; display: grid; place-items: center; }
  .icon svg { width: 140px; height: 140px; display: block; }
</style></head><body>
  <div class="og">${wave(1200, 630)}<div class="lockup">${wordmark}<div class="descriptor">DESIGN</div></div></div>
  <div class="icon">${icon}</div>
</body></html>`;

const dir = mkdtempSync(join(tmpdir(), "share-"));
const file = join(dir, "share.html");
writeFileSync(file, page);
const browser = await chromium.launch();
try {
  const tab = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => document.fonts.ready);
  writeFileSync(join(ROOT, "site/og.png"), await tab.locator(".og").screenshot({ type: "png" }));
  writeFileSync(
    join(ROOT, "site/apple-touch-icon.png"),
    await tab.locator(".icon").screenshot({ type: "png" }),
  );
} finally {
  await browser.close();
  rmSync(dir, { recursive: true, force: true });
}
console.log("Rendered site/og.png and site/apple-touch-icon.png");
