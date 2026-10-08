import { registerDesignTools } from "./api.mjs";
const status = document.querySelector("#tool-status");
try {
  // Draft APIs have appeared on document and navigator. Feature-detect both.
  const result = await registerDesignTools(
    document.modelContext ?? navigator.modelContext,
    globalThis.UniformDesignCatalog,
  );
  if (result.supported) window.addEventListener("pagehide", () => result.dispose(), { once: true });
  status.textContent = result.supported
    ? `${result.registered.length} read-only design tools registered.`
    : "WebMCP is unavailable in this browser. The same contracts are available in catalog.json and the local CLI.";
} catch {
  status.textContent =
    "WebMCP registration failed. Use the static catalog or local CLI; no application data was accessed.";
}
