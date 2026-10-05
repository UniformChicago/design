// Uniform "Atmosphere": folded contour lines, the brand's background effect.
// One implementation for every surface:
//   - contours(width, height, options) → polylines (pure math; used for static SVG in Node)
//   - mountAtmosphere(canvas) → animated canvas in the browser (reduced-motion aware)
// The math is the original from marketing's Atmosphere.astro.

export const DEFAULTS = { strands: 52, band: 0.32, spread: 0.48, center: 0.5, step: 12 };

/** Contour polylines at time t. Each item: { points: [[x, y], ...], alpha, width }. */
const HEX = /^#[0-9a-fA-F]{3,8}$/;
const finite = (n, min, max, name) => {
  if (typeof n !== "number" || !Number.isFinite(n) || n < min || n > max)
    throw new RangeError(`${name} must be a number from ${min} to ${max}`);
  return n;
};

export function contours(width, height, t = 0, options = {}) {
  const o = { ...DEFAULTS, ...options };
  finite(width, 1, 20000, "width");
  finite(height, 1, 20000, "height");
  finite(t, -1e6, 1e6, "t");
  finite(o.strands, 1, 200, "strands");
  finite(o.step, 1, 1000, "step"); // step 0 would never terminate
  const lines = [];
  for (let strand = 0; strand < o.strands; strand++) {
    const depth = o.strands === 1 ? 0.5 : strand / (o.strands - 1);
    const points = [];
    for (let x = -40; x <= width + 40; x += o.step) {
      const u = x / width;
      const fold = Math.sin(u * 5.1 + t * 0.19 + depth * 2.4);
      const ripple = Math.sin(u * 9 - t * 0.13 + depth * 3) * 0.06;
      points.push([x, height * (o.center + fold * o.band + ripple + (depth - 0.5) * o.spread)]);
    }
    lines.push({
      points,
      alpha: 0.08 + Math.pow(Math.sin(depth * Math.PI), 4) * 0.25,
      width: strand % 6 === 0 ? 1.2 : 0.6,
    });
  }
  return lines;
}

/** Static SVG string of the contours (for PDFs, OG images, print). */
export function contoursSvg(width, height, { t = 2.6, signal, lake, opacity = 1, ...options } = {}) {
  // Values are written into SVG markup, so only plain hex colors are accepted.
  for (const [name, value] of [
    ["signal", signal],
    ["lake", lake],
  ])
    if (typeof value !== "string" || !HEX.test(value))
      throw new TypeError(`${name} must be a hex color like #c8402a`);
  finite(opacity, 0, 1, "opacity");
  const lines = contours(width, height, t, options);
  const grad = `<linearGradient id="u-wave" gradientUnits="userSpaceOnUse" x1="0" y1="${height}" x2="${width}" y2="0"><stop offset="0" stop-color="${signal}"/><stop offset=".38" stop-color="${lake}"/><stop offset="1" stop-color="${lake}"/></linearGradient>`;
  const paths = lines
    .map(
      (l) =>
        `<polyline points="${l.points.map(([x, y]) => `${x},${y.toFixed(1)}`).join(" ")}" fill="none" stroke="url(#u-wave)" stroke-opacity="${(l.alpha * opacity).toFixed(3)}" stroke-width="${l.width}"/>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true"><defs>${grad}</defs>${paths}</svg>`;
}

/** Animated canvas. Pauses when hidden, for reduced motion, and for crawlers. */
export function mountAtmosphere(canvas) {
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return () => {};
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const css = getComputedStyle(document.documentElement);
  const lake = css.getPropertyValue("--u-lake-light").trim() || "#8fc3d9";
  const signal = css.getPropertyValue("--u-signal").trim() || "#c8402a";
  let width = innerWidth,
    height = innerHeight,
    frame = 0,
    last = 0,
    time = 0;
  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createLinearGradient(0, height, width, 0);
    gradient.addColorStop(0, signal);
    gradient.addColorStop(0.38, lake);
    gradient.addColorStop(1, lake);
    for (const l of contours(width, height, time)) {
      ctx.beginPath();
      l.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.strokeStyle = gradient;
      ctx.globalAlpha = l.alpha;
      ctx.lineWidth = l.width;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  const resize = () => {
    width = innerWidth;
    height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  };
  const loop = (now) => {
    if (now - last >= 50) {
      time += Math.min((now - last) / 1000, 0.1);
      last = now;
      draw();
    }
    frame = requestAnimationFrame(loop);
  };
  const isBot = /Lighthouse|Googlebot|Applebot/i.test(navigator.userAgent);
  const sync = () => {
    cancelAnimationFrame(frame);
    if (!reduce.matches && !document.hidden && !isBot) {
      last = performance.now();
      frame = requestAnimationFrame(loop);
    }
  };
  reduce.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  addEventListener("resize", resize);
  resize();
  sync();
  return () => {
    cancelAnimationFrame(frame);
    reduce.removeEventListener("change", sync);
    document.removeEventListener("visibilitychange", sync);
    removeEventListener("resize", resize);
  };
}
