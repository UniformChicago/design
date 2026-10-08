import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
function harness() {
  const state = { layers: new Set(), removed: 0, disconnected: 0, buttons: [] };
  class Element extends EventTarget {
    attrs = {};
    dataset = {};
    setAttribute(key, value) {
      this.attrs[key] = value;
    }
    get innerHTML() {
      return this.textContent;
    }
  }
  const map = {
    setView() {
      return this;
    },
    attributionControl: { addAttribution() {} },
    removeLayer(layer) {
      state.layers.delete(layer);
    },
    invalidateSize() {},
    fitBounds() {},
    remove() {
      state.removed++;
    },
  };
  const L = {
    map: () => map,
    layerGroup: () => ({
      addTo() {
        return this;
      },
      addLayer(marker) {
        state.layers.add(marker);
      },
      removeLayer(marker) {
        state.layers.delete(marker);
      },
    }),
    divIcon: (options) => {
      state.buttons.push(options.html);
      return options;
    },
    marker: () => ({
      addTo(group) {
        group.addLayer(this);
        return this;
      },
      setZIndexOffset() {},
    }),
    geoJSON: (data) => ({
      data,
      addTo() {
        state.layers.add(this);
        return this;
      },
      bringToBack() {},
      getBounds() {
        return { isValid: () => true };
      },
    }),
    latLngBounds: () => ({ isValid: () => true }),
  };
  const scope = {
    AbortController,
    setTimeout,
    clearTimeout,
    document: { createElement: () => new Element() },
    matchMedia: () => ({ matches: true }),
    ResizeObserver: class {
      observe() {}
      disconnect() {
        state.disconnected++;
      }
    },
  };
  vm.runInNewContext(readFileSync(new URL("../../interactions/map.js", import.meta.url), "utf8"), scope);
  return { mount: scope.UniformMap.mount, L, state, root: {} };
}
const records = [
  { id: "one", title: "One", label: "$1", location: [41.9, -87.6] },
  { id: "missing", title: "Missing", label: "$2", location: null },
];
const data = { type: "FeatureCollection", features: [] };
test("map rejects invalid coordinates and duplicate ids before mounting", () => {
  const h = harness();
  assert.throws(
    () => h.mount(h.root, { leaflet: h.L, records: [...records, records[0]], source: async () => data }),
    /unique/,
  );
  assert.throws(
    () =>
      h.mount(h.root, {
        leaflet: h.L,
        records: [{ ...records[0], location: [91, 0] }],
        source: async () => data,
      }),
    /latitude/,
  );
});
test("map recovers a failed source, filters markers and disposes once", async () => {
  const h = harness(),
    states = [];
  let fail = true;
  const options = {
    leaflet: h.L,
    records,
    source: async () => {
      if (fail) throw Error("offline");
      return data;
    },
    onState: (state) => states.push(state),
  };
  const api = h.mount(h.root, options);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(states, ["loading", "error"]);
  assert.equal(h.mount(h.root, options), api);
  assert.equal(h.state.buttons.length, 1);
  api.select("one");
  assert.equal(h.state.buttons[0].attrs["aria-pressed"], "true");
  api.filter(["missing"]);
  assert.equal(h.state.buttons[0].attrs["aria-pressed"], "false");
  fail = false;
  await api.reload();
  assert.equal(states.at(-1), "ready");
  api.destroy();
  api.destroy();
  assert.equal(h.state.removed, 1);
  assert.equal(h.state.disconnected, 1);
});
test("stale map responses cannot replace a newer request or update a destroyed map", async () => {
  const h = harness(),
    pending = [],
    states = [];
  const api = h.mount(h.root, {
    leaflet: h.L,
    records,
    source: ({ signal }) => new Promise((resolve) => pending.push({ signal, resolve })),
    onState: (state) => states.push(state),
  });
  const latest = api.reload();
  assert.equal(pending[0].signal.aborted, true);
  pending[1].resolve(data);
  await latest;
  const count = states.length;
  pending[0].resolve(data);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(states.length, count);
  const last = api.reload();
  api.destroy();
  assert.equal(pending[2].signal.aborted, true);
  const afterDestroy = states.length;
  pending[2].resolve(data);
  await last;
  assert.equal(states.length, afterDestroy);
});
