import { readFileSync } from "node:fs";
import { createDesignApi } from "../agent/api.mjs";
const api = createDesignApi(
  JSON.parse(readFileSync(new URL("../dist/catalog.json", import.meta.url), "utf8")),
);
const [command = "list", value = ""] = process.argv.slice(2);
try {
  const result =
    command === "list"
      ? api.list_design({ query: value })
      : command === "component"
        ? api.get_component({ id: value })
        : command === "pattern"
          ? api.get_pattern({ id: value })
          : command === "recipe"
            ? api.get_recipe({ id: value })
            : command === "tokens"
              ? api.get_tokens()
              : command === "rules"
                ? api.get_usage_rules()
                : (() => {
                    throw new Error(
                      "Use: list [query] | component <id> | pattern <id> | recipe <id> | tokens | rules",
                    );
                  })();
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
