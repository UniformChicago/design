import { routes } from "./patterns.mjs";
import { readFileSync } from "node:fs";
const descriptions = {
  "map-list": ["Property search, gallery & shortlist", "property"],
  "multi-step-intake": ["Validation, review & saved drafts", "forms"],
  "status-dashboard": ["Metrics, tasks & activity", "progress"],
  "searchable-collection": ["Search, people, records & costs", "tables"],
  "component-states": ["Forms, dialogs & recovery states", "forms"],
  calculator: ["Dynamic financial breakdown", "property"],
};
export function workflowStarters(root) {
  return routes.map((route) => ({
    id: route.id,
    name: route.title,
    title:
      readFileSync(`${root}/patterns/${route.id}.html`, "utf8").match(/<h1[^>]*>([^<]+)/)?.[1] ?? route.title,
    description: descriptions[route.id][0],
    section: descriptions[route.id][1],
    live: `../workflows/previews/${route.file}`,
    markup: readFileSync(`${root}/patterns/${route.id}.html`, "utf8"),
  }));
}
export function livePreview(route) {
  const head = route.html
    .match(/<head>([\s\S]*?)<\/head>/)[1]
    .replaceAll("../dist/", "../../dist/")
    .replace('src="theme.js"', 'src="../../workflows/theme.js"')
    .replace('src="workflow.js"', 'src="../../workflows/workflow.js"');
  const scripts = route.script
    ? `${route.id === "map-list" ? '<script src="../../dist/map-list.js"></script><script src="../../dist/maplibre.js"></script>' : ""}<script type="module" src="../../workflows/${route.script}"></script>`
    : "";
  const body = route.body.replaceAll("../gallery/img/", "../../gallery/img/");
  return `<!doctype html><html lang="en"><head>${head}<link rel="stylesheet" href="../../gallery/preview.css" /></head><body class="u-root p-live"><div class="u-app"><main class="u-workspace" aria-label="Live preview">${body}</main></div>${scripts}</body></html>`;
}
