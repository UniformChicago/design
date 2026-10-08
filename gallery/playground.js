import { presets } from "./presets.js";
const $ = (id) => document.getElementById(id);
const drafts = new Map();
let active = presets[0];
let mode = "live";
const liveFrame = $("live-preview");
// The preview starts in the page theme; its own Light/Dark control changes only the preview.
let theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
let renderTimer;
let copyTimer;
$("customize-toggle").addEventListener("click", () => {
  const open = $("customize-toggle").getAttribute("aria-expanded") !== "true";
  $("customize-toggle").setAttribute("aria-expanded", String(open));
  $("starter-settings").classList.toggle("g-settings--open", open);
});
const css = new URL("../dist/design.css", location.href).href;
const mapCss = new URL("../dist/map.css", location.href).href;
const contextCss = new URL("../dist/context-menu.css", location.href).href;
const previewCss = new URL("preview.css", location.href).href;
const escapeAttribute = (s) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

// Keep the sandbox and its styles loaded across edits. Replacing srcdoc for every
// state restarts navigation, fonts and scroll position even though the frame is fixed.
const frame = $("preview");
let previewReady = Boolean(frame.contentDocument?.querySelector(".p-content"));
let pendingContent;
function updatePreview() {
  const doc = frame.contentDocument;
  const content = doc?.querySelector(".p-content");
  if (!previewReady || !content || !pendingContent) return;
  doc.documentElement.dataset.theme = theme;
  content.replaceChildren(doc.importNode(pendingContent, true));
}
frame.addEventListener("load", () => {
  previewReady = true;
  updatePreview();
});
const policy = `default-src 'none'; style-src ${css} ${previewCss} ${mapCss} ${contextCss}; font-src ${new URL("../dist/fonts/", location.href).href}; base-uri 'none'; form-action 'none'`;
if (!frame.getAttribute("srcdoc"))
  frame.srcdoc = `<!doctype html><html lang="en" data-theme="${theme}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${escapeAttribute(policy)}"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${css}"><link rel="stylesheet" href="${previewCss}"><link rel="stylesheet" href="${mapCss}"><link rel="stylesheet" href="${contextCss}"><title>Pattern preview</title></head><body class="u-root"><main class="p-content" aria-label="Component preview"></main></body></html>`;

function syncPreview() {
  const live = Boolean(active.live && mode === "live");
  frame.hidden = live;
  liveFrame.hidden = !live;
  if (live && liveFrame.getAttribute("src") !== active.live) liveFrame.src = active.live;
  if (liveFrame.contentDocument?.documentElement)
    liveFrame.contentDocument.documentElement.dataset.theme = theme;
  $("preview-mode-label").textContent = live ? "Interactive preview" : "Markup preview";
  document.querySelectorAll("[data-preview-mode]").forEach((button) => {
    button.disabled = button.dataset.previewMode === "live" && !active.live;
    button.setAttribute("aria-pressed", String(button.dataset.previewMode === (live ? "live" : "markup")));
  });
}
liveFrame.addEventListener("load", syncPreview);
function render(forceMarkup = true) {
  if (forceMarkup) mode = "markup";
  clearTimeout(renderTimer);
  const parsed = new DOMParser().parseFromString($("editor").value, "text/html");
  parsed
    .querySelectorAll("script, style, link, meta, base, iframe, object, embed")
    .forEach((node) => node.remove());
  parsed.querySelectorAll("*").forEach((node) => {
    for (const attr of [...node.attributes]) {
      if (
        /^on/i.test(attr.name) ||
        ["style", "src", "srcset", "action", "formaction", "target", "ping", "autofocus"].includes(
          attr.name,
        ) ||
        (attr.name === "href" && !(node.localName === "use" && /^#[\w-]+$/.test(attr.value)))
      )
        node.removeAttribute(attr.name);
    }
  });
  const content = parsed.createDocumentFragment();
  const heading = parsed.createElement("h1");
  heading.className = "u-sr";
  heading.textContent = "Component preview";
  content.append(heading);
  if (active.live) {
    const app = parsed.createElement("div");
    app.className = "u-app p-markup";
    app.append(...parsed.body.childNodes);
    content.append(app);
  } else content.append(...parsed.body.childNodes);
  pendingContent = content;
  updatePreview();
  $("canvas").dataset.theme = theme;
  syncPreview();
}
function save() {
  drafts.set(active.id, {
    code: $("editor").value,
    title: $("sample-title").value,
    state: $("variant").value,
    mode,
  });
}
function generate() {
  $("editor").value = active.render($("sample-title").value, $("variant").value);
  render();
  save();
}
function select(preset) {
  active = preset;
  $("starter-picker").value = preset.id;
  const draft = drafts.get(active.id);
  mode = draft?.mode ?? (active.live ? "live" : "markup");
  $("variant").replaceChildren(...active.states.map((state) => new Option(state, state)));
  $("variant").value = draft?.state ?? active.states[0];
  $("variant").disabled = active.states.length === 1;
  $("sample-title").value = draft?.title ?? active.title;
  $("editor").value = draft?.code ?? active.render(active.title, active.states[0]);
  $("component-docs").href = `../#${active.section}`;
  $("preview-caption").textContent = active.name;
  document
    .querySelectorAll("[data-preset]")
    .forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.preset === active.id)));
  render(false);
}
if (!$("starter-picker").options.length)
  $("starter-picker").replaceChildren(...presets.map((preset) => new Option(preset.name, preset.id)));
