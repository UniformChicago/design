import { readFileSync } from "node:fs";
export const routes = [
  { id: "map-list", file: "map.html", title: "Map and list", script: "map-preview.js" },
  { id: "multi-step-intake", file: "index.html", title: "Multi-step intake", script: null },
  { id: "status-dashboard", file: "dashboard.html", title: "Status dashboard", script: null },
  {
    id: "searchable-collection",
    file: "workspace.html",
    title: "Searchable collection",
    script: null,
  },
  { id: "component-states", file: "states.html", title: "Component states", script: null },
];
export function renderPatterns(root) {
  const shell = readFileSync(`${root}/patterns/shell.html`, "utf8");
  return routes.map((route) => {
    const body = readFileSync(`${root}/patterns/${route.id}.html`, "utf8");
    const nav =
      routes
        .map(
          (item) =>
            `<a href="${item.file}"${item.id === route.id ? ' aria-current="page"' : ""}>${item.title}</a>`,
        )
        .join("\n") +
      '<span class="u-eyebrow" style="padding: var(--u-space-4) var(--u-space-3) var(--u-space-1); display: block; color: var(--u-muted);">Resources</span><a href="../">Components</a><a href="../agent/">Agents</a><a href="../playground/">Playground</a>';
    return {
      ...route,
      body,
      html: shell
        .replaceAll("{{title}}", route.title)
        .replace(
          "<!--pattern-head-->",
          route.id === "map-list"
            ? '<link rel="stylesheet" href="../dist/vendor/maplibre/maplibre-gl.css" /><link rel="stylesheet" href="../dist/map.css" />'
            : "",
        )
        .replace(
          "connect-src 'none'",
          route.id === "map-list"
            ? "connect-src 'self' https://tiles.openfreemap.org; worker-src 'self'"
            : "connect-src 'none'",
        )
        .replace(
          "img-src 'self'",
          route.id === "map-list" ? "img-src 'self' blob: https://tiles.openfreemap.org" : "img-src 'self'",
        )
        .replaceAll("<!--pattern-nav-->", nav)
        .replace("<!--pattern-body-->", body)
        .replace(
          "<!--pattern-scripts-->",
          route.script
            ? `<script src="../dist/map-list.js"></script><script src="../dist/maplibre.js"></script><script type="module" src="${route.script}"></script>`
            : "",
        ),
    };
  });
}
