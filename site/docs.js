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
// Each section's group link: the only sidebar links shown on narrow screens, where the sidebar is a
// sticky row of groups. The current group is marked too, and the row scrolls to keep it in view.
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
    // Below the sticky header (and the group row on narrow screens); the top 45% of the viewport counts.
    { rootMargin: "-130px 0px -55% 0px" },
  );
  sections.forEach((s) => io.observe(s));
}
