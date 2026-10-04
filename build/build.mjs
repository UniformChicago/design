#!/usr/bin/env node
// Builds dist/ from tokens/, brand/, atmosphere/ and components/.
//   node build/build.mjs          write dist/
//   node build/build.mjs --check  rebuild in memory and fail if dist/ is stale (CI)
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { contoursSvg } from "../atmosphere/waves.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const CHECK = process.argv.includes("--check");
const tokens = JSON.parse(readFileSync(join(ROOT, "tokens/tokens.json"), "utf8"));
const out = new Map(); // relative path → Buffer

const put = (path, data) => out.set(path, Buffer.isBuffer(data) ? data : Buffer.from(data));
const val = (group) =>
  Object.fromEntries(
    Object.entries(tokens[group])
      .filter(([k]) => !k.startsWith("$"))
      .map(([k, v]) => [k, v.value]),
  );
const color = val("color");
const HEADER = "/* Generated from tokens/tokens.json by build/build.mjs. Do not edit. */\n";

// tokens.css: brand variables + self-hosted fonts (paths relative to this file)
const vars = [
  ...Object.entries(color).map(([k, v]) => `  --u-${k}: ${v};`),
  ...Object.entries(val("font")).map(([k, v]) => `  --u-font-${k}: ${v};`),
  ...Object.entries(val("radius")).map(([k, v]) => `  --u-radius-${k}: ${v};`),
  ...Object.entries(val("space")).map(([k, v]) => `  --u-space-${k}: ${v};`),
  ...Object.entries(val("dot")).map(([k, v]) => `  --u-dot-${k}: ${v};`),
];
const faces = [
  ["Public Sans", 400, "normal", "public-sans-latin-400-normal"],
  ["Public Sans", 400, "italic", "public-sans-latin-400-italic"],
  ["Public Sans", 600, "normal", "public-sans-latin-600-normal"],
  ["Public Sans", 600, "italic", "public-sans-latin-600-italic"],
  ["Public Sans", 700, "normal", "public-sans-latin-700-normal"],
  ["Public Sans", 700, "italic", "public-sans-latin-700-italic"],
  ["IBM Plex Mono", 500, "normal", "ibm-plex-mono-latin-500-normal"],
]
  .map(
    ([family, weight, style, file]) =>
      `@font-face {\n  font-family: "${family}";\n  font-weight: ${weight};\n  font-style: ${style};\n  font-display: swap;\n  src: url(fonts/${file}.woff2) format("woff2");\n}`,
  )
  .join("\n");
const tokensCss = `${HEADER}:root {\n${vars.join("\n")}\n}\n${faces}\n`;
// vars.css: variables only, for projects that self-host fonts their own way.
put("vars.css", `${HEADER}:root {\n${vars.join("\n")}\n}\n`);
put("tokens.css", tokensCss);
put("design.css", tokensCss + "\n" + readFileSync(join(ROOT, "components/components.css"), "utf8"));

// tokens.js/.d.ts and tokens.py for code that can't read CSS (canvas, PDF builder)
const plain = { color, font: val("font"), radius: val("radius"), space: val("space"), dot: val("dot") };
// tokens.js plus tokens.d.ts: plain JavaScript with exact literal types, importable from Node,
// bundlers and TypeScript alike.
put(
  "tokens.js",
  `// Generated from tokens/tokens.json. Do not edit.\nexport const tokens = Object.freeze(${JSON.stringify(plain, null, 2)});\n`,
);
put(
  "tokens.d.ts",
  `// Generated from tokens/tokens.json. Do not edit.\nexport declare const tokens: ${JSON.stringify(plain, null, 2)};\n`,
);
put(
  "tokens.py",
  `# Generated from tokens/tokens.json. Do not edit.\nTOKENS = ${JSON.stringify(plain, null, 4)}\nCOLOR = TOKENS["color"]\n`,
);

// Assets
const copyDir = (from, to, filter = () => true) => {
  for (const f of readdirSync(join(ROOT, from))) {
    const p = join(ROOT, from, f);
    if (statSync(p).isFile() && filter(f)) put(`${to}/${f}`, readFileSync(p));
  }
};
copyDir("brand/svg", "svg");
// On-dark variants, as approved for the site and portal: Paper letters, Mist descriptor,
// and the Signal-on-dark dot (the stock "dark" files use a Lake-light dot).
for (const f of readdirSync(join(ROOT, "brand/svg"))) {
  if (!f.endsWith("-color.svg")) continue;
  const svg = readFileSync(join(ROOT, "brand/svg", f), "utf8")
    .replaceAll('fill="#14212B"', `fill="${color.paper.toUpperCase()}"`)
    .replaceAll('fill="#5E6E79"', `fill="${color.mist.toUpperCase()}"`)
    .replaceAll('fill="#C8402A"', `fill="${color["signal-on-dark"].toUpperCase()}"`)
    .replace(/(<title>[^<]*?)color(<\/title>)/, "$1on dark$2")
    .replace(/(aria-label="[^"]*?)color"/, '$1on dark"');
  put(`svg/${f.replace("-color.svg", "-on-dark.svg")}`, svg);
}
copyDir("brand/fonts", "fonts");
put("waves.js", readFileSync(join(ROOT, "atmosphere/waves.js")));
put("waves.d.ts", readFileSync(join(ROOT, "atmosphere/waves.d.ts")));
put("atmosphere.js", readFileSync(join(ROOT, "atmosphere/auto.js")));

// Static waves for print (the PDF builder): same math, frozen at t = 2.6
put(
  "waves/cover-dark.svg",
  contoursSvg(816, 1056, { center: 0.56, signal: color.signal, lake: color["lake-light"] }),
);
put(
  "waves/band-light.svg",
  contoursSvg(624, 106, {
    strands: 26,
    band: 0.28,
    spread: 0.5,
    opacity: 0.9,
    signal: color.signal,
    lake: color["lake-light"],
  }),
);

// Manifest of every file with its SHA-256, for consumers that verify downloads
const manifest = Object.fromEntries(
  [...out]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([p, b]) => [p, createHash("sha256").update(b).digest("hex")]),
);
put("manifest.json", JSON.stringify({ name: "@uniform/design", files: manifest }, null, 2) + "\n");

if (CHECK) {
  const stale = [];
  for (const [p, b] of out) {
    const f = join(DIST, p);
    if (!existsSync(f) || !readFileSync(f).equals(b)) stale.push(p);
  }
  const walk = (d) =>
    readdirSync(d, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)],
    );
  for (const f of existsSync(DIST) ? walk(DIST) : [])
    if (!out.has(relative(DIST, f))) stale.push(`${relative(DIST, f)} (extra)`);
  if (stale.length) {
    console.error(`dist/ is stale; run npm run build and commit:\n  ${stale.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`dist/ is current (${out.size} files).`);
} else {
  rmSync(DIST, { recursive: true, force: true });
  for (const [p, b] of out) {
    mkdirSync(dirname(join(DIST, p)), { recursive: true });
    writeFileSync(join(DIST, p), b);
  }
  console.log(`Built dist/ (${out.size} files).`);
}
