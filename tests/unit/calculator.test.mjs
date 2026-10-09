import test from "node:test";
import assert from "node:assert/strict";
import { monthlyPayment } from "../../workflows/calculator-preview.js";

test("mortgage payment remains finite at zero, tiny rates and long terms", () => {
  assert.ok(Math.abs(monthlyPayment(360000, 6.5, 30) - 2275.44488) < 0.01);
  assert.equal(monthlyPayment(360000, 0, 30), 1000);
  assert.ok(Math.abs(monthlyPayment(360000, 1e-15, 30) - 1000) < 0.01);
  assert.equal(monthlyPayment(360000, 6.5, 0), 0);
  assert.equal(monthlyPayment(-1, 6.5, 30), 0);
  assert.equal(monthlyPayment(NaN, 6.5, 30), 0);
  assert.ok(Number.isFinite(monthlyPayment(1e12, 100, 10000)));
});
