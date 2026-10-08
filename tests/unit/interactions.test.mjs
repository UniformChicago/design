import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
// Host stubs exercise lifecycle/error behavior without claiming browser semantics.
class Element extends EventTarget {
  constructor() {
    super();
    this.dataset = {};
    this.attributes = {};
    this.hidden = true;
    this.focused = false;
  }
  setAttribute(k, v) {
    this.attributes[k] = v;
  }
  getAttribute(k) {
    return this.attributes[k] || null;
  }
  focus() {
    this.focused = true;
  }
}
function setup() {
  const trigger = new Element(),
    dialog = new Element(),
    close = new Element(),
    file = new Element(),
    output = new Element();
  trigger.dataset.uDialogOpen = "sample";
  close.dataset.uDialogClose = "confirmed";
  dialog.showModal = () => {
    dialog.open = true;
  };
  dialog.close = (value) => {
    if (value !== undefined) dialog.returnValue = value;
    dialog.open = false;
    dialog.dispatchEvent(new Event("close"));
  };
  close.closest = () => dialog;
  file.attributes["aria-describedby"] = "result";
  file.setCustomValidity = (value) => {
    file.validity = value;
  };
  output.attributes.role = "status";
  const scope = {
    querySelectorAll: (selector) =>
      ({
        "[data-u-dialog-open]": [trigger],
        "[data-u-dialog-close]": [close],
        "[data-u-file]": [file],
        "[data-u-collection]": [],
      })[selector] || [],
    querySelector: (selector) => ({ "#sample": dialog, "#result": output })[selector],
  };
  const context = vm.createContext({ CSS: { escape: (x) => x }, CustomEvent, document: scope });
  vm.runInContext(
    readFileSync(new URL("../../interactions/interactions.js", import.meta.url), "utf8"),
    context,
  );
  return { api: context.UniformInteractions, scope, trigger, dialog, close, file, output };
}
test("mount is idempotent, dispose removes listeners, and reopening clears stale result", () => {
  const { api, scope, trigger, dialog, close } = setup();
  const dispose = api.mount(scope);
  assert.equal(api.mount(scope), dispose);
  trigger.dispatchEvent(new Event("click"));
  close.dispatchEvent(new Event("click"));
  assert.equal(dialog.returnValue, "confirmed");
  assert.ok(trigger.focused);
  trigger.dispatchEvent(new Event("click"));
  assert.equal(dialog.returnValue, "");
  dispose();
  assert.equal(dialog.open, false);
  assert.ok(trigger.hidden);
  trigger.dispatchEvent(new Event("click"));
  assert.equal(dialog.open, false);
});
test("file errors clear after a valid replacement or reset, with no contents read", () => {
  const { api, scope, file, output } = setup();
  api.mount(scope);
  file.files = [{ name: "large.pdf", type: "application/pdf", size: 6 * 1024 * 1024 }];
  file.dispatchEvent(new Event("change"));
  assert.equal(file.attributes["aria-invalid"], "true");
  file.files = [{ name: "<sample>.pdf", type: "application/pdf", size: 100 }];
  file.dispatchEvent(new Event("change"));
  assert.equal(file.validity, "");
  assert.ok(output.textContent.includes("<sample>.pdf"));
  file.files = [];
  file.dispatchEvent(new Event("change"));
  assert.equal(output.textContent, "No file selected.");
  assert.equal(file.attributes["aria-invalid"], "false");
});

function progressSetup() {
  let now = 0,
    next = 0;
  const frames = new Map();
  const motion = { matches: false };
  const context = vm.createContext({
    performance: { now: () => now },
    matchMedia: () => motion,
    requestAnimationFrame: (callback) => {
      frames.set(++next, callback);
      return next;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
  });
  vm.runInContext(
    readFileSync(new URL("../../interactions/interactions.js", import.meta.url), "utf8"),
    context,
  );
  const meter = new Element();
  Object.assign(meter, { tagName: "PROGRESS", max: 3, value: 0 });
  return {
    api: context.UniformInteractions,
    meter,
    motion,
    frames,
    advance: (time) => {
      now = time;
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(now));
    },
  };
}
test("native progress animates between values, announces its target, and retargets without jumping", () => {
  const { api, meter, frames, advance } = progressSetup();
  api.setProgress(meter, 3);
  assert.equal(meter.value, 0);
  assert.equal(meter.getAttribute("aria-valuenow"), "3");
  advance(180);
  assert.ok(meter.value > 0 && meter.value < 3);
  const intermediate = meter.value;
  api.setProgress(meter, 1);
  assert.equal(meter.value, intermediate);
  assert.equal(frames.size, 1);
  advance(360);
  assert.ok(meter.value > 1 && meter.value < intermediate);
  advance(540);
  assert.equal(meter.value, 1);
  assert.equal(frames.size, 0);
});
test("native progress clamps values and respects reduced motion, including mid-animation changes", () => {
  const { api, meter, motion, frames, advance } = progressSetup();
  motion.matches = true;
  assert.equal(api.setProgress(meter, 9), 3);
  assert.equal(meter.value, 3);
  api.setProgress(meter, -1);
  assert.equal(meter.value, 0);
  assert.equal(frames.size, 0);
  motion.matches = false;
  api.setProgress(meter, 3);
  advance(100);
  motion.matches = true;
  advance(116);
  assert.equal(meter.value, 3);
  assert.equal(frames.size, 0);
  assert.throws(() => api.setProgress(meter, NaN), /finite/);
  assert.throws(() => api.setProgress({}, 1), /native progress/);
});
