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
