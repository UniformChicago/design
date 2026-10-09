import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { createDesignApi, registerDesignTools } from "../../agent/api.mjs";
import { lintDesign } from "../../agent/lint.mjs";
import { renderPatterns } from "../../build/patterns.mjs";
const root = new URL("../..", import.meta.url).pathname;
const catalog = JSON.parse(readFileSync(`${root}/dist/catalog.json`, "utf8"));
test("catalog lookup returns independent contracts and rejects unknown ids", () => {
  const api = createDesignApi(catalog);
  assert.ok(api.list_design({ query: "intake" }).patterns.some((x) => x.id === "multi-step-intake"));
  const first = api.get_component({ id: "select" });
  first.states.push("invented");
  assert.ok(!api.get_component({ id: "select" }).states.includes("invented"));
  assert.throws(() => api.get_pattern({ id: "../../secrets" }), /Unknown/);
  assert.throws(() => api.list_design({ query: [] }), /query/);
  assert.equal(api.get_usage_rules().version, catalog.version);
});
test("WebMCP registers read-only tools backed by the same catalog and can dispose", async () => {
  const tools = new Map();
  let signal;
  const result = await registerDesignTools(
    {
      registerTool: async (tool, options) => {
        tools.set(tool.name, tool);
        signal = options.signal;
      },
    },
    catalog,
  );
  assert.equal(result.registered.length, 7);
  assert.ok([...tools.values()].every((x) => x.annotations.readOnlyHint));
  const response = await tools.get("get_component").execute({ id: "select" });
  assert.deepEqual(
    JSON.parse(response.content[0].text),
    createDesignApi(catalog).get_component({ id: "select" }),
  );
  result.dispose();
  assert.ok(signal.aborted);
  assert.equal((await registerDesignTools(null, catalog)).supported, false);
});
test("partial registration is aborted on host failure", async () => {
  let signal,
    count = 0;
  await assert.rejects(
    registerDesignTools(
      {
        registerTool: async (_, options) => {
          signal = options.signal;
          if (++count === 2) throw new Error("host failure");
        },
      },
      catalog,
    ),
    /host failure/,
  );
  assert.ok(signal.aborted);
});
test("design lint catches actionable errors and accepts a corrected control", () => {
  const bad = '<button class="u-made-up" style="color: #ff0000">Save</button>\n<input id="name">';
  const rules = lintDesign(bad, catalog).map((x) => x.rule);
  for (const rule of ["unknown-class", "inline-style", "raw-color", "button-type", "field-label"])
    assert.ok(rules.includes(rule));
  assert.deepEqual(
    lintDesign(
      '<label for="name">Name</label><input id="name"><button type="button" class="u-button">Save</button>',
      catalog,
    ),
    [],
  );
});
test("generated fixtures use the common shell and all local links resolve", () => {
  for (const route of renderPatterns(root)) {
    assert.equal(readFileSync(`${root}/workflows/${route.file}`, "utf8"), route.html);
    assert.equal((route.html.match(/aria-current="page"/g) || []).length, 2);
    for (const match of route.html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
      if (/^[a-z]+:/.test(match[1])) continue;
      const path = new URL(match[1], `file://${root}/_site/workflows/${route.file}`).pathname;
      assert.ok(existsSync(path), `${route.id}: missing ${path}`);
    }
  }
});
test("every published file matches the package manifest", () => {
  const manifest = JSON.parse(readFileSync(`${root}/dist/manifest.json`, "utf8"));
  for (const [path, hash] of Object.entries(manifest.files))
    assert.equal(
      createHash("sha256")
        .update(readFileSync(`${root}/dist/${path}`))
        .digest("hex"),
      hash,
      path,
    );
});

test("every pattern component dependency resolves and its classes are supported", () => {
  for (const pattern of catalog.patterns)
    for (const id of pattern.components) assert.ok(catalog.components.some((item) => item.id === id));
  for (const entry of [...catalog.components, ...catalog.patterns]) {
    assert.ok(entry.markup.trim());
    assert.ok(entry.states.length);
    assert.equal(entry.maturity, "preview");
    for (const cls of entry.classes) assert.ok(catalog.classes.includes(cls));
  }
});

