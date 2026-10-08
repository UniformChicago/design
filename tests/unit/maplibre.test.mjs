import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
function harness() {
  const maps = [],
    markers = [],
    observers = [];
  class Element extends EventTarget {
    attrs = {};
    dataset = {};
    children = [];
    setAttribute(key, value) {
      this.attrs[key] = value;
    }
    append(...children) {
      this.children.push(...children);
    }
    remove() {}
    focus() {}
    showModal() {
      this.open = true;
    }
    close() {
      this.open = false;
    }
  }
  const themeRoot = { dataset: { theme: "dark" } };
  class FakeMap {
    events = new Map();
    removed = false;
    constructor(options) {
      this.options = options;
      maps.push(this);
    }
    on(name, fn) {
      this.events.set(name, fn);
    }
    fire(name, data) {
      this.events.get(name)?.(data);
    }
    addControl(control) {
      control.onAdd?.(this);
    }
    flyTo(options) {
      this.flyOptions = options;
    }
    fitBounds(bounds, options) {
      this.fitOptions = options;
      this.bounds = bounds;
    }
    getCenter() {
      return { lng: 3, lat: 4 };
    }
    project([lng, lat]) {
      return { x: lng * 100, y: lat * 100 };
    }
    unproject([x, y]) {
      return [x / 100, y / 100];
    }
    getMaxZoom() {
      return 22;
    }
    getZoom() {
      return 7;
    }
    getBearing() {
      return 0;
    }
    getPitch() {
      return 0;
    }
    resize() {}
    remove() {
      this.removed = true;
    }
  }
  class Marker {
    constructor({ element }) {
      this.button = element;
      markers.push(this);
    }
    setLngLat(location) {
      this.location = location;
      return this;
    }
    addTo(map) {
      this.map = map;
      return this;
    }
    remove() {
      this.map = null;
    }
  }
  const M = {
    Map: FakeMap,
    Marker,
    AttributionControl: class {},
    LngLatBounds: class {
      extend() {}
    },
  };
  const scope = {
    AbortController,
    setTimeout,
    clearTimeout,
    matchMedia: () => ({ matches: true }),
    document: { documentElement: themeRoot, createElement: () => new Element() },
    ResizeObserver: class {
      observe() {}
      disconnect() {}
    },
    MutationObserver: class {
      constructor(fn) {
        this.fn = fn;
        observers.push(this);
      }
      observe() {}
      disconnect() {
        this.disconnected = true;
      }
    },
  };
  vm.runInNewContext(readFileSync(new URL("../../interactions/maplibre.js", import.meta.url), "utf8"), scope);
  return {
    adapter: scope.UniformMapLibre,
    root: { closest: () => themeRoot, focus() {}, parentElement: new Element() },
    M,
    maps,
    markers,
    themeRoot,
    observers,
  };
}
const records = [
  { id: "a", title: "Example", label: "$1", location: [41, -87] },
  { id: "b", title: "Missing", label: "$2", location: null },
];
test("default provider needs no key; theme/retry retain camera, filter and selection", () => {
  const h = harness(),
    states = [];
  const api = h.adapter.mount(h.root, { maplibre: h.M, records, onState: (state) => states.push(state) });
  try {
    assert.equal(h.maps[0].options.style, "https://tiles.openfreemap.org/styles/dark");
    assert.deepEqual(Array.from(h.markers[0].location), [-87, 41]);
    assert.equal(h.markers.length, 1);
    h.maps[0].fire("idle");
    assert.equal(states.at(-1), "ready");
    api.select("a");
    assert.equal(h.markers[0].button.attrs["aria-pressed"], "true");
    h.themeRoot.dataset.theme = "light";
    h.observers[0].fn();
    assert.equal(h.maps[1].options.style, "https://tiles.openfreemap.org/styles/positron");
    assert.equal(h.maps[1].options.zoom, 7);
    assert.equal(h.markers[1].button.attrs["aria-pressed"], "true");
    h.maps[1].fire("error", { error: Error("offline") });
    assert.equal(states.at(-1), "error");
    api.filter(["b"]);
    api.reload();
    assert.equal(h.markers.at(-1).map, null);
    h.maps.at(-1).fire("idle");
    assert.equal(states.at(-1), "ready");
    const count = states.length;
    h.maps[0].fire("error", { error: Error("stale") });
    assert.equal(states.length, count);
  } finally {
    api.destroy();
  }
  assert.ok(h.maps.every((map) => map.removed));
  assert.ok(h.observers[0].disconnected);
});
test("custom provider style and authentication hook are passed through without fallback requests", () => {
  const h = harness(),
    transformRequest = (url) => ({ url });
  const api = h.adapter.mount(h.root, {
    maplibre: h.M,
    records,
    provider: { style: "https://maps.example/style.json", transformRequest },
  });
  try {
    assert.equal(h.maps[0].options.style, "https://maps.example/style.json");
    assert.equal(h.maps[0].options.transformRequest, transformRequest);
    h.themeRoot.dataset.theme = "light";
    h.observers[0].fn();
    assert.equal(h.maps.length, 1);
    api.reload();
    assert.equal(h.maps[1].options.style, "https://maps.example/style.json");
  } finally {
    api.destroy();
  }
});
test("invalid provider and location configurations fail before requesting a map", () => {
  const h = harness();
  assert.throws(() => h.adapter.mount(h.root, { maplibre: h.M, records, provider: {} }), /Provider/);
  assert.throws(
    () => h.adapter.mount(h.root, { maplibre: h.M, records: [{ ...records[0], location: [100, 0] }] }),
    /latitude/,
  );
  assert.equal(h.maps.length, 0);
});

