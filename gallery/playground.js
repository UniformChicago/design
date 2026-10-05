import { presets } from "./presets.js";
const $ = (id) => document.getElementById(id);
const drafts = new Map();
let active = presets[0];
// The preview starts in the page theme; its own Light/Dark control changes only the preview.
let theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
let renderTimer;
let copyTimer;
const css = new URL("../dist/design.css", location.href).href;
const previewCss = new URL("preview.css", location.href).href;
const escapeAttribute = (s) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

// The preview allows same-origin styles and fonts, but no scripts or form submissions.
// Its CSP permits only the design styles and their self-hosted fonts.
function render() {
  clearTimeout(renderTimer);
  const policy = `default-src 'none'; style-src ${css} ${previewCss}; font-src ${new URL("../dist/fonts/", location.href).href}; base-uri 'none'; form-action 'none'`;
  const parsed = new DOMParser().parseFromString($("editor").value, "text/html");
  parsed
    .querySelectorAll("script, style, link, meta, base, iframe, object, embed")
    .forEach((node) => node.remove());
  parsed.querySelectorAll("*").forEach((node) => {
    for (const attr of [...node.attributes]) {
      if (
        /^on/i.test(attr.name) ||
        ["style", "href", "src", "srcset", "action", "formaction", "target", "ping", "autofocus"].includes(
          attr.name,
        )
      )
        node.removeAttribute(attr.name);
    }
  });
  $("preview").srcdoc =
    `<!doctype html><html lang="en" data-theme="${theme}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${escapeAttribute(policy)}"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${css}"><link rel="stylesheet" href="${previewCss}"><title>Pattern preview</title></head><body class="u-root"><main class="p-content"><h1 class="u-sr">Component preview</h1>${parsed.body.innerHTML}</main></body></html>`;
  $("canvas").dataset.theme = theme;
}
function save() {
  drafts.set(active.id, {
    code: $("editor").value,
    title: $("sample-title").value,
    state: $("variant").value,
  });
}
function generate() {
  $("editor").value = active.render($("sample-title").value, $("variant").value);
  save();
  render();
}
function select(preset) {
  active = preset;
  const draft = drafts.get(active.id);
  $("variant").replaceChildren(...active.states.map((state) => new Option(state, state)));
  $("variant").value = draft?.state ?? active.states[0];
  $("sample-title").value = draft?.title ?? active.title;
  $("editor").value = draft?.code ?? active.render(active.title, active.states[0]);
  $("component-docs").href = `../#${active.section}`;
  $("preview-caption").textContent = active.name;
  document
    .querySelectorAll("[data-preset]")
    .forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.preset === active.id)));
  render();
}
for (const preset of presets) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.preset = preset.id;
  const name = document.createElement("strong");
  name.textContent = preset.name;
  const description = document.createElement("span");
  description.textContent = preset.description;
  button.append(name, description);
  button.addEventListener("click", () => {
    save();
    select(preset);
  });
  $("presets").append(button);
}
$("variant").addEventListener("change", generate);
$("sample-title").addEventListener("input", generate);
$("editor").addEventListener("input", () => {
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
    render();
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
$("workspace").hidden = false;
select(active);
