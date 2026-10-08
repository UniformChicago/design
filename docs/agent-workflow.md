# Agent workflow

1. Read `dist/catalog.json` or run `npm run design -- list "collection"`.
2. Retrieve `npm run design -- pattern searchable-collection` and each referenced component.
3. Use the returned markup and declared dependencies. Replace example content and IDs; preserve semantic relationships, state attributes and documented hooks. Patterns are compositions, not application policy.
4. If needed, load `dist/interactions.js` and call `UniformInteractions.mount(document)` from an external application script. Keep its disposer for unmount. Listen for `uniform:step-change`, `uniform:complete` and `uniform:dialog-close` when the pattern needs application actions. The CSS-only parts do not require this script.
5. Run `npm run lint:design -- path/to/page.html path/to/styles.css`. Fix errors using the returned rule, line and guidance. Run application browser checks separately.
6. Review the resulting screen at desktop/mobile widths and both themes, including empty, invalid and failure states.

## Entry points

- `dist/catalog.json`: versioned contracts, tokens, supported classes and complete example markup.
- `dist/AGENTS.md`: generated instructions and examples.
- `dist/patterns/*.html`: copyable body fragments.
- `agent/api.mjs`: shared pure read-only lookup API.
- `/agent/`: documentation links and experimental WebMCP registration when supported by the browser. Serve over localhost or HTTPS; file previews still expose links to the static catalog.
- `/workflows/`: rendered pattern fixtures for human visual review, not a second product.

## Stability and migration

These additions are preview-only and keep existing classes and routes. Do not edit generated `dist/` or `workflows/*.html`; edit pattern bodies, shell, example files or catalog metadata, then build. Existing workflow URLs are compatibility aliases by convention; their content is now generated. No new published version or deployment is created by local builds.

An agent must not call preview coverage a production accessibility certification. The generated verification status states the current browser limitation. Add actual test evidence when promoting components to stable.

## Review tasks

Use the same prompt and model configuration when comparing versions, and repeat runs to account for variation:

- Compose a multi-step intake with a required choice, save error and review summary.
- Compose a status dashboard with missing data and mixed task states.
- Compose a searchable record collection with zero matches and clear-filter recovery.
- Upgrade a consumer fixture after a documented token or class deprecation.

Record elapsed time, human corrections, unsupported classes, omitted states, browser failures and visual review outcome. These tasks are specified but have not been run as autonomous-agent evaluations yet.

## Complete recipes and feedback

Use `node scripts/design.mjs recipe map-list` or WebMCP `get_recipe({id: "map-list"})` to retrieve the markup, dependent component contracts and optional runtime integration in one response. Load assets in the returned order; initialize from the documented options, and dispose before removing the root.

`validate_markup({source})` exposes the same bounded checker used by the CLI. It checks unknown classes and tokens, inline styling, literal colors, explicit button types and obvious missing field labels. It does not parse arbitrary JS/JSX or certify runtime behavior. Inputs are limited to 200,000 characters.

The two new tools bring the read-only tool count to seven. Packaged API import and recipe asset resolution are tested. This is deterministic consumption testing, not an autonomous-agent usability evaluation or proof of native WebMCP interoperability.
