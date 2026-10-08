# Workflow previews

Playground makes complete workflows the primary editable starters, alongside smaller component pieces. Live mode loads trusted isolated fixtures with their interactions; markup mode edits sanitized HTML in a separate script-free sandbox. Changing a heading or editing HTML switches to markup mode. Both modes share a fixed preview area. Agents and the catalog live in the shared footer. Agent instructions are linked from the Agents page. All are discoverable through ordinary HTML links. Existing `/workflows/` links remain valid.

The `/workflows/` section contains onboarding and license-management reference screens with illustrative data. These are preview patterns, not a licensing rules engine.

The shared CSS adds application navigation, page headers, two-column layouts, statistics, steps, task lists, form layouts and basic invalid/disabled states. Existing component names remain unchanged. The fixture orchestration stays in the examples. Optional packaged interactions cover native dialogs, local file metadata and collection filtering/sorting; consumers supply application state, policy and persistence.

Onboarding demonstrates required-field validation, back/continue navigation, a text-safe review summary, explicit session draft saving and a matching dashboard. Task completion updates the dashboard's progress. No information is transmitted. Saved form values remain in session storage until the browser session ends; use placeholder information. Task completion resets on reload.

## Maturity contract

Before a pattern becomes stable, document its markup, supported states, keyboard/focus behavior, responsive behavior, browser coverage, accessibility review and migration impact. Preview status makes no guarantee of API stability. This milestone retains the CSS-only package contract.

## Verification

Run `npm run build`, `npm run check` and `npm run test:a11y`. Workflow tests cover validation, save/reload, navigation, safe text rendering, task progress, both themes and narrow layouts. The browser matrix includes Chromium desktop/mobile and pattern tests in Firefox and WebKit. Local browser execution and manual assistive-technology review remain outstanding. Screenshots are review artifacts, not yet approved regression baselines.

## Workspace patterns

`/workflows/workspace.html` adds sample document search and status filtering, no-results recovery, inline document details, people/firm rows, property facts, a cost breakdown and activity history. Search and filters combine; clearing restores the full fixture. These remain preview patterns with synthetic data. There is no upload, authorization, billing or messaging backend.

Mobile navigation uses a compact masthead with left-aligned identity, theme control and a native disclosure menu. The menu opens below the header; redundant workflow headings are omitted at narrow widths. Browser tests specify a maximum collapsed header height of 80 CSS pixels at 390px width. Browser execution remains blocked in the current development sandbox, so this requirement is not yet visually verified.

## Progress updates

Custom `.u-progress > span` bars ease width changes over 360 ms. Native `<progress class="u-meter">` bars retain their native semantics and work without JavaScript; optionally load `dist/interactions.js` and call `UniformInteractions.setProgress(element, value)` for the same smooth timing across browsers. The helper clamps values to the element's range and redirects interrupted animations from the current fill. Accessible values and the checklist's text update immediately. Reduced motion skips interpolation, including when the preference changes during an update.
