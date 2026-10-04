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
const marks = ["wordmark", "real-estate", "transaction"]
  .flatMap((m) => [
    [`uniform-${m}-color.svg`, "light", "On light"],
    [`uniform-${m}-on-dark.svg`, "dark", "On dark"],
  ])
  .concat([["uniform-icon.svg", "dark", "Icon"]])
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
  .replace("<!--marks-->", marks.join("\n"));
const left = html.match(/\{\{\w+\}\}|<!--[\w:-]+/);
if (left) throw new Error(`site/index.html: unfilled placeholder ${left[0]}`);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
writeFileSync(join(OUT, "index.html"), html);
for (const f of ["site.css", "theme.js", "docs.js", "icons.js"]) cpSync(join(SITE, f), join(OUT, f));
writeFileSync(join(OUT, "tokens-demo.css"), `/* Generated by build/site.mjs. */\n${demoCss.join("\n")}\n`);
cpSync(join(ROOT, "dist"), join(OUT, "dist"), { recursive: true });
cpSync(join(ROOT, "gallery"), join(OUT, "gallery"), { recursive: true });
cpSync(join(ROOT, "gallery"), join(OUT, "playground"), { recursive: true });
console.log(`_site/ built for v${version}`);
