(() => {
  const mounts = new WeakMap();
  function mount(root) {
    if (!root) throw new TypeError("A map-list root is required");
    if (mounts.has(root)) return mounts.get(root);
    const abort = new AbortController();
    const listen = (target, name, handler) =>
      target?.addEventListener(name, handler, { signal: abort.signal });
    const filter = root.querySelector("[data-map-filter]");
    const cards = [...root.querySelectorAll("[data-property]")];
    const pins = [...root.querySelectorAll("[data-pin]")];
    const saved = new Set();
    const saveButton = root.querySelector("[data-selection-save]");
    let selected = null;
    let trigger = null;
    const summary = root.querySelector("[data-map-selection]");
    function revealResult(card) {
      const pane = root.querySelector(".u-map-results");
      if (!card || !pane.getClientRects().length) return;
      const bounds = pane.getBoundingClientRect();
      const item = card.getBoundingClientRect();
      const top = bounds.top + pane.clientTop;
      const bottom = top + pane.clientHeight;
      let delta = 0;
      if (item.top < top) delta = item.top - top;
      else if (item.bottom > bottom)
        delta = item.height > pane.clientHeight ? item.top - top : item.bottom - bottom;
      if (delta)
        pane.scrollBy({
          top: delta,
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        });
    }
    function syncLocationView() {
      const card = cards.find((item) => item.dataset.property === selected);
      const missing = Boolean(card && !card.hasAttribute("data-lat"));
      const surface = root.querySelector(".u-map-surface");
      const unavailable = surface.dataset.state && surface.dataset.state !== "ready";
      const notice = root.querySelector("[data-map-location-status]");
      if (notice) {
        notice.hidden = !missing || Boolean(unavailable);
        const name = notice.querySelector("[data-map-location-name]");
        if (name) name.textContent = card ? card.querySelector("h2").textContent : "";
      }
      const canvas = root.querySelector(".u-map-canvas");
      const obscured = Boolean(unavailable || (missing && notice));
      canvas.dataset.obscured = String(obscured);
      canvas.inert = obscured;
      canvas.setAttribute("aria-hidden", String(obscured));
    }
    function select(id) {
      selected = id;
      cards.forEach((card) => {
        const active = card.dataset.property === id;
        card.dataset.selected = String(active);
        card.querySelector("button").setAttribute("aria-pressed", String(active));
      });
      pins.forEach((pin) => {
        if (pin.dataset.pin === id) pin.setAttribute("aria-current", "true");
        else pin.removeAttribute("aria-current");
      });
      root.dispatchEvent(new CustomEvent("uniform:map-select", { detail: { id }, bubbles: true }));
      const card = cards.find((card) => card.dataset.property === id);
      syncLocationView();
      const locationNotice = root.querySelector("[data-selection-location-notice]");
      if (locationNotice) locationNotice.hidden = !card || card.hasAttribute("data-lat");
      root.querySelector("[data-selection-title]").textContent = card
        ? card.querySelector("h2").textContent
        : "Property details";
      summary.textContent = card
        ? `Selected ${card.querySelector("h2").textContent}.${card.hasAttribute("data-lat") ? "" : " Location unknown."}`
        : "Select a marker or result to inspect it.";
      root.querySelector("[data-selection-facts]").hidden = !card;
      const empty = root.querySelector("[data-selection-empty]");
      if (empty) empty.hidden = Boolean(card);
      root.querySelector("[data-map-dismiss]").hidden = !card;
      if (card) {
        root
          .querySelector("[data-selection-photo]")
          ?.setAttribute(
            "href",
            card.dataset.kind === "Apartment" ? "#property-photo-apartment" : "#property-photo-exterior",
          );
        for (const [field, value] of Object.entries({
          kind: card.dataset.kind,
          area: card.dataset.area || "Not provided",
          description: card.dataset.description || "",
          review: card.dataset.review || "",
        })) {
          const output = root.querySelector(`[data-selection-${field}]`);
          if (output) output.textContent = value;
        }
        if (saveButton) {
          saveButton.textContent = saved.has(id) ? "Saved to shortlist" : "Save property";
          saveButton.setAttribute("aria-pressed", String(saved.has(id)));
        }
        root.querySelector("[data-selection-price]").textContent = card.querySelector("strong").textContent;
        root.querySelector("[data-selection-layout]").textContent = card.querySelector("p").textContent;
        root.querySelector("[data-selection-location]").textContent =
          card.querySelector(".u-hint").textContent;
      }
    }
    function update() {
      cards.forEach((card) => {
        card.hidden = filter.value !== "all" && card.dataset.kind !== filter.value;
      });
      pins.forEach((pin) => {
        pin.toggleAttribute("hidden", cards.find((card) => card.dataset.property === pin.dataset.pin).hidden);
      });
      const visible = cards.filter((card) => !card.hidden);
      if (!visible.some((card) => card.dataset.property === selected)) select(null);
      root.dispatchEvent(
        new CustomEvent("uniform:map-filter", {
          detail: { ids: visible.map((card) => card.dataset.property) },
          bubbles: true,
        }),
      );
      root.querySelector("[data-map-empty]").hidden = visible.length > 0;
      root.querySelector("[data-map-count]").textContent =
        `${visible.length} properties · ${visible.filter((card) => card.hasAttribute("data-lat")).length} on map`;
    }
    listen(root, "uniform:context-open", (event) => {
      const card = event.detail.trigger.closest("[data-property]");
      if (!card) return;
      event.detail.menu.querySelector('[data-u-context-action="save"]').textContent = saved.has(
        card.dataset.property,
      )
        ? "Remove from shortlist"
        : "Save property";
      event.detail.menu.querySelector('[data-u-context-action="copy"]').disabled =
        !navigator.clipboard?.writeText;
    });
    listen(root, "uniform:context-action", (event) => {
      const card = event.detail.trigger.closest("[data-property]");
      if (!card) return;
      const id = card.dataset.property;
      if (event.detail.action === "view") {
        trigger = card.querySelector("[data-select]");
        select(id);
        root.querySelector(".u-map-selection").focus();
      } else if (event.detail.action === "save") {
        select(id);
        saveButton?.click();
      } else if (event.detail.action === "copy") {
        navigator.clipboard.writeText(card.querySelector("strong").textContent).then(
          () => {
            summary.textContent = "Property price copied.";
          },
          () => {
            summary.textContent = "Price could not be copied.";
          },
        );
      }
    });
    listen(saveButton, "click", () => {
      if (!selected) return;
      if (saved.has(selected)) saved.delete(selected);
      else saved.add(selected);
      select(selected);
      summary.textContent = `${saved.has(selected) ? "Saved" : "Removed"} ${root.querySelector("[data-selection-title]").textContent}${saved.has(selected) ? " to" : " from"} shortlist. ${saved.size} saved.`;
    });
    listen(filter, "change", update);
    listen(root.querySelector("[data-map-clear]"), "click", () => {
      filter.value = "all";
      update();
      filter.focus();
    });
    root.querySelectorAll("[data-select], [data-pin]").forEach((control) =>
      listen(control, "click", (event) => {
        event.preventDefault();
        trigger = control;
        const id = control.dataset.select || control.dataset.pin;
        select(id);
        revealResult(cards.find((card) => card.dataset.property === id));
        if (event.detail === 0) root.querySelector(".u-map-selection").focus({ preventScroll: true });
      }),
    );
    root.querySelectorAll("[data-map-view]").forEach((button) =>
      listen(button, "click", () => {
        root.querySelector(".u-map-layout").dataset.view = button.dataset.mapView;
        const settings = root.querySelector("[data-map-gallery-controls]");
        if (settings) settings.hidden = button.dataset.mapView !== "gallery";
        root
          .querySelectorAll("[data-map-view]")
          .forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      }),
    );
    listen(root.querySelector("[data-map-columns]"), "change", (event) => {
      root.querySelector(".u-map-results").dataset.columns = event.target.value;
    });
    listen(root.querySelector("[data-map-density]"), "change", (event) => {
      root.querySelector(".u-map-results").dataset.density = event.target.value;
    });
    const stateControl = root.querySelector("[data-map-state]");
    function setMapState(state) {
      const surface = root.querySelector(".u-map-surface");
      const unavailable = state !== "ready";
      surface.setAttribute("aria-busy", String(state === "loading"));
      surface.dataset.state = state;
      const canvas = root.querySelector(".u-map-canvas");
      canvas.dataset.obscured = String(unavailable);
      canvas.inert = unavailable;
      canvas.setAttribute("aria-hidden", String(unavailable));
      root.querySelector("[data-map-notice]").hidden = !unavailable;
      root.querySelector("[data-map-retry]").hidden = state !== "error";
      root.querySelector("[data-map-notice-title]").textContent =
        state === "loading" ? "Bringing the map into view" : "The map couldn’t load";
      root.querySelector("[data-map-notice-copy]").textContent =
        state === "loading"
          ? "Keep exploring your results while the map loads."
          : "Your places are still here. Try again, or continue in the list.";
      root.querySelector("[data-map-announcement]").textContent =
        state === "ready"
          ? "Map ready."
          : state === "loading"
            ? "Map loading. Results remain available."
            : "Map unavailable. Results remain available.";
      if (stateControl) stateControl.value = state;
      syncLocationView();
    }
    listen(stateControl, "change", () => setMapState(stateControl.value));
    listen(root.querySelector("[data-map-retry]"), "click", () => {
      root.dispatchEvent(new CustomEvent("uniform:map-retry", { bubbles: true }));
      (stateControl || filter).focus({ preventScroll: true });
    });
    listen(root.querySelector("[data-map-show-list]"), "click", () => {
      root.querySelector(".u-map-layout").dataset.view = "list";
      root
        .querySelectorAll("[data-map-view]")
        .forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.mapView === "list")));
      const first = cards.find((card) => !card.hidden);
      (first ? first.querySelector("button") : filter).focus({ preventScroll: true });
    });
    function dismiss() {
      select(null);
      if (trigger && trigger.getClientRects().length) trigger.focus({ preventScroll: true });
      else filter.focus({ preventScroll: true });
    }
    listen(root.querySelector("[data-map-dismiss]"), "click", dismiss);
    listen(root, "keydown", (event) => {
      if (event.key === "Escape" && selected) {
        event.preventDefault();
        dismiss();
      }
    });
    function preview(id) {
      root.dispatchEvent(new CustomEvent("uniform:map-preview", { detail: { id }, bubbles: true }));
      [...cards, ...pins].forEach((item) => {
        item.dataset.preview = String((item.dataset.property || item.dataset.pin) === id);
      });
    }
    [...cards, ...pins].forEach((item) => {
      const id = item.dataset.property || item.dataset.pin;
      listen(item, "pointerenter", () => preview(id));
      listen(item, "pointerleave", () => preview(null));
      listen(item, "focusin", () => preview(id));
      listen(item, "focusout", () => preview(null));
    });
    const api = {
      preview,
      select(id, origin) {
        if (origin) trigger = origin;
        const card = cards.find((item) => item.dataset.property === id && !item.hidden);
        if (id !== null && !card) throw new Error("Select a visible record id");
        select(id);
        revealResult(card);
      },
      setState: setMapState,
      refresh: update,
      destroy() {
        abort.abort();
        mounts.delete(root);
      },
    };
    mounts.set(root, api);
    update();
    return api;
  }
  const connections = new WeakMap();
  function connect(root, options) {
    if (connections.has(root)) return connections.get(root);
    const controller = mount(root);
    const abort = new AbortController();
    let renderer;
    try {
      renderer = (options.renderer || globalThis.UniformMapLibre).mount(root.querySelector(".u-map-canvas"), {
        ...options,
        onState: controller.setState,
        onPreview: controller.preview,
        onSelect(id, keyboard, origin) {
          controller.select(id, origin);
          if (keyboard) root.querySelector(".u-map-selection").focus({ preventScroll: true });
        },
      });
    } catch (error) {
      controller.setState("error");
      controller.destroy();
      throw error;
    }
    for (const [event, callback] of [
      ["uniform:map-select", (event) => renderer.select(event.detail.id)],
      ["uniform:map-preview", (event) => renderer.preview(event.detail.id)],
      ["uniform:map-filter", (event) => renderer.filter(event.detail.ids)],
      ["uniform:map-retry", () => renderer.reload()],
    ])
      root.addEventListener(event, callback, { signal: abort.signal });
    controller.refresh();
    const connection = {
      reload: renderer.reload,
      destroy() {
        abort.abort();
        renderer.destroy();
        controller.destroy();
        connections.delete(root);
      },
    };
    connections.set(root, connection);
    return connection;
  }
  globalThis.UniformMapList = { mount, connect };
})();
