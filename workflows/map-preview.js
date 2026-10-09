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
  const mobile = matchMedia("(max-width: 700px)");
  const photoList = document.createElement("div");
  photoList.className = "u-gallery-mobile";
  modal.querySelector(".u-gallery-modal-content").append(photoList);
  modalImg.draggable = false;
  document.querySelectorAll(".u-property-thumbnail img, .u-property-photos img").forEach((img) => {
    img.draggable = false;
  });
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
      photoList.replaceChildren(
        ...currentImages.map((source, index) => {
          const figure = document.createElement("figure");
          const image = document.createElement("img");
          image.src = source.src;
          image.alt = source.alt;
          image.draggable = false;
          const caption = document.createElement("figcaption");
          caption.textContent = `${source.closest("figure")?.querySelector("figcaption")?.textContent || `Photo ${index + 1}`} · AI-generated sample`;
          figure.append(image, caption);
          return figure;
        }),
      );
      modal.showModal();
      modal.scrollTop = 0;
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
    if (!modal.open || mobile.matches) return;
    if (e.key === "ArrowLeft" && currentIndex > 0) showImage(currentIndex - 1);
    if (e.key === "ArrowRight" && currentIndex < currentImages.length - 1) showImage(currentIndex + 1);
  });

  function dismissWithMotion() {
    if (modal.classList.contains("u-swipe-dismiss")) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      modal.close();
      return;
    }
    const finish = (event) => {
      if (event && event.target !== modal.querySelector(".u-gallery-modal-content")) return;
      clearTimeout(timer);
      modal.removeEventListener("animationend", finish);
      modal.close();
      modal.classList.remove("u-swipe-dismiss");
    };
    modal.addEventListener("animationend", finish);
    const timer = setTimeout(finish, 400);
    modal.classList.add("u-swipe-dismiss");
  }
  let touchStartX = 0;
  let swipeStart;
  modal.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
      swipeStart =
        mobile.matches && modal.scrollTop <= 1 && e.touches.length === 1
          ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
          : null;
    },
    { passive: true },
  );

  modal.addEventListener("touchcancel", () => {
    swipeStart = null;
  });
  modal.addEventListener(
    "touchend",
    (e) => {
      if (mobile.matches) {
        const end = e.changedTouches[0];
        if (swipeStart && end.clientY - swipeStart.y > 80 && Math.abs(end.clientX - swipeStart.x) < 50)
          dismissWithMotion();
        swipeStart = null;
        return;
      }
      const touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (diff > 50 && currentIndex < currentImages.length - 1) {
        showImage(currentIndex + 1);
      } else if (diff < -50 && currentIndex > 0) {
        showImage(currentIndex - 1);
      }
    },
    { passive: true },
  );
}
