// Optional Leaflet adapter. No provider or network request is enabled implicitly.
(() => {
  const mounts = new WeakMap();
  function mount(
    root,
    {
      leaflet: L,
      records,
      source,
      attribution = "",
      onState = () => {},
      onPreview = () => {},
      onSelect = () => {},
    },
  ) {
    if (mounts.has(root)) return mounts.get(root);
    if (!L || !Array.isArray(records) || typeof source !== "function")
      throw new TypeError("Supply Leaflet, records and an abortable GeoJSON source function");
    const ids = new Set();
    for (const record of records) {
      if (typeof record.id !== "string" || ids.has(record.id))
        throw new TypeError("Record ids must be unique strings");
      ids.add(record.id);
      if (
        record.location &&
        (!Array.isArray(record.location) ||
          record.location.length !== 2 ||
          !record.location.every(Number.isFinite) ||
          Math.abs(record.location[0]) > 90 ||
          Math.abs(record.location[1]) > 180)
      )
        throw new TypeError("Locations must be [latitude, longitude] or null");
    }
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const map = L.map(root, {
      scrollWheelZoom: false,
      zoomAnimation: !reduced.matches,
      fadeAnimation: !reduced.matches,
      markerZoomAnimation: !reduced.matches,
      inertia: !reduced.matches,
    }).setView([0, 0], 2);
    const abort = new AbortController();
    let request,
      generation = 0,
      disposed = false,
      geography,
      selected = null,
      fitted = false;
    const markers = new Map();
    const points = L.layerGroup().addTo(map);
    if (attribution) {
      // Attribution is plain text supplied by the caller, never raw HTML.
      const span = document.createElement("span");
      span.textContent = attribution;
      map.attributionControl.addAttribution(span.innerHTML);
    }
    for (const record of records) {
      if (!record.location) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "u-map-price";
      button.textContent = record.label;
      button.setAttribute("aria-label", `Select ${record.title}, ${record.label}`);
      button.setAttribute("aria-pressed", "false");
      button.addEventListener(
        "click",
        (event) => {
          event.stopPropagation();
          onSelect(record.id, event.detail === 0, button);
        },
        { signal: abort.signal },
      );
      for (const name of ["pointerenter", "focus"])
        button.addEventListener(name, () => onPreview(record.id), { signal: abort.signal });
      for (const name of ["pointerleave", "blur"])
        button.addEventListener(name, () => onPreview(null), { signal: abort.signal });
      const marker = L.marker(record.location, {
        icon: L.divIcon({
          html: button,
          className: "u-map-marker",
          iconSize: [108, 44],
          iconAnchor: [54, 22],
        }),
        keyboard: false,
      }).addTo(points);
      markers.set(record.id, { marker, button });
    }
    const resize = new ResizeObserver(() => {
      if (root.clientWidth && root.clientHeight) map.invalidateSize({ pan: false });
    });
    resize.observe(root);
    async function reload() {
      if (disposed) return;
      const epoch = ++generation;
      request?.abort();
      request = new AbortController();
      const current = request;
      const timer = setTimeout(() => current.abort(new Error("Map source timed out")), 15000);
      onState("loading");
      try {
        const data = await source({ signal: current.signal });
        if (disposed || epoch !== generation) return;
        current.signal.throwIfAborted();
        if (!data || !["FeatureCollection", "Feature"].includes(data.type))
          throw new TypeError("Source must return GeoJSON");
        const next = L.geoJSON(data, {
          interactive: false,
          style: () => ({ className: "u-map-boundary", weight: 1, fillOpacity: 0.45 }),
        });
        if (geography) map.removeLayer(geography);
        geography = next.addTo(map);
        geography.bringToBack();
        onState("ready");
        map.invalidateSize({ pan: false });
        if (!fitted) {
          const locations = records.filter((record) => record.location).map((record) => record.location);
          const bounds = locations.length ? L.latLngBounds(locations) : geography.getBounds();
          if (bounds.isValid()) map.fitBounds(bounds, { padding: [45, 45], maxZoom: 13, animate: false });
          fitted = true;
        }
      } catch (error) {
        if (!disposed && epoch === generation) onState("error", error);
      } finally {
        clearTimeout(timer);
      }
    }
    const api = {
      reload,
      preview(id) {
        for (const [key, { button }] of markers) button.dataset.preview = String(key === id);
      },
      select(id) {
        selected = id;
        for (const [key, { marker, button }] of markers) {
          button.setAttribute("aria-pressed", String(key === id));
          marker.setZIndexOffset(key === id ? 1000 : 0);
        }
      },
      filter(visibleIds) {
        const visible = new Set(visibleIds);
        for (const [id, { marker }] of markers) {
          if (visible.has(id)) points.addLayer(marker);
          else points.removeLayer(marker);
        }
        if (!visible.has(selected)) api.select(null);
      },
      resize() {
        map.invalidateSize({ pan: false });
      },
      destroy() {
        if (disposed) return;
        disposed = true;
        generation++;
        request?.abort();
        abort.abort();
        resize.disconnect();
        map.remove();
        mounts.delete(root);
      },
    };
    mounts.set(root, api);
    reload();
    return api;
  }
  globalThis.UniformMap = { mount };
})();