$("starter-picker").addEventListener("change", () => {
  const preset = presets.find((preset) => preset.id === $("starter-picker").value);
  if (!preset) return;
  save();
  select(preset);
  history.replaceState(null, "", `#${preset.id}`);
});
for (const preset of presets) {
  let button = document.querySelector(`[data-preset="${preset.id}"]`);
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.dataset.preset = preset.id;
    const name = document.createElement("strong");
    name.textContent = preset.name;
    const description = document.createElement("span");
    description.textContent = preset.description;
    button.append(name, description);
    $("presets").append(button);
  }
  button.addEventListener("click", () => {
    save();
    select(preset);
    history.replaceState(null, "", `#${preset.id}`);
  });
}
$("variant").addEventListener("change", generate);
$("sample-title").addEventListener("input", generate);
$("editor").addEventListener("input", () => {
  mode = "markup";
  syncPreview();
  save();
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 250);
});
$("reset").addEventListener("click", () => {
  drafts.delete(active.id);
  select(active);
  $("status").textContent = "Pattern reset to its starting point.";
});
$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("editor").value);
    clearTimeout(copyTimer);
    $("copy").textContent = "Copied";
    $("status").textContent = "HTML copied to clipboard.";
    copyTimer = setTimeout(() => {
      $("copy").textContent = "Copy HTML";
    }, 1500);
  } catch {
    $("status").textContent = "Copy unavailable. Select the HTML and copy it manually.";
  }
});
document.querySelectorAll("[data-theme-choice]").forEach((button) =>
  button.addEventListener("click", () => {
    theme = button.dataset.themeChoice;
    document
      .querySelectorAll("[data-theme-choice]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    render(false);
  }),
);
document
  .querySelectorAll("[data-theme-choice]")
  .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeChoice === theme)));
document.querySelectorAll("[data-width]").forEach((button) =>
  button.addEventListener("click", () => {
    $("canvas").dataset.width = button.dataset.width;
    document
      .querySelectorAll("[data-width]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
  }),
);
document.querySelectorAll("[data-preview-mode]").forEach((button) =>
  button.addEventListener("click", () => {
    mode = button.dataset.previewMode;
    syncPreview();
    save();
  }),
);
window.addEventListener("hashchange", () => {
  const starter = presets.find((preset) => `#${preset.id}` === location.hash);
  if (starter) {
    save();
    select(starter);
  }
});
select(presets.find((preset) => `#${preset.id}` === location.hash) ?? presets[0]);
