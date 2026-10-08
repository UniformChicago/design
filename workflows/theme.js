// Apply the saved choice or system preference before CSS paints; dark is the HTML fallback.
(() => {
  let saved;
  try {
    saved = localStorage.getItem("u-docs-theme");
  } catch {}
  document.documentElement.dataset.theme =
    saved === "dark" || saved === "light"
      ? saved
      : matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
})();
