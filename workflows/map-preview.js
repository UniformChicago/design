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

// Full-screen Gallery logic
const modal = document.getElementById("gallery-modal");
if (modal) {
  const modalImg = document.getElementById("gallery-image");
  const modalCaption = document.getElementById("gallery-caption");
  const closeBtn = modal.querySelector(".u-gallery-modal-close");
  const prevBtn = modal.querySelector(".u-gallery-modal-prev");
  const nextBtn = modal.querySelector(".u-gallery-modal-next");
  let currentImages = [];
  let currentIndex = 0;

  const showImage = (index) => {
    if (!currentImages.length) return;
    currentIndex = index;
    const img = currentImages[currentIndex];
    modalImg.src = img.src;
    modalImg.alt = img.alt;

    const figcaption = img.closest("figure")?.querySelector("figcaption");
    modalCaption.textContent = `${figcaption?.textContent || "Photo"} · AI-generated sample`;

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === currentImages.length - 1;
  };

  document.addEventListener("click", (e) => {
    if (e.target.matches(".u-property-thumbnail img, .u-property-photos img")) {
      const figure = e.target.closest("figure");
      const gallery = figure.closest(".u-property-gallery") || figure.closest(".u-map-card");

      if (gallery) {
        currentImages = Array.from(
          gallery.querySelectorAll(".u-property-thumbnail img, .u-property-photos img"),
        );
      } else {
        currentImages = [e.target];
      }

      currentIndex = currentImages.indexOf(e.target);
      showImage(currentIndex);
      modal.showModal();
    }
  });

  closeBtn.addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === modal.querySelector(".u-gallery-modal-content")) {
      modal.close();
    }
  });

  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) showImage(currentIndex - 1);
  });

  nextBtn.addEventListener("click", () => {
    if (currentIndex < currentImages.length - 1) showImage(currentIndex + 1);
  });

  document.addEventListener("keydown", (e) => {
    if (!modal.open) return;
    if (e.key === "ArrowLeft" && currentIndex > 0) showImage(currentIndex - 1);
    if (e.key === "ArrowRight" && currentIndex < currentImages.length - 1) showImage(currentIndex + 1);
  });
}