test("agent recipe supplies independently consumable map assets and validates markup", async () => {
  const { createDesignApi: packagedApi } = await import("../../dist/agent-api.mjs");
  const api = packagedApi(catalog);
  const recipe = api.get_recipe({ id: "map-list" });
  for (const asset of [
    ...recipe.integration.styles,
    ...recipe.integration.scripts,
    ...(recipe.integration.modules || []),
    ...(recipe.integration.workers || []),
  ])
    assert.ok(existsSync(`${root}/dist/${asset}`), asset);
  assert.ok(recipe.integration.lifecycle.includes("destroy"));
  assert.deepEqual(api.validate_markup({ source: recipe.pattern.markup }).findings, []);
  assert.ok(api.validate_markup({ source: '<button class="u-invented">Go</button>' }).findings.length);
  recipe.components[0].title = "mutated";
  assert.notEqual(api.get_recipe({ id: "map-list" }).components[0].title, "mutated");
  assert.throws(() => api.validate_markup({ source: "x".repeat(200001) }), /200000/);
});

test("local geographic fixture has actual polygons and finite geographic coordinates", () => {
  const data = JSON.parse(readFileSync(`${root}/workflows/data/chicago.geojson`, "utf8"));
  assert.equal(data.type, "FeatureCollection");
  assert.equal(data.features.length, 77);
  for (const feature of data.features) {
    assert.equal(feature.geometry.type, "MultiPolygon");
    for (const polygon of feature.geometry.coordinates)
      for (const ring of polygon) {
        assert.ok(ring.length >= 4);
        assert.deepEqual(ring[0], ring.at(-1));
        for (const [lng, lat] of ring)
          assert.ok(
            Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lng) <= 180 && Math.abs(lat) <= 90,
          );
      }
  }
});

test("agent validation catches missing tokens and authored styles reference declared tokens", () => {
  const api = createDesignApi(catalog);
  assert.ok(
    api
      .validate_markup({ source: ".example { margin: var(--u-space-8); }" })
      .findings.some((x) => x.rule === "unknown-token"),
  );
  assert.deepEqual(api.validate_markup({ source: ".example { margin: var(--u-space-6); }" }).findings, []);
  for (const file of ["components/components.css", "components/map.css"]) {
    const source = readFileSync(`${root}/${file}`, "utf8");
    for (const match of source.matchAll(/var\(\s*(--u-[\w-]+)/g))
      assert.ok(catalog.customProperties.includes(match[1]), `${file}: ${match[1]}`);
  }
});

test("pinned MapLibre distribution matches recorded upstream hashes", () => {
  const provenance = JSON.parse(readFileSync(`${root}/vendor/maplibre/provenance.json`, "utf8"));
  for (const [name, hash] of Object.entries(provenance.files)) {
    assert.equal(
      createHash("sha256")
        .update(readFileSync(`${root}/dist/vendor/maplibre/${name}`))
        .digest("hex"),
      hash,
    );
  }
});

test("map recipes include the optional context menu assets used by their markup", () => {
  const api = createDesignApi(catalog);
  const recipe = api.get_recipe({ id: "map-list" });
  const serialized = JSON.stringify(recipe);
  assert.ok(serialized.includes("context-menu.css"));
  assert.ok(serialized.includes("context-menu.js"));
});

test("agent examples use shared classes and packaged sample-photo assets", () => {
  for (const item of [...catalog.components, ...catalog.patterns]) {
    assert.ok(!/class="[^"]*\b(?:s|g|p)-/.test(item.markup), item.id);
    assert.ok(!/href="(?:\.\.\/)?playground\//.test(item.markup), item.id);
    assert.ok(!/src="(?:\.\.\/)?gallery\/img\//.test(item.markup), item.id);
    for (const [, asset] of item.markup.matchAll(/src="\/design\/(gallery\/img\/[^"]+)"/g))
      assert.ok(existsSync(`${root}/dist/${asset}`), `${item.id}: ${asset}`);
  }
});
