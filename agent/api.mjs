import { lintDesign } from "./lint.mjs";
// Pure, read-only API shared by local CLI and browser WebMCP adapter.
export function createDesignApi(catalog) {
  const copy = (value) => JSON.parse(JSON.stringify(value));
  function get(kind, id) {
    if (typeof id !== "string") throw new TypeError("id must be a string");
    const item = catalog[kind].find((x) => x.id === id);
    if (!item) throw new Error(`Unknown ${kind} id: ${id}. Use list_design first.`);
    return copy(item);
  }
  return Object.freeze({
    list_design: ({ query = "" } = {}) => {
      if (typeof query !== "string" || query.length > 500)
        throw new TypeError("query must be at most 500 characters");
      return {
        version: catalog.version,
        components: catalog.components
          .filter((x) => `${x.id} ${x.title} ${x.purpose}`.toLowerCase().includes(query.toLowerCase()))
          .map(({ id, title, maturity }) => ({ id, title, maturity })),
        patterns: catalog.patterns
          .filter((x) => `${x.id} ${x.title} ${x.purpose}`.toLowerCase().includes(query.toLowerCase()))
          .map(({ id, title, maturity }) => ({ id, title, maturity })),
      };
    },
    get_component: ({ id }) => get("components", id),
    get_pattern: ({ id }) => get("patterns", id),
    get_recipe: ({ id }) => {
      const pattern = get("patterns", id);
      return {
        version: catalog.version,
        pattern,
        components: pattern.components.map((id) => get("components", id)),
        integration: pattern.integration || { dependencies: pattern.dependencies },
        rules: copy(catalog.rules),
        verification: copy(catalog.verification),
      };
    },
    validate_markup: ({ source }) => {
      if (typeof source !== "string" || source.length > 200000)
        throw new TypeError("source must be a string of at most 200000 characters");
      return {
        findings: lintDesign(source, catalog),
        scope: "Bounded static checks only; run browser and accessibility checks separately.",
      };
    },
    get_tokens: () => copy(catalog.tokens),
    get_usage_rules: () => ({
      version: catalog.version,
      rules: copy(catalog.rules),
      verification: copy(catalog.verification),
    }),
  });
}
export async function registerDesignTools(context, catalog) {
  if (!context || typeof context.registerTool !== "function") return { supported: false, registered: [] };
  const api = createDesignApi(catalog),
    registered = [];
  const controller = new AbortController();
  try {
    for (const name of Object.keys(api)) {
      const hasId = name === "get_component" || name === "get_pattern" || name === "get_recipe";
      await context.registerTool(
        {
          name,
          description: `Read-only Uniform Design ${name.replaceAll("_", " ")}. Version ${catalog.version}. Returns static documentation only.`,
          inputSchema: {
            type: "object",
            properties: hasId
              ? { id: { type: "string" } }
              : name === "validate_markup"
                ? { source: { type: "string", maxLength: 200000 } }
                : name === "list_design"
                  ? { query: { type: "string", maxLength: 500 } }
                  : {},
            required: hasId ? ["id"] : name === "validate_markup" ? ["source"] : [],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true },
          execute: async (args = {}) => ({
            content: [{ type: "text", text: JSON.stringify(api[name](args)) }],
          }),
        },
        { signal: controller.signal },
      );
      registered.push(name);
    }
  } catch (error) {
    controller.abort();
    throw error;
  }
  return { supported: true, registered, dispose: () => controller.abort() };
}
