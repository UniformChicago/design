import * as maplibre from "./dist/vendor/maplibre/maplibre-gl.mjs";
maplibre.setWorkerUrl(new URL("./dist/vendor/maplibre/maplibre-gl-worker.mjs", import.meta.url).href);
const root = document.querySelector("[data-doc-map]");
if (root) {
  const status = document.querySelector("[data-doc-map-status]");
  const records = [
    { id: "courtyard", title: "Courtyard house", label: "$425,000", location: [41.929, -87.668] },
    { id: "terrace", title: "Terrace apartment", label: "$310,000", location: [41.906, -87.641] },
    { id: "garden", title: "Garden house", label: "$560,000", location: [41.877, -87.677] },
  ];
  const adapter = UniformMapLibre.mount(root, {
    maplibre,
    records,
    onSelect: (id) => {
      const record = records.find((item) => item.id === id);
      adapter.select(id);
      status.textContent = `Selected ${record.title} · ${record.label}`;
    },
    onState: (state) => {
      status.textContent =
        state === "ready"
          ? "Fictional properties. Select a price marker to preview a home."
          : state === "error"
            ? "Map unavailable. Try the complete explorer for list browsing and recovery controls."
            : "Loading street map…";
    },
  });
  window.addEventListener("pagehide", () => adapter.destroy(), { once: true });
}
