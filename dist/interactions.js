// Optional, dependency-free enhancements. No networking or automatic mounting on import.
(function (root) {
  const mounted = new WeakMap();
  const progressAnimations = new WeakMap();
  function setProgress(meter, value) {
    if (meter?.tagName !== "PROGRESS") throw new TypeError("Expected a native progress element");
    const number = Number(value);
    if (!Number.isFinite(number)) throw new TypeError("Progress value must be finite");
    const target = Math.min(meter.max, Math.max(0, number));
    const previous = progressAnimations.get(meter);
    if (previous) root.cancelAnimationFrame(previous.frame);
    progressAnimations.delete(meter);
    // Announce the new value immediately while the visual fill catches up.
    meter.setAttribute("aria-valuenow", String(target));
    const motion = root.matchMedia?.("(prefers-reduced-motion: reduce)");
    const from = meter.value;
    if (motion?.matches || !root.requestAnimationFrame || from === target) {
      meter.value = target;
      return target;
    }
    const start = root.performance.now();
    const state = { frame: 0 };
    const tick = (now) => {
      const fraction = motion?.matches ? 1 : Math.min(1, Math.max(0, (now - start) / 360));
      const eased = 1 - (1 - fraction) ** 3;
      meter.value = from + (target - from) * eased;
      if (fraction < 1) state.frame = root.requestAnimationFrame(tick);
      else progressAnimations.delete(meter);
    };
    progressAnimations.set(meter, state);
    state.frame = root.requestAnimationFrame(tick);
    return target;
  }
  function mount(scope = document) {
    if (mounted.has(scope)) return mounted.get(scope);
    const cleanups = [];
    const listen = (target, event, fn) => {
      target.addEventListener(event, fn);
      cleanups.push(() => target.removeEventListener(event, fn));
    };
    for (const trigger of scope.querySelectorAll("[data-u-dialog-open]")) {
      const dialog = scope.querySelector(`#${CSS.escape(trigger.dataset.uDialogOpen)}`);
      if (!dialog || typeof dialog.showModal !== "function") continue;
      trigger.hidden = false;
      listen(trigger, "click", () => {
        dialog.returnValue = "";
        dialog.showModal();
      });
      listen(dialog, "close", () => {
        trigger.focus();
        trigger.dispatchEvent(
          new CustomEvent("uniform:dialog-close", { bubbles: true, detail: { value: dialog.returnValue } }),
        );
      });
      cleanups.push(() => {
        trigger.hidden = true;
        if (dialog.open) dialog.close();
      });
    }
    for (const close of scope.querySelectorAll("[data-u-dialog-close]"))
      listen(close, "click", () => close.closest("dialog")?.close(close.dataset.uDialogClose || "cancelled"));
    for (const field of scope.querySelectorAll("[data-u-file]")) {
      const ids = (field.getAttribute("aria-describedby") || "").split(/\s+/);
      const output = ids
        .map((id) => scope.querySelector(`#${CSS.escape(id)}`))
        .find((el) => el?.getAttribute("role") === "status");
      if (!output) continue;
      listen(field, "change", () => {
        const file = field.files?.[0];
        const valid =
          !file ||
          (/\.pdf$/i.test(file.name) &&
            (!file.type || file.type === "application/pdf") &&
            file.size <= 5 * 1024 * 1024);
        field.setAttribute("aria-invalid", String(!valid));
        field.setCustomValidity(valid ? "" : "Choose a PDF no larger than 5 MiB.");
        output.textContent = !file
          ? "No file selected."
          : valid
            ? `${file.name} · ${(file.size / 1024).toFixed(1)} KiB · Selected locally, not uploaded`
            : "Choose a PDF no larger than 5 MiB. File contents have not been validated.";
      });
    }
    for (const form of scope.querySelectorAll("[data-u-stepper]")) {
      const steps = [...form.querySelectorAll("[data-u-step]")];
      const next = form.querySelector("[data-u-next]"),
        back = form.querySelector("[data-u-back]");
      const counter = form.querySelector("[data-u-step-count]");
      const markers = [...scope.querySelectorAll("[data-u-step-list] li")];
      if (!steps.length || !next || !back || !counter) continue;
      let index = 0;
      const show = (focus = true) => {
        steps.forEach((step, i) => {
          step.hidden = i !== index;
        });
        markers.forEach((marker, i) => {
          marker.dataset.complete = String(i < index);
          if (i === index) marker.setAttribute("aria-current", "step");
          else marker.removeAttribute("aria-current");
        });
        back.disabled = index === 0;
        next.textContent = index === steps.length - 1 ? next.dataset.uFinalLabel || "Finish" : "Continue";
        counter.textContent = `Step ${index + 1} of ${steps.length}`;
        form.dispatchEvent(
          new CustomEvent("uniform:step-change", { bubbles: true, detail: { index, total: steps.length } }),
        );
        if (focus) steps[index].querySelector("h2, h3, [tabindex]")?.focus();
      };
      listen(back, "click", () => {
        index = Math.max(0, index - 1);
        show();
      });
      listen(form, "submit", (event) => {
        event.preventDefault();
        let invalid;
        for (const field of steps[index].querySelectorAll("input, select, textarea")) {
          const valid = field.checkValidity();
          field.setAttribute("aria-invalid", String(!valid));
          const error = field.id ? form.querySelector(`#${CSS.escape(field.id)}-error`) : null;
          if (error) error.hidden = valid;
          if (!valid && !invalid) invalid = field;
        }
        if (invalid) {
          invalid.focus();
          return;
        }
        if (index === steps.length - 1) {
          form.dispatchEvent(new CustomEvent("uniform:complete", { bubbles: true }));
          return;
        }
        index++;
        show();
      });
      show(false);
    }
    for (const collection of scope.querySelectorAll("[data-u-collection]")) {
      const search = collection.querySelector("[data-u-search]");
      const filter = collection.querySelector("[data-u-filter]");
      const clear = collection.querySelector("[data-u-clear]");
      const count = collection.querySelector("[data-u-count]");
      const empty = collection.querySelector("[data-u-empty]");
      const results = collection.querySelector("[data-u-results]");
      const rows = [...collection.querySelectorAll("[data-u-row]")];
      const sort = collection.querySelector("[data-u-sort]");
      if (!search || !filter || !clear || !count || !empty || !results) continue;
      const update = () => {
        const query = search.value.trim().toLocaleLowerCase();
        let matches = 0;
        for (const row of rows) {
          const title = row.querySelector("th")?.textContent || "";
          row.hidden = !(
            title.toLocaleLowerCase().includes(query) &&
            (filter.value === "all" || row.dataset.state === filter.value)
          );
          if (!row.hidden) matches++;
        }
        count.textContent = `${matches} record${matches === 1 ? "" : "s"}`;
        empty.hidden = matches !== 0;
        results.hidden = matches === 0;
      };
      listen(search, "input", update);
      listen(filter, "change", update);
      listen(clear, "click", () => {
        search.value = "";
        filter.value = "all";
        update();
        search.focus();
      });
      if (sort)
        listen(sort, "click", () => {
          const header = sort.closest("th");
          const ascending = header.getAttribute("aria-sort") !== "ascending";
          header.setAttribute("aria-sort", ascending ? "ascending" : "descending");
          [...rows]
            .sort(
              (a, b) =>
                (a.querySelector("th")?.textContent || "").localeCompare(
                  b.querySelector("th")?.textContent || "",
                ) * (ascending ? 1 : -1),
            )
            .forEach((row) => row.parentElement.append(row));
          count.textContent = `${rows.filter((row) => !row.hidden).length} records, sorted ${ascending ? "ascending" : "descending"}`;
        });
      update();
    }
    const dispose = () => {
      cleanups.forEach((fn) => fn());
      mounted.delete(scope);
    };
    mounted.set(scope, dispose);
    return dispose;
  }
  root.UniformInteractions = Object.freeze({ mount, setProgress });
})(globalThis);
