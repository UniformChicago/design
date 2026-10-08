import * as maplibre from "../dist/vendor/maplibre/maplibre-gl.mjs";
maplibre.setWorkerUrl(
  new URL("../dist/vendor/maplibre/maplibre-gl-worker.mjs?v=6.13.0", import.meta.url).href,
);
(() => {
  const root = document.querySelector("[data-map-preview]");
  const records = [...root.querySelectorAll("[data-property]")].map((card) => ({
    id: card.dataset.property,
    title: card.querySelector("h2").textContent,
    label: card.querySelector("strong").textContent,
    location: card.hasAttribute("data-lat") ? [Number(card.dataset.lat), Number(card.dataset.lng)] : null,
  }));
  const connection = UniformMapList.connect(root, {
    maplibre,
    records,
    // Omit provider for OpenFreeMap. Consumers can supply their own style URLs
    // and transformRequest for a compatible paid or self-hosted service.
  });
  window.addEventListener("pagehide", () => connection.destroy(), { once: true });
})();
