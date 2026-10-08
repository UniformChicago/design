import { icon } from "./icons.js";
// Docs-site enhancements: copy buttons and the current section in the sidebar (theme toggle: shell.js).
// The page reads fine without it; the buttons stay hidden until this runs.
const status = document.getElementById("s-status");
const say = (text) => {
  if (!status) return;
  status.textContent = "";
  setTimeout(() => (status.textContent = text), 50);
};

if (navigator.clipboard) {
  for (const button of document.querySelectorAll("button[data-copy]")) {
    button.innerHTML = icon("copy");
    button.hidden = false;
    let reset;
    button.addEventListener("click", async () => {
      const target = button.dataset.copyFrom && document.getElementById(button.dataset.copyFrom);
      const text = target ? target.textContent : button.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        clearTimeout(reset);
        button.innerHTML = icon("check");
        button.dataset.copied = "true";
        say("Copied to clipboard");
        reset = setTimeout(() => {
          button.innerHTML = icon("copy");
          delete button.dataset.copied;
        }, 1500);
      } catch {
        say("Copy failed");
      }
    });
  }
}

const links = new Map(
  [...document.querySelectorAll(".s-side li a[href^='#']")].map((a) => [a.getAttribute("href").slice(1), a]),
);
// Mark the active section and group; keep the active group visible in the narrow scrollable row.
const side = document.querySelector(".s-side");
const groupOf = new Map(
  [...links].map(([id, a]) => [id, a.closest("ul")?.previousElementSibling?.querySelector("a")]),
);
const sections = [...links.keys()].map((id) => document.getElementById(id)).filter(Boolean);
if ("IntersectionObserver" in window && sections.length) {
  const visible = new Set();
  let group;
  const mark = () => {
    const current = sections.find((s) => visible.has(s.id));
    if (!current) return; // between observations: keep the last mark
    for (const [id, a] of links) {
      if (id === current.id) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    }
    const next = groupOf.get(current.id);
    if (!next || next === group) return;
    group?.removeAttribute("aria-current");
    next.setAttribute("aria-current", "true");
    group = next;
    if (side.scrollWidth > side.clientWidth) {
      const left = next.offsetLeft - (side.clientWidth - next.offsetWidth) / 2;
      side.scrollTo({
        left,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    }
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id);
      mark();
    },
    // Below the shared header; the top part of the viewport identifies the active section.
    { rootMargin: "-180px 0px -55% 0px" },
  );
  sections.forEach((s) => io.observe(s));
}

if (globalThis.UniformContextMenu) globalThis.UniformContextMenu.mount(document);
document.addEventListener("uniform:context-action", (event) => {
  if (event.detail.trigger.dataset.uContextMenu === "example-context") {
    document.getElementById("example-context-status").textContent = "Sample opened for review.";
  }
});

// Initialize examples after all deferred scripts have loaded.
const mountExamples = () => globalThis.UniformInteractions?.mount(document);
if (globalThis.UniformInteractions || document.readyState === "complete") mountExamples();
else document.addEventListener("DOMContentLoaded", mountExamples, { once: true });
document.addEventListener("uniform:dialog-close", (event) => {
  if (event.target.dataset.uDialogOpen !== "example-dialog") return;
  document.getElementById("example-dialog-status").textContent =
    event.detail.value === "confirmed"
      ? "Sample action confirmed. No records were changed."
      : "Action canceled. Your sample stays in place.";
});
