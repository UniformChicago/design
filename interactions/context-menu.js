// Optional context actions using native popovers and a linked stylesheet for CSP-safe positioning.
(() => {
  const mounts = new WeakMap();
  function mount(scope = document) {
    if (mounts.has(scope)) return mounts.get(scope);
    const abort = new AbortController();
    const cleanups = [];
    const listen = (node, event, handler, options = {}) =>
      node.addEventListener(event, handler, { signal: abort.signal, ...options });
    const menus = new Map();
    for (const trigger of scope.querySelectorAll("[data-u-context-menu]")) {
      const menu = scope.querySelector(`#${CSS.escape(trigger.dataset.uContextMenu)}`);
      if (!menu || typeof menu.showPopover !== "function") continue;
      let state = menus.get(menu);
      if (!state) {
        let sheet, rule;
        for (const candidate of document.styleSheets) {
          try {
            // Keep dynamic positions in a linked, same-origin sheet; never add inline styles.
            if (!candidate.href || !new URL(candidate.href).pathname.endsWith(".css")) continue;
            const index = candidate.insertRule(`#${CSS.escape(menu.id)} {}`, candidate.cssRules.length);
            sheet = candidate;
            rule = candidate.cssRules[index];
            break;
          } catch {
            /* Unreadable stylesheets leave the browser menu available. */
          }
        }
        if (!rule) continue;
        state = { trigger: null, rule, menu };
        menus.set(menu, state);
        const items = () =>
          [...menu.querySelectorAll('[role="menuitem"]')].filter((item) => !item.disabled && !item.hidden);
        const close = (restore = false) => {
          if (menu.matches(":popover-open")) menu.hidePopover();
          state.trigger?.setAttribute("aria-expanded", "false");
          if (restore && state.trigger?.isConnected) state.trigger.focus({ preventScroll: true });
        };
        state.close = close;
        listen(menu, "keydown", (event) => {
          const enabled = items();
          const index = enabled.indexOf(document.activeElement);
          let next;
          if (event.key === "ArrowDown") next = (index + 1) % enabled.length;
          if (event.key === "ArrowUp") next = (index - 1 + enabled.length) % enabled.length;
          if (event.key === "Home") next = 0;
          if (event.key === "End") next = enabled.length - 1;
          if (next !== undefined) {
            event.preventDefault();
            enabled[next]?.focus();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            close(true);
          }
          if (event.key === "Tab") close(true);
        });
        listen(menu, "click", (event) => {
          const item = event.target.closest('[role="menuitem"]');
          if (!item || item.disabled || !state.trigger) return;
          const origin = state.trigger;
          close(true);
          origin.dispatchEvent(
            new CustomEvent("uniform:context-action", {
              bubbles: true,
              detail: { action: item.dataset.uContextAction, trigger: origin },
            }),
          );
        });
        // Native light-dismiss preserves the new click target rather than stealing its focus.
        listen(menu, "toggle", (event) => {
          if (event.newState === "closed") state.trigger?.setAttribute("aria-expanded", "false");
        });
        const outside = (event) => {
          if (menu.matches(":popover-open") && !menu.contains(event.target)) close();
        };
        listen(document, "scroll", outside, { capture: true });
        listen(window, "resize", () => close());
        cleanups.push(() => {
          close();
          const index = [...sheet.cssRules].indexOf(rule);
          if (index >= 0) sheet.deleteRule(index);
        });
      }
      trigger.setAttribute("aria-haspopup", "menu");
      trigger.setAttribute("aria-controls", menu.id);
      if (trigger.hasAttribute("data-u-context-open")) trigger.hidden = false;
      const open = (event, keyboard = false, focus = true) => {
        if (event.shiftKey && event.type === "contextmenu") return;
        event.preventDefault();
        for (const other of menus.values()) other.close();
        state.trigger = trigger;
        trigger.dispatchEvent(
          new CustomEvent("uniform:context-open", { bubbles: true, detail: { menu, trigger } }),
        );
        state.rule.style.left = "0px";
        state.rule.style.top = "0px";
        menu.showPopover();
        const box = menu.getBoundingClientRect();
        const anchor = trigger.getBoundingClientRect();
        const x = keyboard ? anchor.left : event.clientX;
        const y = keyboard ? anchor.bottom : event.clientY;
        state.rule.style.left = `${Math.max(8, Math.min(x, innerWidth - box.width - 8))}px`;
        state.rule.style.top = `${Math.max(8, Math.min(y, innerHeight - box.height - 8))}px`;
        trigger.setAttribute("aria-expanded", "true");
        if (focus)
          [...menu.querySelectorAll('[role="menuitem"]')]
            .find((item) => !item.disabled && !item.hidden)
            ?.focus({ preventScroll: true });
      };
      listen(trigger, "contextmenu", (event) => {
        const keyboard = event.detail === 0 && event.clientX === 0 && event.clientY === 0;
        if (keyboard || !event.buttons || event.shiftKey) return open(event, keyboard);
        // macOS, Linux and touch long-press fire contextmenu while the pointer is still down; the
        // release would light-dismiss a popover opened now, so open once it has been handled.
        event.preventDefault();
        const release = new AbortController();
        const show = () => {
          release.abort();
          setTimeout(() => open(event));
        };
        for (const type of ["pointerup", "pointercancel"])
          listen(window, type, show, {
            capture: true,
            once: true,
            signal: AbortSignal.any([abort.signal, release.signal]),
          });
      });
      listen(trigger, "keydown", (event) => {
        if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) open(event, true);
      });
      if (trigger.hasAttribute("data-u-context-open")) {
        let wasOpen = false;
        listen(trigger, "pointerdown", () => {
          wasOpen = state.trigger === trigger && menu.matches(":popover-open");
        });
        listen(trigger, "click", (event) => {
          if (wasOpen || (state.trigger === trigger && menu.matches(":popover-open"))) {
            wasOpen = false;
            event.preventDefault();
            state.close();
          } else
            open(event, true, event.detail === 0 || !globalThis.matchMedia?.("(pointer: coarse)").matches);
        });
      }
      cleanups.push(() => {
        trigger.removeAttribute("aria-haspopup");
        trigger.removeAttribute("aria-controls");
        trigger.removeAttribute("aria-expanded");
        if (trigger.hasAttribute("data-u-context-open")) trigger.hidden = true;
      });
    }
    const dispose = () => {
      abort.abort();
      cleanups.forEach((fn) => fn());
      mounts.delete(scope);
    };
    mounts.set(scope, dispose);
    return dispose;
  }
  globalThis.UniformContextMenu = Object.freeze({ mount });
})();
