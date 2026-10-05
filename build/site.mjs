#!/usr/bin/env node
// Builds the docs site (design.uniformrealestate.com) into _site/ from site/:
//   <!--code:LANG ... -->   a highlighted code block with a copy button
//   <!--example:NAME-->     site/examples/NAME.html rendered live, then shown as code
//   <!--colors--> etc.      token demos generated from tokens/tokens.json
// Highlighting happens here, at build time: no highlighter library ships to the browser.
// Plus the gallery and dist/. Run after `npm run build`.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { icon } from "../site/icons.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = join(ROOT, "site");
const OUT = join(ROOT, "_site");
const { version } = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const tokens = JSON.parse(readFileSync(join(ROOT, "tokens/tokens.json"), "utf8"));
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const entries = (group) => Object.entries(tokens[group]).filter(([k]) => !k.startsWith("$"));
const demoCss = [];

// --- Highlighting: each language is an ordered list of [pattern, class]. Text between
// matches is escaped as-is, so the output is always the exact source.
const LANGS = {
  html: [
    [/<!--[\s\S]*?-->/, "com"],
    [/<\/?[a-zA-Z][\w-]*|\/?>/, "tag"],
    [/"[^"]*"/, "str"],
  ],
  css: [
    [/\/\*[\s\S]*?\*\//, "com"],
    [/"[^"]*"/, "str"],
    [/--[\w-]+/, "var"],
    [/[\w-]+(?=\s*:)/, "kw"],
  ],
  js: [
    [/\/\/[^\n]*/, "com"],
    [/"[^"]*"|`[^`]*`/, "str"],
    [/\b(?:import|from|export|const|let|function|return|await|async)\b/, "kw"],
  ],
  sh: [
    [/(?<=^|\s)#[^\n]*/, "com"],
    [/"[^"]*"|'[^']*'/, "str"],
    [/^[\w-]+|(?<=\s)--?[\w-]+/m, "kw"],
  ],
};
function highlight(code, lang) {
  const rules = LANGS[lang];
  if (!rules) throw new Error(`no highlighter for ${lang}`);
  const re = new RegExp(rules.map(([r]) => `(${r.source})`).join("|"), "gm");
  let out = "",
    at = 0;
  for (const m of code.matchAll(re)) {
    out += esc(code.slice(at, m.index));
    const cls = rules[m.slice(1).findIndex((g) => g !== undefined)][1];
    out += `<span class="s-tk-${cls}">${esc(m[0])}</span>`;
    at = m.index + m[0].length;
  }
  return out + esc(code.slice(at));
}
let codeId = 0;
const codeBlock = (code, lang) => {
  const id = `code-${++codeId}`;
  return `<div class="s-code"><div class="s-code-bar"><span>${lang}</span><button type="button" class="s-copy" data-copy data-copy-from="${id}" aria-label="Copy code" title="Copy code" hidden>${icon("copy")}</button></div><pre tabindex="0" aria-label="${lang} code"><code id="${id}">${highlight(code, lang)}</code></pre></div>`;
};

// --- Token demos. Swatches and bars are classes, never inline styles, so the page stays
// CSP-clean like every consumer.
const copyBtn = (text) =>
  `<button type="button" class="s-copy" data-copy="${esc(text)}" aria-label="Copy CSS variable ${esc(text)}" title="Copy CSS variable ${esc(text)}" hidden>${icon("copy")}</button>`;
const colors = entries("color").map(([k, v]) => {
  demoCss.push(`.s-chip--${k} {\n  background: var(--u-${k});\n}`);
  return `<li class="s-card"><span class="s-chip s-chip--${k}"></span><div class="s-token-heading"><code>--u-${k}</code>${copyBtn(`var(--u-${k})`)}</div><span class="u-meta">${esc(v.value)}</span><span class="s-note">${esc(v.note ?? "")}</span></li>`;
});
const SEMANTIC = [
  ["bg", "Page background"],
  ["surface", "Panels and cards"],
  ["fg", "Body text"],
  ["muted", "Secondary text"],
  ["link", "Links, primary buttons"],
  ["accent", "Brand dot, accents"],
  ["line", "Hairlines"],
  ["hover", "Hover fill"],
];
const semantic = SEMANTIC.map(([k, note]) => {
  demoCss.push(`.s-chip--sem-${k} {\n  background: var(--u-${k});\n}`);
  return `<li class="s-card"><span class="s-chip s-chip--sem-${k}"></span><div class="s-token-heading"><code>--u-${k}</code>${copyBtn(`var(--u-${k})`)}</div><span class="s-note">${note}</span></li>`;
});

const HEADER_SVG_PLAY = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
const HEADER_SVG_HOME = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
const HEADER_SVG_GH = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`;

function makeHeader(root, isPlayground) {
  const midLink = isPlayground
    ? `<a class="u-button u-button--quiet u-shell-icon" href="${root}" aria-label="Documentation" title="Documentation">${HEADER_SVG_HOME}</a>`
    : `<a class="u-button u-button--quiet u-shell-icon" href="${root}playground/" aria-label="Playground" title="Playground">${HEADER_SVG_PLAY}</a>`;

  return `<header class="u-shell-header">
      <a href="${root}" class="s-brand"
        ><img class="s-logo s-logo--dark" src="${root}dist/svg/uniform-wordmark-on-dark.svg" alt="Uniform Design" width="124" height="27" /><img class="s-logo s-logo--light" src="${root}dist/svg/uniform-wordmark-color.svg" alt="Uniform Design" width="124" height="27" /></a>
      <span class="u-tag s-version">v${version}</span>
      <span class="u-shell-header-actions">
        <button type="button" class="u-button u-button--quiet s-theme u-shell-icon" id="s-theme" aria-label="Switch to light theme" title="Switch to light theme" hidden><span class="s-theme-icon" aria-hidden="true"></span></button>
        ${midLink}
        <a class="u-button u-button--quiet u-shell-icon" href="https://github.com/UniformChicago/design" aria-label="GitHub" title="GitHub">${HEADER_SVG_GH}</a>
      </span>
    </header>`;
}

const FACES = [
  ["sans", 400, "Public Sans", "Regular · body"],
  ["sans", 600, "Public Sans", "Semibold · headings"],
  ["sans", 700, "Public Sans", "Bold · titles"],
  ["mono", 500, "IBM Plex Mono", "Medium · labels, code"],
];
const fonts = FACES.map(([f, w, name, use]) => {
  demoCss.push(`.s-aa--${f}-${w} {\n  font-family: var(--u-font-${f});\n  font-weight: ${w};\n}`);
  return `<li><span class="s-aa s-aa--${f}-${w}" aria-hidden="true">Aa</span><p class="u-heading">${name}</p><p class="u-meta">${use} · <code class="u-code">--u-font-${f}</code></p></li>`;
});
const space = entries("space").map(([k, v]) => {
  demoCss.push(`.s-bar--${k} {\n  width: var(--u-space-${k});\n}`);
  return `<li><span class="u-meta">${esc(v.value)}</span><code class="u-code">--u-space-${k}</code><span class="s-bar s-bar--${k}"></span></li>`;
});
const radius = entries("radius").map(([k, v]) => {
  demoCss.push(`.s-radius--${k} {\n  border-radius: var(--u-radius-${k});\n}`);
  return `<li><span class="s-radius s-radius--${k}"></span><code class="u-code">--u-radius-${k}</code><span class="u-meta">${esc(v.value)}</span></li>`;
});

const svgs = readdirSync(join(ROOT, "dist/svg"));
const marks = ["wordmark", "real-estate", "transaction", "icon"]
  .flatMap((m) => [
    [`uniform-${m}-color.svg`, "light", "On light"],
    [`uniform-${m}-on-dark.svg`, "dark", "On dark"],
  ])
  .concat([["uniform-icon.svg", "dark", "Favicon"]])
  .filter(([f]) => svgs.includes(f))
  .map(
    ([f, theme, label]) =>
      `<li><div class="s-mark-preview" data-theme="${theme}"><img src="dist/svg/${f}" alt="" width="200" height="56" /></div><div class="s-mark-info"><strong>${f.includes("wordmark") ? "Wordmark" : f.includes("real-estate") ? "Real estate" : f.includes("transaction") ? "Transaction" : "Symbol"} · ${label}</strong><a href="dist/svg/${f}" download aria-label="Download ${esc(f)}">Download SVG <span aria-hidden="true">↓</span></a></div></li>`,
  );

// --- Page
const STACKED = new Set(["typography", "forms", "progress", "callouts"]);
let html = readFileSync(join(SITE, "index.html"), "utf8")
  .replaceAll("{{version}}", esc(version))
  .replace(/<!--code:(\w+)\n([\s\S]*?)\n\s*-->/g, (_, lang, code) => codeBlock(code, lang))
  .replace(/<!--example:([\w-]+)-->/g, (_, name) => {
    const src = readFileSync(join(SITE, "examples", `${name}.html`), "utf8").trimEnd();
    const cls = STACKED.has(name) ? "s-preview s-preview--stack" : "s-preview";
    return `<div class="s-example"><div class="${cls}">${src}</div>${codeBlock(src, "html")}</div>`;
  })
  .replace("<!--colors-->", colors.join("\n"))
  .replace("<!--semantic-->", semantic.join("\n"))
  .replace("<!--fonts-->", fonts.join("\n"))
  .replace("<!--space-->", space.join("\n"))
  .replace("<!--radius-->", radius.join("\n"))
  .replace("<!--marks-->", marks.join("\n"))
  .replace("<!--header-->", makeHeader("./", false));
const left = html.match(/\{\{\w+\}\}|<!--[\w:-]+/);
if (left) throw new Error(`site/index.html: unfilled placeholder ${left[0]}`);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
writeFileSync(join(OUT, "index.html"), html);
for (const f of ["site.css", "shell.css", "shell.js", "theme.js", "docs.js", "icons.js"])
  cpSync(join(SITE, f), join(OUT, f));
writeFileSync(join(OUT, "tokens-demo.css"), `/* Generated by build/site.mjs. */\n${demoCss.join("\n")}\n`);
cpSync(join(ROOT, "dist"), join(OUT, "dist"), { recursive: true });
// Favicon that follows the browser's color scheme: the on-light icon, swapped for the on-dark colors in dark mode.
const onLight = readFileSync(join(ROOT, "dist/svg/uniform-icon-color.svg"), "utf8");
const onDark = readFileSync(join(ROOT, "dist/svg/uniform-icon-on-dark.svg"), "utf8");
const fills = (svg) => [...svg.matchAll(/fill="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1]);
const [inkLight, dotLight] = fills(onLight);
const [inkDark, dotDark] = fills(onDark);
writeFileSync(
  join(OUT, "favicon.svg"),
  onLight
    .replace(/ role="img" aria-label="[^"]*"><title>[^<]*<\/title>/, ">")
    .replace(`fill="${inkLight}"`, 'class="i"')
    .replace(`fill="${dotLight}"`, 'class="d"')
    .replace(
      "<g ",
      `<style>.i{fill:${inkLight}}.d{fill:${dotLight}}@media (prefers-color-scheme:dark){.i{fill:${inkDark}}.d{fill:${dotDark}}}</style><g `,
    ),
);
cpSync(join(ROOT, "gallery"), join(OUT, "gallery"), { recursive: true });
cpSync(join(ROOT, "gallery"), join(OUT, "playground"), { recursive: true });

for (const p of ["gallery/index.html", "playground/index.html"]) {
  const path = join(OUT, p);
  const html = readFileSync(path, "utf8")
    .replaceAll("{{version}}", esc(version))
    .replace("<!--header-->", makeHeader("../", true));
  writeFileSync(path, html);
}
console.log(`_site/ built for v${version}`);