test("clustering joins overlapping marker areas, splits separated points and is order independent", () => {
  const h = harness();
  const points = [
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 100, y: 0 },
    { id: "c", x: 200, y: 0 },
    { id: "d", x: 700, y: 0 },
  ];
  const memberships = (input) =>
    Array.from(h.adapter.clusterPoints(input), (group) =>
      Array.from(group, (point) => point.id)
        .sort()
        .join(","),
    ).sort();
  assert.deepEqual(memberships(points), ["a,b,c", "d"]);
  assert.deepEqual(memberships([...points].reverse()), memberships(points));
  assert.equal(
    h.adapter.clusterPoints([
      { x: 0, y: 0 },
      { x: 0, y: 60 },
    ]).length,
    2,
  );
});
test("same-location group opens member choices and filtering recalculates counts", () => {
  const h = harness(),
    selected = [];
  const items = [records[0], { ...records[0], id: "c", title: "Second" }, records[1]];
  const api = h.adapter.mount(h.root, { maplibre: h.M, records: items, onSelect: (id) => selected.push(id) });
  try {
    const cluster = h.markers[0];
    assert.equal(cluster.button.textContent, "2");
    api.select("c");
    assert.equal(cluster.button.attrs["aria-pressed"], "true");
    cluster.button.dispatchEvent(new Event("click"));
    const dialog = h.root.parentElement.children[0];
    assert.equal(dialog.open, true);
    dialog.children[2].children[1].dispatchEvent(new Event("click"));
    assert.deepEqual(selected, ["c"]);
    api.filter(["a", "b"]);
    assert.equal(cluster.map, null);
    assert.equal(h.markers.at(-1).button.textContent, "$1");
  } finally {
    api.destroy();
  }
});

test("separated cluster zooms on activation and clustering can be disabled", () => {
  const items = [records[0], { ...records[0], id: "c", location: [41.1, -87.1] }];
  const h = harness();
  const api = h.adapter.mount(h.root, { maplibre: h.M, records: items });
  try {
    assert.equal(h.markers.length, 1);
    h.markers[0].button.dispatchEvent(new Event("click"));
    assert.equal(h.maps[0].fitOptions.maxZoom, 10);
    assert.equal(h.maps[0].fitOptions.duration, 0);
    assert.equal(h.root.parentElement.children.length, 0);
  } finally {
    api.destroy();
  }
  const other = harness();
  const unclustered = other.adapter.mount(other.root, {
    maplibre: other.M,
    records: items,
    clustering: false,
  });
  try {
    assert.equal(other.markers.length, 2);
  } finally {
    unclustered.destroy();
  }
});

test("selecting a record without coordinates clears marker selection without moving the camera", () => {
  const h = harness();
  const api = h.adapter.mount(h.root, { maplibre: h.M, records });
  try {
    api.select("a");
    const previousFlight = h.maps[0].flyOptions;
    assert.equal(h.markers[0].button.attrs["aria-pressed"], "true");
    api.select("b");
    assert.equal(h.maps[0].flyOptions, previousFlight);
    assert.equal(h.markers[0].button.attrs["aria-pressed"], "false");
    assert.equal(h.markers.length, 1);
  } finally {
    api.destroy();
  }
});
