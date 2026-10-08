# Agent contracts and native interactions

Status: accepted for local preview, 2026-10-07.

The package remains CSS-first. Additive patterns are authored once in `patterns/`; a shared shell generates the visual fixtures in `workflows/`. Existing URLs remain available. Consumers use the contract's body markup, not the review shell.

The versioned source catalog references exact example files. Build produces JSON, generated agent documentation, static markup and a read-only API. Local tools and the experimental browser WebMCP adapter use that API. No form values or session data enter those tools. Package version and schema version are separate.

## Interaction foundation

Use HTML select, dialog, details, input and progress semantics. The optional `interactions.js` exposes `UniformInteractions.mount(root)` and returns a disposer. Importing the file has no automatic mounting or network side effects. Repeated mounting of the same root is idempotent. Dispose before replacing its markup, then remount. Do not mount overlapping roots.

Dialog uses `showModal`, native focus containment and Escape handling, with explicit cancel/confirm buttons and focus restoration. Native selects gain styled pickers inside `@supports (appearance: base-select)`; other browsers retain native menus. This is progressive enhancement, not a cross-browser custom combobox. Multi-step intake uses native field validity, focuses step headings and emits uniform:step-change and uniform:complete; the consuming application handles persistence and submission. File handling validates metadata only. Collection behavior implements search, status filtering and sorting over existing rows; no pagination or server data layer is implied.

Compared options: a bespoke ARIA widget would add keyboard/focus maintenance; a framework-specific library would impose an unselected framework; native controls preserve the existing HTML/CSS and strict-CSP architecture. Revisit if real use requires searchable multi-select, virtualized options or interactions native controls cannot supply. Sources: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog and https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select (reviewed 2026-10-07).

## Validation limits

Catalog checks and Node API tests are executable locally. Browser suites cover semantics, CSP, keyboard behavior, themes and layouts, but local browser execution is currently blocked by the host sandbox. Preview status remains until those checks and manual visual/assistive-technology reviews run. Tests of a mock WebMCP host establish our adapter behavior, not interoperability with a real browser agent.

The focused design linter reports unknown u-* classes, inline styles, literal hex colors in declarations, missing button types and obvious missing field labels. It is not a full HTML/CSS parser or accessibility audit. CSS shorthands, templates and dynamically composed classes require browser/integration review. No Tailwind migration or shadcn dependency is introduced.
