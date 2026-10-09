const root = document.querySelector("[data-doc-map]");
if (root) {
  const status = document.querySelector("[data-doc-map-status]");
  status.textContent = "Scroll to load map...";

  const init = async () => {
    status.textContent = "Loading map engine...";
    const maplibre = await import("./dist/vendor/maplibre/maplibre-gl.mjs");
    maplibre.setWorkerUrl(new URL("./dist/vendor/maplibre/maplibre-gl-worker.mjs", import.meta.url).href);

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
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          init();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(root);
  } else {
    init();
  }
}
