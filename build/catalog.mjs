import { readFileSync } from "node:fs";
export function buildCatalog(root, css, tokens) {
  const source = JSON.parse(readFileSync(`${root}/catalog/catalog.json`, "utf8"));
  const version = JSON.parse(readFileSync(`${root}/package.json`, "utf8")).version;
  const entries = [...source.components, ...source.patterns];
  const ids = new Set();
  for (const item of entries) {
    if (ids.has(item.id)) throw new Error(`Duplicate catalog id: ${item.id}`);
    ids.add(item.id);
    for (const key of [
      "title",
      "purpose",
      "maturity",
      "source",
      "states",
      "requirements",
      "customization",
      "dependencies",
      "limitations",
      "verification",
      "introduced",
    ])
      if (!item[key] || (Array.isArray(item[key]) && !item[key].length))
        throw new Error(`${item.id}: missing ${key}`);
    if (!/^(site\/examples|catalog\/examples|patterns)\/[\w-]+\.html$/.test(item.source))
      throw new Error(`Unsafe source: ${item.source}`);
    item.markup = readFileSync(`${root}/${item.source}`, "utf8").replaceAll(
      "../gallery/img/",
      "/design/gallery/img/",
    );
    for (const match of item.markup.matchAll(/class="([^"]*)"/g))
      for (const cls of match[1].split(/\s+/))
        if (cls.startsWith("u-") && !css.includes(`.${cls}`))
          throw new Error(`${item.id}: unknown class ${cls}`);
  }
  for (const item of entries) {
    item.classes = [
      ...new Set(
        [...item.markup.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
          match[1].split(/\s+/).filter((name) => name.startsWith("u-")),
        ),
      ),
    ];
  }
  for (const pattern of source.patterns)
    for (const id of pattern.components)
      if (!source.components.some((item) => item.id === id))
        throw new Error(`${pattern.id}: missing component ${id}`);
  return {
    ...source,
    version,
    tokens,
    customProperties: [...new Set([...css.matchAll(/(--u-[\w-]+)\s*:/g)].map((match) => match[1]))].sort(),
    classes: [...new Set(css.match(/\.u-[\w-]+/g))].map((x) => x.slice(1)).sort(),
    verification: {
      browser: "pending-local-execution",
      maturity: "preview",
      baseline: "CSS and native HTML; optional explicitly mounted interactions",
    },
  };
}
export function catalogMarkdown(catalog) {
  return (
    `# Uniform Design agent contract\n\nPackage version: ${catalog.version}. Schema: ${catalog.schemaVersion}.\n\nRead catalog.json for machine-readable contracts and exact markup. These are preview contracts.\n\n${catalog.rules.map((x) => `- ${x}`).join("\n")}\n\n` +
    [...catalog.components, ...catalog.patterns]
      .map(
        (item) =>
          `## ${item.id}: ${item.title}\n\n${item.purpose}\n\nMaturity: ${item.maturity}. States: ${item.states.join(", ")}.\n\n${item.requirements.map((x) => `- ${x}`).join("\n")}\n\nDependencies: ${item.dependencies.join(", ")}.\n\nCustomization: ${item.customization.join(", ")}.\n\nLimitations: ${item.limitations.join(" ")}\n\n${item.integration ? "Integration:\n\n```json\n" + JSON.stringify(item.integration, null, 2) + "\n```\n\n" : ""}\`\`\`html\n${item.markup}\`\`\`\n`,
      )
      .join("\n")
  );
}
