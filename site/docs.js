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
    if (next && next !== group) {
      group?.removeAttribute("aria-current");
      next.setAttribute("aria-current", "true");
      group = next;
    }
    const activeLink = links.get(current.id);
    if (activeLink && side.scrollWidth > side.clientWidth) {
      const left = activeLink.offsetLeft - (side.clientWidth - activeLink.offsetWidth) / 2;
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

// Animate components into view as you scroll out of the landing page
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("s-in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
  );
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".s-example").forEach((example) => {
      observer.observe(example);
    });
  });
}

// Command Palette
let catalogCache = null;
const openSearch = async () => {
  let backdrop = document.getElementById("s-palette-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "s-palette-backdrop";
    backdrop.className = "s-palette-backdrop";
    backdrop.innerHTML = `
      <div class="s-palette" role="dialog" aria-modal="true">
        <input type="text" class="s-palette-input" placeholder="Search docs, components, tokens..." aria-label="Search" autocomplete="off" spellcheck="false" />
        <div class="s-palette-results" role="listbox"></div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const input = backdrop.querySelector(".s-palette-input");
    const results = backdrop.querySelector(".s-palette-results");

    let items = [];
    let selectedIndex = -1;

    const render = (query) => {
      results.innerHTML = "";
      if (!catalogCache) return;

      const q = query.toLowerCase();
      items = [];

      for (const [id, comp] of Object.entries(catalogCache.components || {})) {
        if (
          id.toLowerCase().includes(q) ||
          comp.name.toLowerCase().includes(q) ||
          comp.description.toLowerCase().includes(q)
        ) {
          items.push({ id: `#${id}`, name: comp.name, cat: "Component" });
        }
      }
      for (const [id, pat] of Object.entries(catalogCache.patterns || {})) {
        if (
          id.toLowerCase().includes(q) ||
          pat.name.toLowerCase().includes(q) ||
          pat.description.toLowerCase().includes(q)
        ) {
          items.push({ id: `patterns/#${id}`, name: pat.name, cat: "Pattern" });
        }
      }
      for (const [id, tok] of Object.entries(catalogCache.tokens?.themes?.light || {})) {
        if (id.toLowerCase().includes(q)) {
          items.push({ id: `#theme`, name: `var(--${id})`, cat: "Token" });
        }
      }

      items = items.slice(0, 8); // Max 8 results
      selectedIndex = items.length > 0 ? 0 : -1;

      items.forEach((item, index) => {
        const el = document.createElement("a");
        el.className = "s-palette-item";
        el.href = item.id;
        el.role = "option";
        el.setAttribute("aria-selected", index === selectedIndex);
        el.innerHTML = `<span class="s-palette-item-name">${item.name}</span><span class="s-palette-item-cat">${item.cat}</span>`;
        el.addEventListener("click", () => closeSearch());
        el.addEventListener("mouseenter", () => {
          selectedIndex = index;
          updateSelection();
        });
        results.appendChild(el);
      });
    };

    const updateSelection = () => {
      const els = results.querySelectorAll(".s-palette-item");
      els.forEach((el, i) => el.setAttribute("aria-selected", i === selectedIndex));
    };

    input.addEventListener("input", (e) => render(e.target.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        updateSelection();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        updateSelection();
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        window.location.href = items[selectedIndex].id;
        closeSearch();
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeSearch();
      }
    });

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeSearch();
    });
  }

  backdrop.hidden = false;
  backdrop.querySelector("input").value = "";
  backdrop.querySelector("input").focus();

  if (!catalogCache) {
    try {
      const res = await fetch("dist/catalog.json");
      catalogCache = await res.json();
      backdrop.querySelector("input").dispatchEvent(new Event("input"));
    } catch (e) {
      console.error("Failed to load catalog", e);
    }
  } else {
    backdrop.querySelector("input").dispatchEvent(new Event("input"));
  }
};

const closeSearch = () => {
  const backdrop = document.getElementById("s-palette-backdrop");
  if (backdrop) backdrop.hidden = true;
};

document.addEventListener("keydown", (e) => {
  if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    openSearch();
  }
});
document.querySelector(".s-side-search")?.addEventListener("click", openSearch);
