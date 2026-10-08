// Default street-map adapter. Provider styles are configuration, not UI dependencies.
(() => {
  const mounts = new WeakMap();
  const openFreeMap = Object.freeze({
    lightStyle: "https://tiles.openfreemap.org/styles/positron",
    darkStyle: "https://tiles.openfreemap.org/styles/dark",
  });
  // Group intersecting marker hit areas in screen space, independent of tile provider.
  function clusterPoints(points, width = 116, height = 52) {
    const parents = points.map((_, index) => index);
    const find = (index) => {
      while (parents[index] !== index) {
        parents[index] = parents[parents[index]];
        index = parents[index];
      }
      return index;
    };
    const cells = new Map();
    points.forEach((point, index) => {
      const x = Math.floor(point.x / width),
        y = Math.floor(point.y / height);
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++) {
          for (const other of cells.get(`${x + dx}:${y + dy}`) || []) {
            if (Math.abs(point.x - points[other].x) < width && Math.abs(point.y - points[other].y) < height)
              parents[find(index)] = find(other);
          }
        }
      const key = `${x}:${y}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push(index);
    });
    const groups = new Map();
    points.forEach((point, index) => {
      const key = find(index);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(point);
    });
    return [...groups.values()];
  }
  function mount(
    root,
    {
      maplibre: M,
      records,
      provider = openFreeMap,
      clustering = true,
      onState = () => {},
      onPreview = () => {},
      onSelect = () => {},
    },
  ) {
    if (mounts.has(root)) return mounts.get(root);
    if (!M?.Map || !Array.isArray(records)) throw new TypeError("Supply MapLibre and records");
    if (!provider.style && (!provider.lightStyle || !provider.darkStyle))
      throw new TypeError("Provider needs style or both lightStyle and darkStyle");
    const ids = new Set();
    for (const record of records) {
      if (typeof record.id !== "string" || !record.id || ids.has(record.id))
        throw new TypeError("Record ids must be unique nonempty strings");
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
    let map,
      timer,
      listeners,
      disposed = false,
      generation = 0,
      selected = null,
      currentStyle;
    let visible = new Set(records.map((record) => record.id));
    const markers = new Map();
    const themeRoot = root.closest("[data-theme]") || document.documentElement;
    const style = () =>
      provider.style || (themeRoot.dataset.theme === "light" ? provider.lightStyle : provider.darkStyle);
    const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
    let memberDialog;
    function closeMembers(restoreFocus = true) {
      if (memberDialog) {
        memberDialog.restoreFocus = restoreFocus;
        memberDialog.close();
        memberDialog.remove();
        memberDialog = null;
      }
    }
    function showMembers(members, origin) {
      closeMembers();
      const memberListeners = new AbortController();
      const dialog = document.createElement("dialog");
      memberDialog = dialog;
      dialog.className = "u-dialog u-map-members";
      dialog.setAttribute("aria-label", `${members.length} properties in this group`);
      const heading = document.createElement("h2");
      heading.className = "u-section-heading";
      heading.textContent = `${members.length} properties here`;
      const hint = document.createElement("p");
      hint.className = "u-hint";
      hint.textContent = "Choose a property to see its details.";
      const list = document.createElement("div");
      list.className = "u-map-member-list";
      for (const record of members) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "u-button u-button--quiet";
        button.textContent = `${record.title} · ${record.label}`;
        button.setAttribute("aria-pressed", String(record.id === selected));
        button.addEventListener(
          "click",
          (event) => {
            closeMembers(false);
            onSelect(record.id, event.detail === 0, origin);
          },
          { signal: memberListeners.signal },
        );
        list.append(button);
      }
      const close = document.createElement("button");
      close.type = "button";
      close.className = "u-button u-button--quiet";
      close.textContent = "Close properties";
      close.addEventListener("click", closeMembers, { signal: memberListeners.signal });
      dialog.addEventListener(
        "close",
        () => {
          memberListeners.abort();
          dialog.remove();
          if (memberDialog === dialog) memberDialog = null;
          if (dialog.restoreFocus === false) return;
          if (origin.isConnected) origin.focus({ preventScroll: true });
          else root.focus({ preventScroll: true });
        },
        { once: true },
      );
      dialog.append(heading, hint, list, close);
      root.parentElement.append(dialog);
      dialog.showModal();
    }
    function setSelection() {
      for (const { button, members } of markers.values())
        button.setAttribute("aria-pressed", String(members.some((record) => record.id === selected)));
    }
    function syncMarkers() {
      if (!map) return;
      const points = records
        .filter((record) => visible.has(record.id) && record.location)
        .map((record) => ({ record, ...map.project([record.location[1], record.location[0]]) }));
      const groups = clustering ? clusterPoints(points) : points.map((point) => [point]);
      const keep = new Set();
      for (const group of groups) {
        const members = group.map((point) => point.record);
        const key = JSON.stringify(members.map((record) => record.id).sort());
        keep.add(key);
        if (!markers.has(key)) {
          const markerListeners = new AbortController();
          const button = document.createElement("button");
          button.type = "button";
          const clustered = members.length > 1;
          button.className = clustered ? "u-map-price u-map-cluster" : "u-map-price";
          button.textContent = clustered ? String(members.length) : members[0].label;
          button.setAttribute(
            "aria-label",
            clustered
              ? `${members.length} properties. Expand group`
              : `Select ${members[0].title}, ${members[0].label}`,
          );
          button.addEventListener(
            "click",
            (event) => {
              event.stopPropagation();
              if (!clustered) {
                onSelect(members[0].id, event.detail === 0, button);
                return;
              }
              const sameLocation = members.every(
                (record) =>
                  record.location[0] === members[0].location[0] &&
                  record.location[1] === members[0].location[1],
              );
              if (sameLocation || map.getZoom() >= map.getMaxZoom() - 0.1) {
                showMembers(members, button);
                return;
              }
              const bounds = new M.LngLatBounds();
              for (const record of members) bounds.extend([record.location[1], record.location[0]]);
              map.fitBounds(bounds, {
                padding: 70,
                maxZoom: Math.min(map.getMaxZoom(), map.getZoom() + 3),
                duration: reduced() ? 0 : 300,
              });
              if (event.detail === 0) root.focus({ preventScroll: true });
            },
            { signal: markerListeners.signal },
          );
          for (const name of ["pointerenter", "focus"])
            button.addEventListener(name, () => onPreview(clustered ? null : members[0].id), {
              signal: markerListeners.signal,
            });
          for (const name of ["pointerleave", "blur"])
            button.addEventListener(name, () => onPreview(null), { signal: markerListeners.signal });
          const marker = new M.Marker({ element: button, anchor: "center" });
          markers.set(key, { marker, button, members, markerListeners });
        }
        const position =
          group.length === 1
            ? [members[0].location[1], members[0].location[0]]
            : map.unproject([
                group.reduce((sum, point) => sum + point.x, 0) / group.length,
                group.reduce((sum, point) => sum + point.y, 0) / group.length,
              ]);
        markers.get(key).marker.setLngLat(position).addTo(map);
      }
      for (const [key, entry] of markers)
        if (!keep.has(key)) {
          if (document.activeElement === entry.button) root.focus({ preventScroll: true });
          entry.markerListeners.abort();
          entry.marker.remove();
          markers.delete(key);
        }
      setSelection();
    }
    function reload() {
      if (disposed) return;
      const epoch = ++generation;
      const camera = map
        ? { center: map.getCenter(), zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() }
        : null;
      closeMembers();
      clearTimeout(timer);
      listeners?.abort();
      map?.remove();
      map = null;
      for (const entry of markers.values()) entry.markerListeners.abort();
      markers.clear();
      listeners = new AbortController();
      onState("loading");
      currentStyle = style();
      let failed = false;
      const fail = (error) => {
        if (!disposed && epoch === generation) {
          failed = true;
          clearTimeout(timer);
          onState("error", error);
        }
      };
      try {
        map = new M.Map({
          container: root,
          style: currentStyle,
          center: [0, 0],
          zoom: 2,
          ...camera,
          attributionControl: false,
          scrollZoom: false,
          fadeDuration: reduced() ? 0 : 200,
          transformRequest: provider.transformRequest,
        });
        map.addControl(new M.AttributionControl({ compact: false }), "bottom-right");
        const controls = {
          onAdd(instance) {
            const group = document.createElement("div");
            group.className = "u-map-zoom maplibregl-ctrl";
            for (const [label, text, action] of [
              [
                "Fit all results",
                `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 14v6h6M20 14v6h-6M4 10V4h6M20 10V4h-6"/></svg>`,
                () => {
                  const located = records.filter((record) => visible.has(record.id) && record.location);
                  if (located.length) {
                    const bounds = new M.LngLatBounds();
                    for (const record of located) bounds.extend([record.location[1], record.location[0]]);
                    instance.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: reduced() ? 0 : 300 });
                  }
                },
              ],
              ["Zoom in", "+", () => instance.zoomIn({ duration: reduced() ? 0 : 200 })],
              ["Zoom out", "−", () => instance.zoomOut({ duration: reduced() ? 0 : 200 })],
            ]) {
              const button = document.createElement("button");
              button.type = "button";
              if (text.startsWith("<")) button.innerHTML = text;
              else button.textContent = text;
              button.setAttribute("aria-label", label);
              button.addEventListener("click", action, { signal: listeners.signal });
              group.append(button);
            }
            this.element = group;
            return group;
          },
          onRemove() {
            this.element?.remove();
          },
        };
        map.addControl(controls, "top-right");
        if (!camera) {
          const located = records.filter((record) => record.location);
          if (located.length) {
            const bounds = new M.LngLatBounds();
            for (const record of located) bounds.extend([record.location[1], record.location[0]]);
            map.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: 0 });
          }
        }
        syncMarkers();
        map.on("moveend", () => {
          if (!disposed && epoch === generation) syncMarkers();
        });
        map.on("resize", () => {
          if (!disposed && epoch === generation) syncMarkers();
        });
        map.on("error", (event) => fail(event.error));
        map.on("idle", () => {
          if (!disposed && epoch === generation && !failed) {
            clearTimeout(timer);
            onState("ready");
          }
        });
        timer = setTimeout(() => fail(new Error("Map provider timed out")), 20000);
      } catch (error) {
        fail(error);
      }
    }
    const resize = new ResizeObserver(() => {
      if (root.clientWidth && root.clientHeight) map?.resize();
    });
    resize.observe(root);
    const theme = new MutationObserver(() => {
      if (style() !== currentStyle) reload();
    });
    theme.observe(themeRoot, { attributes: true, attributeFilter: ["data-theme"] });
    const api = {
      reload,
      select(id) {
        selected = id;
        setSelection();
        if (id && map) {
          const record = records.find((r) => r.id === id);
          if (record && record.location) {
            map.flyTo({
              center: [record.location[1], record.location[0]],
              zoom: Math.max(map.getZoom(), 14),
              ...(reduced() ? { duration: 0 } : {}),
            });
          }
        }
      },
      preview(id) {
        for (const { button, members } of markers.values())
          button.dataset.preview = String(members.some((record) => record.id === id));
      },
      filter(visibleIds) {
        closeMembers();
        visible = new Set(visibleIds);
        if (!visible.has(selected)) selected = null;
        if (map) syncMarkers();
      },
      resize() {
        map?.resize();
      },
      destroy() {
        if (disposed) return;
        closeMembers();
        disposed = true;
        generation++;
        clearTimeout(timer);
        listeners?.abort();
        resize.disconnect();
        theme.disconnect();
        for (const entry of markers.values()) entry.markerListeners.abort();
        map?.remove();
        mounts.delete(root);
      },
    };
    mounts.set(root, api);
    reload();
    return api;
  }
  globalThis.UniformMapLibre = { mount, clusterPoints, providers: { openFreeMap } };
})();
