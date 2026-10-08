// Deliberately bounded static checks, not an HTML parser or accessibility certification.
export function lintDesign(source, catalog) {
  if (typeof source !== "string") throw new TypeError("source must be a string");
  const findings = [];
  const add = (index, rule, message) =>
    findings.push({ line: source.slice(0, index).split("\n").length, rule, message });
  for (const m of source.matchAll(/var\(\s*(--u-[\w-]+)/g))
    if (catalog.customProperties && !catalog.customProperties.includes(m[1]))
      add(
        m.index,
        "unknown-token",
        `Unknown ${m[1]}. Read get_tokens and the catalog customProperties list before using a token.`,
      );
  for (const m of source.matchAll(/class\s*=\s*["']([^"']*)["']/g))
    for (const cls of m[1].split(/\s+/))
      if (cls.startsWith("u-") && !catalog.classes.includes(cls))
        add(
          m.index,
          "unknown-class",
          `Unknown ${cls}. Query the catalog for supported classes; do not invent u-* names.`,
        );
  for (const m of source.matchAll(/\bstyle\s*=\s*["']/g))
    add(
      m.index,
      "inline-style",
      "Move styles to an external stylesheet using semantic --u-* tokens (strict CSP).",
    );
  for (const m of source.matchAll(/#[\da-fA-F]{3,8}\b/g)) {
    const length = m[0].length - 1;
    if (
      [3, 4, 6, 8].includes(length) &&
      /(?:color|background|border|fill|stroke)\s*:[^;\n]*$/i.test(
        source.slice(Math.max(0, m.index - 100), m.index),
      )
    )
      add(m.index, "raw-color", "Use a semantic --u-* color token instead of a literal color.");
  }
  for (const m of source.matchAll(/<button\b([^>]*)>/gi)) {
    if (!/\btype\s*=/.test(m[1]))
      add(
        m.index,
        "button-type",
        "Set type=button or type=submit explicitly to avoid accidental form submission.",
      );
  }
  for (const m of source.matchAll(/<(?:input|select|textarea)\b([^>]*)>/gi)) {
    if (/\btype\s*=\s*["'](?:hidden|submit|button)["']/.test(m[1])) continue;
    const id = /\bid\s*=\s*["']([^"']+)["']/.exec(m[1])?.[1];
    const labeled =
      /\baria-label(?:ledby)?\s*=/.test(m[1]) ||
      (id && source.includes(`for="${id}"`)) ||
      /<label\b[^>]*>[^<]*$/.test(source.slice(0, m.index));
    if (!labeled)
      add(
        m.index,
        "field-label",
        "Associate a visible label using for/id (or supply an accessible name when appropriate).",
      );
  }
  return findings;
}
