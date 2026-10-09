#!/usr/bin/env node
// Builds the docs site (design.uniformrealestate.com) into _site/ from site/:
//   <!--code:LANG ... -->   a highlighted code block with a copy button
//   <!--example:NAME-->     site/examples/NAME.html rendered live, then shown as code
//   <!--colors--> etc.      token demos generated from tokens/tokens.json
// Highlighting happens here, at build time: no highlighter library ships to the browser.
// Plus the gallery and dist/. Run after `npm run build`.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { icon } from "../site/icons.js";
import { routes } from "./patterns.mjs";
import { presets } from "../gallery/presets.js";

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
  const isSingle = !code.includes("\n");
  const id = `code-${++codeId}`;
  if (isSingle) {
    return `<div class="s-code s-code--single"><div class="s-code-bar"><span>${lang}</span></div><pre tabindex="0" aria-label="${lang} code"><code id="${id}">${highlight(code, lang)}</code></pre><button type="button" class="s-copy" data-copy data-copy-from="${id}" aria-label="Copy code" title="Copy code" hidden>${icon("copy")}</button></div>`;
  }
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
  return `<tr>\n    <td><div class="s-chip--sem-${k} s-table-chip" ></div></td>\n    <td><div class="s-token-heading"><code>--u-${k}</code>${copyBtn(`var(--u-${k})`)}</div></td>\n    <td class="u-muted">${note}</td>\n  </tr>`;
});

const HEADER_SVG_GH = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`;

function makeHeader(root, isPlayground, current = isPlayground ? "playground" : "docs") {
  return `<header class="u-shell-header">
      <a href="${root}" class="s-brand" aria-label="Uniform Design components" title="Components"${current === "docs" ? ' aria-current="page"' : ""}
        ><img class="s-logo s-logo--dark" src="${root}dist/svg/uniform-wordmark-on-dark.svg" alt="Uniform Design" width="124" height="27" /><img class="s-logo s-logo--light" src="${root}dist/svg/uniform-wordmark-color.svg" alt="Uniform Design" width="124" height="27" /></a>
      <span class="u-tag s-version">v${version}</span>
      <span class="u-shell-header-actions">
        <nav class="s-pages" aria-label="Site navigation"><a class="u-button u-button--quiet u-shell-icon" href="${["playground", "patterns"].includes(current) ? root : root + "playground/"}" aria-label="${["playground", "patterns"].includes(current) ? "Documentation" : "Playground"}" title="${["playground", "patterns"].includes(current) ? "Documentation" : "Playground"}">${icon(["playground", "patterns"].includes(current) ? "book" : "workspace")}</a></nav>
        <button type="button" class="u-button u-button--quiet s-theme u-shell-icon" id="s-theme" aria-label="Switch to light theme" title="Switch to light theme" hidden><span class="s-theme-icon" aria-hidden="true"></span></button>
        <a class="u-button u-button--quiet u-shell-icon" href="https://github.com/UniformChicago/design" aria-label="GitHub" title="GitHub">${HEADER_SVG_GH}</a>
      </span>

    </header>`;
}

// Both exploration modes use one library, with full workflows remaining ordinary links.
function workspaceNav(root, current = "lab") {
  return `<p class="u-eyebrow">Playground</p><nav class="u-nav" aria-label="Playground library"><a href="${root}playground/"${current === "lab" ? ' aria-current="page"' : ""}>All starters</a>${routes.map((route) => `<a href="${root}playground/#${route.id}"${current === route.file ? ' aria-current="page"' : ""}>${route.title}</a>`).join("")}</nav>`;
}
function resourceFooter(root) {
  return `<footer class="s-resource-footer" aria-label="Developer resources"><a href="${root}agent/">Agents</a><a href="${root}dist/catalog.json">Design catalog</a></footer>`;
}

// Shared <head> additions: preload the faces used above the fold, so text doesn't paint in a
// fallback font first and then swap on every page load.
const PRELOAD_FONTS = [
  "public-sans-latin-400-normal",
  "public-sans-latin-600-normal",
  "public-sans-latin-700-normal",
  "ibm-plex-mono-latin-500-normal",
];
// Also: Chrome prerenders the other page (docs <-> Playground) as soon as a tap or hover starts, so the
// header link opens instantly; other browsers get a cache warm-up from shell.js instead.
const headExtras = (root, other, speculation = true) =>
  [
    `<link rel="help" href="${root}agent/" title="Agents" />`,
    `<link rel="alternate" type="application/json" href="${root}dist/catalog.json" title="Uniform design catalog" />`,
    ...PRELOAD_FONTS.map(
      (f) =>
        `<link rel="preload" href="${root}dist/fonts/${f}.woff2" as="font" type="font/woff2" crossorigin />`,
    ),
    ...(speculation
      ? [
          `<script type="speculationrules">${JSON.stringify({ prerender: [{ urls: [other], eagerness: "moderate" }] })}</script>`,
        ]
      : []),
  ].join("\n    ") + "\n  </head>";

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
const STACKED = new Set([
  "typography",
  "forms",
  "progress",
  "callouts",
  "activity",
  "sliders",
  "maps",
  "property",
]);
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
  .replace("<!--header-->", makeHeader("./", false))
  .replace("</body>", `${resourceFooter("./")}</body>`)
  .replace("</head>", headExtras("./", "playground/"));
const left = html.match(/\{\{\w+\}\}|<!--[\w:-]+/);
if (left) throw new Error(`site/index.html: unfilled placeholder ${left[0]}`);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
writeFileSync(join(OUT, "index.html"), html);
for (const f of ["site.css", "shell.css", "shell.js", "theme.js", "docs.js", "icons.js", "map-demo.js"])
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
cpSync(join(ROOT, "agent"), join(OUT, "agent"), { recursive: true });
cpSync(join(ROOT, "workflows"), join(OUT, "workflows"), { recursive: true });
cpSync(join(ROOT, "gallery"), join(OUT, "gallery"), { recursive: true });
cpSync(join(ROOT, "gallery"), join(OUT, "playground"), { recursive: true });

// Ship the initial lab as HTML; enhancement must not reveal an entire hidden page.
const initialPreset = presets[0];
const initialCode = initialPreset.render(initialPreset.title, initialPreset.states[0]);
const initialPreview = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; style-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="../dist/design.css?v=${createHash(
  "sha256",
)
  .update(readFileSync(join(ROOT, "dist/design.css")))
  .digest("hex")
  .slice(
    0,
    10,
  )}"><link rel="stylesheet" href="../dist/widgets.css"><link rel="stylesheet" href="../dist/map.css"><link rel="stylesheet" href="../dist/context-menu.css"><link rel="stylesheet" href="preview.css?v=${createHash(
  "sha256",
)
  .update(readFileSync(join(ROOT, "gallery/preview.css")))
  .digest("hex")
  .slice(
    0,
    10,
  )}"><title>Pattern preview</title></head><body class="u-root"><main class="p-content" aria-label="Component preview"><h1 class="u-sr">Component preview</h1><div class="u-app p-markup">${initialCode}</div></main></body></html>`;
