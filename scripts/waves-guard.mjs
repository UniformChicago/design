#!/usr/bin/env node
// waves.js must reject inputs that would hang or inject markup.
import { contours, contoursSvg } from "../atmosphere/waves.js";
const throws = (fn) => {
  try {
    fn();
    return false;
  } catch {
    return true;
  }
};
const cases = [
  ["step 0", () => contours(100, 100, 0, { step: 0 })],
  ["negative width", () => contours(-1, 100)],
  ["NaN height", () => contours(100, NaN)],
  ["too many strands", () => contours(100, 100, 0, { strands: 10_000 })],
  ["markup in a color", () => contoursSvg(10, 10, { signal: '"/><script>', lake: "#8fc3d9" })],
  ["missing color", () => contoursSvg(10, 10, { lake: "#8fc3d9" })],
];
const failed = cases.filter(([, fn]) => !throws(fn)).map(([name]) => name);
if (failed.length) {
  console.error(`waves.js accepted bad input: ${failed.join(", ")}`);
  process.exit(1);
}
if (!contoursSvg(10, 10, { signal: "#c8402a", lake: "#8fc3d9" }).startsWith("<svg")) process.exit(1);
console.log("waves.js rejects bad input.");
