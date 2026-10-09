import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
// Initial local budgets for shipped assets, not a claim about runtime latency.
const budgets = {
  "design.css": 8000,
  "widgets.css": 2000,
  "interactions.js": 3500,
  "context-menu.js": 3500,
  "context-menu.css": 1500,
  "agent-api.mjs": 3500,
  "catalog.json": 20000,
  "map.js": 5000,
  "maplibre.js": 5000,
  "vendor/maplibre/maplibre-gl.mjs": 350000,
  "vendor/maplibre/maplibre-gl-worker.mjs": 170000,
  "vendor/maplibre/maplibre-gl.css": 14000,
  "map-list.js": 6000,
  "map.css": 2000,
  "vendor/leaflet.js": 45000,
  "vendor/leaflet.css": 5000,
};
let failed = false;
for (const [path, max] of Object.entries(budgets)) {
  const bytes = gzipSync(readFileSync(new URL(`../dist/${path}`, import.meta.url))).length;
  console.log(`${path}: ${bytes} gzip bytes / ${max}`);
  if (bytes > max) failed = true;
}
if (failed) process.exitCode = 1;