for (const p of ["gallery/index.html", "playground/index.html"]) {
  const path = join(OUT, p);
  const html = readFileSync(path, "utf8")
    .replaceAll("{{version}}", esc(version))
    .replace("<!--header-->", makeHeader("../", true))
    .replace("<!--workspace-nav-->", workspaceNav("../"))
    .replace(
      "<!--component-presets-->",
      presets
        .map(
          (preset, index) =>
            `${index === routes.length ? '<p class="g-starter-label u-eyebrow">Component pieces</p>' : ""}<button type="button" data-preset="${esc(preset.id)}" aria-pressed="${preset === initialPreset}"><strong>${esc(preset.name)}</strong><span>${esc(preset.description)}</span></button>`,
        )
        .join(""),
    )
    .replace(
      "<!--starter-options-->",
      [true, false]
        .map(
          (live) =>
            `<optgroup label="${live ? "Complete interfaces" : "Component pieces"}">${presets
              .filter((preset) => Boolean(preset.live) === live)
              .map((preset) => `<option value="${esc(preset.id)}">${esc(preset.name)}</option>`)
              .join("")}</optgroup>`,
        )
        .join(""),
    )
    .replace(
      "<!--initial-states-->",
      initialPreset.states.map((state) => `<option>${esc(state)}</option>`).join(""),
    )
    .replace("{{initial-title}}", esc(initialPreset.title))
    .replace("{{initial-live}}", esc(initialPreset.live))
    .replace('srcdoc=""', `srcdoc="${esc(initialPreview)}"`)
    .replace("<!--initial-code-->", esc(initialCode))
    .replace("</body>", `${resourceFooter("../")}</body>`)
    .replace("</head>", headExtras("../", "../"));
  writeFileSync(path, html);
}

