import { icon } from "./icons.js";
// Shared header behavior for the documentation and the Playground: the theme toggle.
// The toggle stays hidden until this runs; theme.js applies the saved choice before first paint.
const root = document.documentElement;
const toggle = document.getElementById("s-theme");
if (toggle) {
  // The label names the current theme; clicking switches to the other one.
  const sync = () => {
    const light = root.dataset.theme === "light";
    toggle.innerHTML = icon(light ? "moon" : "sun");
    toggle.setAttribute("aria-label", `Switch to ${light ? "dark" : "light"} theme`);
    toggle.title = toggle.getAttribute("aria-label");
  };
  sync();
  toggle.hidden = false;
  toggle.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    try {
      localStorage.setItem("u-docs-theme", root.dataset.theme);
    } catch {}
    sync();
    const status = document.getElementById("s-status");
    if (status) {
      status.textContent = "";
      setTimeout(
        () => (status.textContent = `${root.dataset.theme === "light" ? "Light" : "Dark"} theme`),
        50,
      );
    }
  });
}

// Warm the cache for the other page (docs <-> Playground) once this one is idle: its HTML, then the
// stylesheets and scripts it references, so the header link opens from cache. Skipped on Save-Data.
const other = document.querySelector("a[data-prefetch]");
if (other && !navigator.connection?.saveData) {
  const warm = async () => {
    try {
      const html = await (await fetch(other.href)).text();
      const refs = [...html.matchAll(/(?:href|src)="([^"]+\.(?:css|js)\?v=\w+)"/g)];
      await Promise.all(refs.map(([, ref]) => fetch(new URL(ref, other.href))));
    } catch {} // best effort: the link still works without it
  };
  const idle = () => (window.requestIdleCallback ? requestIdleCallback(warm) : setTimeout(warm, 500));
  if (document.readyState === "complete") idle();
  else addEventListener("load", idle, { once: true });
}
