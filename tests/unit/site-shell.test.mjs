import { test } from "node:test";
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { readFileSync, existsSync } from "node:fs";

const pages = [
  "index.html",
  "playground/index.html",
  "gallery/index.html",
  "agent/index.html",
  ...["index", "dashboard", "workspace", "states", "map"].map((name) => `workflows/${name}.html`),
];
test("all built pages expose the same page navigation and one theme control", () => {
  for (const page of pages) {
    const url = new URL(`../../_site/${page}`, import.meta.url);
    const html = readFileSync(url, "utf8");
    assert.equal((html.match(/class="u-shell-header"/g) || []).length, 1, page);
    assert.equal((html.match(/id="s-theme"/g) || []).length, 1, page);
    assert.ok(!html.includes("data-theme-toggle"), page);
    const nav = html.match(/<nav class="s-pages"[\s\S]*?<\/nav>/)?.[0];
    assert.ok(nav, page);
    const destination = ["index.html", "agent/index.html"].includes(page) ? "Playground" : "Documentation";
    assert.ok(nav.includes(`aria-label="${destination}"`), page);
    assert.ok(nav.includes(`title="${destination}"`), page);
    assert.ok(html.includes('aria-label="Uniform Design components"'), page);
    assert.ok(!nav.includes(">Components</a>"), page);
    for (const [, href] of nav.matchAll(/href="([^"]+)"/g)) {
      assert.ok(!href.includes("#"), `${page}: page navigation contains an anchor`);
      assert.ok(existsSync(new URL(href, url)), `${page}: missing ${href}`);
    }
    assert.ok(html.includes('aria-label="Developer resources"'), page);
    assert.ok(html.includes('title="Uniform design catalog"'), page);
    assert.ok(!/\sstyle="/.test(html), `${page}: CSP-incompatible inline style`);
  }
});

test("workflows link to editable starters and retain the shared bounded workspace", () => {
  for (const name of ["index", "dashboard", "workspace", "states", "map"]) {
    const html = readFileSync(new URL(`../../_site/workflows/${name}.html`, import.meta.url), "utf8");
    assert.ok(/class="[^"]*u-workbench/.test(html), name);
    const nav = html.match(/<nav[^>]*aria-label="Playground library"[\s\S]*?<\/nav>/)?.[0];
    assert.ok(nav?.includes("playground/#map-list"), name);
    assert.ok(nav?.includes("playground/#status-dashboard"), name);
  }
});

test("Component Lab ships its initial workspace and preview before JavaScript", () => {
  for (const page of ["playground/index.html", "gallery/index.html"]) {
    const html = readFileSync(new URL(`../../_site/${page}`, import.meta.url), "utf8");
    const workspace = html.match(/<div[^>]*id="workspace"[^>]*>/)?.[0];
    assert.ok(workspace, page);
    assert.ok(!workspace.includes("hidden"), page);
    assert.ok(html.includes('data-preset="map-list" aria-pressed="true"'), page);
    assert.ok(html.includes("<option>Default</option>"), page);
    const preview = html.match(/srcdoc="([^"]+)"/)?.[1];
    assert.ok(preview?.includes("Map and list"), page);
    assert.ok(preview?.includes("Courtyard house"), page);
    assert.ok(preview?.includes("Content-Security-Policy"), page);
    assert.ok(!html.includes("<!--initial-"), page);
  }
});

test("all full workflows are starters with canonical markup and isolated live previews", async () => {
  const { workflowStarters } = await import("../../gallery/workflow-starters.js");
  const { presets } = await import("../../gallery/presets.js");
  assert.equal(workflowStarters.length, 6);
  for (const starter of workflowStarters) {
    assert.equal(
      starter.markup,
      readFileSync(new URL(`../../patterns/${starter.id}.html`, import.meta.url), "utf8"),
    );
    assert.equal(presets.find((preset) => preset.id === starter.id)?.live, starter.live);
    const preview = readFileSync(new URL(`../../_site/playground/${starter.live}`, import.meta.url), "utf8");
    assert.ok(!preview.includes("u-app-nav"), starter.id);
    assert.ok(preview.includes('src="../../workflows/workflow.js'), starter.id);
    assert.ok(!/\sstyle="/.test(preview), starter.id);
    const previewURL = new URL(`../../_site/playground/${starter.live}`, import.meta.url);
    for (const [, ref] of preview.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^(?:https?:|#)/.test(ref)) continue;
      assert.ok(existsSync(new URL(ref.split("?")[0], previewURL)), `${starter.id}: missing ${ref}`);
    }
    if (starter.id === "map-list") {
      assert.ok(preview.indexOf("dist/design.css") < preview.indexOf("dist/map.css"));
      assert.ok(preview.includes('data-view="both"'));
      for (const view of ["both", "list", "map", "gallery"])
        assert.ok(preview.includes(`data-map-view="${view}"`));
    }
  }
  const map = presets.find((preset) => preset.id === "map-list");
  assert.ok(map.render("$& <script>").includes("$&amp; &lt;script&gt;"));
});

test("docs load dialog interactions before the example initializer", () => {
  const html = readFileSync(new URL("../../_site/index.html", import.meta.url), "utf8");
  assert.ok(html.indexOf('src="dist/interactions.js') < html.indexOf('src="docs.js'));
  const docs = readFileSync(new URL("../../site/docs.js", import.meta.url), "utf8");
  assert.ok(docs.includes('document.readyState === "complete"'));
  assert.ok(docs.includes('document.addEventListener("DOMContentLoaded", mountExamples'));
});

test("current Playground link cancels redundant navigation and preserves modified clicks", () => {
  const source = readFileSync(new URL("../../site/shell.js", import.meta.url), "utf8").replace(
    /^import .*;\n/,
    "",
  );
  let click;
  const link = {
    href: "https://example.test/playground/",
    addEventListener: (_, handler) => {
      click = handler;
    },
  };
  const location = new URL(link.href + "#records");
  runInNewContext(source, {
    URL,
    location,
    document: {
      documentElement: {},
      getElementById: () => null,
      querySelector: (selector) => (selector.includes("s-pages") ? link : null),
    },
  });
  let cancelled = 0;
  const event = {
    button: 0,
    preventDefault: () => {
      cancelled++;
    },
  };
  for (let press = 0; press < 6; press++) click(event);
  assert.equal(cancelled, 6);
  for (const modifier of ["metaKey", "ctrlKey", "shiftKey", "altKey"]) click({ ...event, [modifier]: true });
  click({ ...event, button: 1 });
  assert.equal(cancelled, 6);
  location.pathname = "/";
  click(event);
  assert.equal(cancelled, 6);
});