// Published reference pages share the docs chrome; standalone fixtures retain their app shell.
for (const page of routes.map((route) => route.file)) {
  const path = join(OUT, "workflows", page);
  let source = readFileSync(path, "utf8")
    .replace('<script src="theme.js"></script>', '<script src="../theme.js"></script>')
    .replace(
      "</head>",
      `<link rel="stylesheet" href="../shell.css" />${headExtras("../", "../playground/", false)}`,
    )
    .replace(
      '<div class="u-app">',
      `${makeHeader("../", false, "patterns")}<div class="u-shell-layout u-shell-main s-explore"><div class="u-app u-workbench s-pattern-layout">`,
    )
    .replace(/<a class="u-app-brand"[\s\S]*?<\/a>/, '<p class="u-eyebrow">Reference patterns</p>')
    .replace(/<div class="u-app-utility">[\s\S]*?<\/div>/, "")
    .replace(
      /<span class="u-eyebrow" style="[^"]*">Resources<\/span>[\s\S]*?<a href="..\/playground\/">Playground<\/a>/g,
      "",
    )
    .replace(
      /<nav class="u-nav u-desktop-nav"[\s\S]*?<\/nav>/,
      workspaceNav("../", page).replace('class="u-nav"', 'class="u-nav u-desktop-nav"'),
    )
    .replace(
      /<nav class="u-nav" aria-label="Mobile patterns">[\s\S]*?<\/nav>/,
      workspaceNav("../", page)
        .replace(/<p[\s\S]*?<\/p>/, "")
        .replace('aria-label="Playground library"', 'aria-label="Mobile patterns"'),
    )
    .replace(/<p class="u-eyebrow">Reference patterns<\/p>/, "")
    .replace(/<header class="u-page-header">[\s\S]*?<\/header>/, "")
    .replace(
      "</body>",
      `</div>${resourceFooter("../")}<script type="module" src="../shell.js"></script></body>`,
    );
  writeFileSync(path, source);
}
{
  const path = join(OUT, "agent/index.html");
  const source = readFileSync(path, "utf8")
    .replace('src="../workflows/theme.js"', 'src="../theme.js"')
    .replace(
      "</head>",
      `<link rel="stylesheet" href="../shell.css" />${headExtras("../", "../playground/", false)}`,
    )
    .replace(
      '<main class="u-workspace">',
      `<a class="u-skip" href="#main">Skip to content</a>${makeHeader("../", false, "agent")}<main id="main" class="u-shell-layout u-shell-main s-agent-main">`,
    )
    .replace('<a href="../">Uniform Design</a>', '<p class="u-eyebrow">Developer resources</p>')
    .replace("</body>", `${resourceFooter("../")}<script type="module" src="../shell.js"></script></body>`);
  writeFileSync(path, source);
}

// Link previews (iMessage, Slack, social) and Safari's share sheet: the same Open Graph and Twitter
// tags as the main site, filled from each page's own title and description. Images come from
// scripts/render-share.mjs and need absolute URLs.
const SITE_URL = "https://design.uniformrealestate.com";
const metaDescription = (html) => html.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1];
for (const f of ["og.png", "apple-touch-icon.png"]) cpSync(join(SITE, f), join(OUT, f));
for (const p of [
  "index.html",
  "gallery/index.html",
  "playground/index.html",
  "workflows/index.html",
  "workflows/dashboard.html",
  "workflows/workspace.html",
  "workflows/states.html",
  "workflows/map.html",
  "workflows/calculator.html",
  "agent/index.html",
]) {
  const file = join(OUT, p);
  const html = readFileSync(file, "utf8");
  const title = html.match(/<title>([^<]*)<\/title>/)[1];
  // Pages without their own description share the home page's.
  const description = metaDescription(html) ?? metaDescription(readFileSync(join(OUT, "index.html"), "utf8"));
  const url = `${SITE_URL}/${p.replace(/index\.html$/, "")}`;
  const image = `${SITE_URL}/og.png`;
  const tags = [
    `<link rel="canonical" href="${url}" />`,
    `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Uniform Design" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="Uniform Design logo" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:site" content="@UniformChicago" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ];
  writeFileSync(file, html.replace("</head>", `${tags.join("\n    ")}\n  </head>`));
}

// Cache-busting: every local CSS/JS/SVG reference gets ?v=<content hash>. GitHub Pages caches files
// for 10 minutes under fixed URLs, so without this a fresh page can run last release's CSS and JS.
// Module imports are rewritten before the HTML, so a changed dependency also changes its importer's
// hash. (Imported modules import nothing themselves.)
const hashOf = (path) => createHash("sha256").update(readFileSync(path)).digest("hex").slice(0, 10);
const bust = (file, pattern) => {
  const src = readFileSync(file, "utf8");
  const out = src.replace(pattern, (all, pre, ref, post) => {
    if (/^(\/|[a-z]+:)/i.test(ref)) return all; // absolute or external: not ours
    const target = resolve(dirname(file), ref);
    if (!existsSync(target)) return all;
    return `${pre}${ref}?v=${hashOf(target)}${post}`;
  });
  writeFileSync(file, out);
};
const IMPORT = /(from ")(\.\.?\/[^"?#]+\.m?js)(")/g;
const ATTR = /((?:href|src)=")([^"?#]+\.(?:css|m?js|svg))(")/g;
for (const dir of [
  OUT,
  join(OUT, "gallery"),
  join(OUT, "playground"),
  join(OUT, "agent"),
  join(OUT, "workflows"),
])
  for (const f of readdirSync(dir).filter((f) => /\.m?js$/.test(f))) bust(join(dir, f), IMPORT);
for (const p of [
  "index.html",
  "gallery/index.html",
  "playground/index.html",
  "workflows/index.html",
  "workflows/dashboard.html",
  "workflows/workspace.html",
  "workflows/states.html",
  "workflows/map.html",
  "workflows/calculator.html",
  "agent/index.html",
  ...routes.map((route) => `workflows/previews/${route.file}`),
])
  bust(join(OUT, p), ATTR);
console.log(`_site/ built for v${version}`);
