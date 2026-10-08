import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function harness({ supported = true } = {}) {
  const doc = new EventTarget();
  class Element extends EventTarget {
    attrs = {};
    dataset = {};
    hidden = false;
    isConnected = true;
    setAttribute(key, value) {
      this.attrs[key] = value;
    }
    removeAttribute(key) {
      delete this.attrs[key];
    }
    hasAttribute(key) {
      return key in this.attrs;
    }
    focus() {
      doc.activeElement = this;
    }
    getBoundingClientRect() {
      return { left: 30, bottom: 80, width: 220, height: 140 };
    }
  }
  const trigger = new Element();
  trigger.dataset.uContextMenu = "actions";
  trigger.attrs["data-u-context-open"] = "";
  trigger.hidden = true;
  const menu = new Element();
  menu.id = "actions";
  menu.open = false;
  menu.matches = () => menu.open;
  menu.contains = (target) => items.includes(target);
  menu.showPopover = supported
    ? () => {
        menu.open = true;
      }
    : undefined;
  menu.hidePopover = () => {
    menu.open = false;
  };
  const items = [new Element(), new Element(), new Element()];
  items[1].disabled = true;
  items.forEach((item, index) => {
    item.dataset.uContextAction = String(index);
    item.closest = () => item;
  });
  menu.querySelectorAll = () => items;
  const sheet = {
    href: "https://example.test/dist/context-menu.css?v=test",
    cssRules: [],
    insertRule() {
      this.cssRules.push({ style: {} });
      return this.cssRules.length - 1;
    },
    deleteRule(index) {
      this.cssRules.splice(index, 1);
    },
  };
  doc.styleSheets = [sheet];
  doc.querySelectorAll = () => [trigger];
  doc.querySelector = () => menu;
  const win = new EventTarget();
  const scope = {
    document: doc,
    window: win,
    innerWidth: 320,
    innerHeight: 240,
    URL,
    AbortController,
    AbortSignal,
    setTimeout,
    CustomEvent,
    CSS: { escape: (value) => value },
  };
  vm.runInNewContext(
    readFileSync(new URL("../../interactions/context-menu.js", import.meta.url), "utf8"),
    scope,
  );
  const dispatch = (target, type, values = {}) => {
    const event = new Event(type, { cancelable: true });
    Object.entries(values).forEach(([key, value]) => Object.defineProperty(event, key, { value }));
    target.dispatchEvent(event);
    return event;
  };
  return { doc, win, menu, trigger, items, sheet, dispatch, api: scope.UniformContextMenu };
}
test("context menu clamps to the viewport, skips disabled actions and restores keyboard focus", () => {
  const h = harness();
  const dispose = h.api.mount(h.doc);
  assert.equal(h.api.mount(h.doc), dispose);
  assert.equal(h.trigger.hidden, false);
  const event = h.dispatch(h.trigger, "contextmenu", { clientX: 310, clientY: 235 });
  assert.equal(event.defaultPrevented, true);
  assert.equal(h.menu.open, true);
  assert.equal(h.sheet.cssRules[0].style.left, "92px");
  assert.equal(h.sheet.cssRules[0].style.top, "92px");
  assert.equal(h.doc.activeElement, h.items[0]);
  h.dispatch(h.menu, "keydown", { key: "ArrowDown" });
  assert.equal(h.doc.activeElement, h.items[2]);
  h.dispatch(h.menu, "keydown", { key: "Escape" });
  assert.equal(h.menu.open, false);
  assert.equal(h.doc.activeElement, h.trigger);
  assert.equal(h.trigger.attrs.style, undefined);
  dispose();
  assert.equal(h.sheet.cssRules.length, 0);
  assert.equal(h.trigger.hidden, true);
  assert.equal(h.dispatch(h.trigger, "contextmenu").defaultPrevented, false);
});
test("context actions retain their origin and native menus survive unsupported hosts and Shift-right-click", () => {
  const h = harness();
  const dispose = h.api.mount(h.doc);
  let action;
  h.trigger.addEventListener("uniform:context-action", (event) => {
    action = event.detail;
  });
  assert.equal(h.dispatch(h.trigger, "contextmenu", { shiftKey: true }).defaultPrevented, false);
  h.dispatch(h.trigger, "keydown", { key: "F10", shiftKey: true });
  h.dispatch(h.menu, "click", { target: h.items[2] });
  assert.equal(action.action, "2");
  assert.equal(action.trigger, h.trigger);
  assert.equal(h.menu.open, false);
  dispose();
  const fallback = harness({ supported: false });
  fallback.api.mount(fallback.doc);
  assert.equal(fallback.dispatch(fallback.trigger, "contextmenu").defaultPrevented, false);
  assert.equal(fallback.trigger.hidden, true);
});
test("a right-click that is still held opens after release, so the release cannot light-dismiss it", async () => {
  const h = harness();
  const dispose = h.api.mount(h.doc);
  const event = h.dispatch(h.trigger, "contextmenu", { clientX: 40, clientY: 50, buttons: 2 });
  assert.equal(event.defaultPrevented, true);
  assert.equal(h.menu.open, false);
  h.dispatch(h.win, "pointerup");
  assert.equal(h.menu.open, false);
  await new Promise((resolve) => setTimeout(resolve));
  assert.equal(h.menu.open, true);
  assert.equal(h.sheet.cssRules[0].style.left, "40px");
  assert.equal(h.doc.activeElement, h.items[0]);
  dispose();
});
