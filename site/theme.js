// Applies a saved theme before first paint (a blocking script in <head>, so there's no flash).
// Docs-site only; the design system itself needs no JavaScript.
try {
  const t = localStorage.getItem("u-docs-theme");
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
} catch {}
