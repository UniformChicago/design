# Changelog

Each release is a `vX.Y.Z` tag with a [GitHub Release](https://github.com/UniformChicago/design/releases): notes from this file, the npm tarball, `SHA256SUMS` and a signed build-provenance attestation. During `0.x`, any release may change markup or class names; read the notes before upgrading.

## v0.2.0 — 2026-10-07

- Bring five complete workflow starters into Playground, with isolated live previews and editable markup derived from canonical sources.
- Tighten mobile controls with a native starter picker and an optional Customize panel; center select text within shared controls.
- Add optional native-popover context menus with keyboard navigation, touch openers and viewport-safe positioning. Property actions open details, toggle the shortlist and copy the price.
- Add a configurable full-width listing gallery alongside the split map/list view. Keep document table columns stable during detail expansion.

- Add native proximity snapping to result lists and horizontal menus, contain nested scrolling, improve touch controls and mobile field typography, and respect reduced-motion preferences.

- Smooth progress updates in shared bars and the checklist, with reduced-motion support and immediately updated accessible values.
- Tighten identity text spacing and bring the map/list demo ahead of its collapsible reference guidance, with compact filters and result counts.
- Match sortable header typography to the other column labels, stack workspace cards independently, and tighten empty states, callouts and stacked facts.
- Standardize buttons and single-line fields at 48px, center select carets, and align toolbar controls and sortable table headings. Fix partial bottom borders on ordinary and filtered tables.
- Lead listings with a responsive placeholder photo gallery and card thumbnails. Let details grow with their content, and remove the redundant title/status band.
- Add richer sample property summaries, persistent unknown-location states and an in-memory shortlist.
- Consolidate full workflow starters into Playground with working live previews, editable markup, compact controls and matching preview layouts.
- Add explicit map-and-list, list-only, map-only and gallery views while preserving filters and selection.
- Use the wordmark for Components and a workspace icon for Playground; keep Agents discoverable in the footer. Repeated current-page activation preserves Playground drafts.
- Fix dialog initialization and reserve space for code controls and dashboard feedback to reduce layout shifts.
- Hide scrollbar chrome in menus and code panes while retaining sticky sidebars, native scrolling and active-section tracking.
- Add preview application components, native interactions, agent contracts, CLI validation and seven read-only WebMCP tools.
- Add reference workflows for intake, dashboards, searchable collections, component states and linked maps with optional MapLibre/Leaflet assets.
- Include Firefox and WebKit in the release workflow's browser installation, matching the configured test projects.

## v0.1.12 — 2026-10-04

- `.u-shell-header` is a fixed 64px tall (border included), so sticky elements below it at `top: 64px` are no longer overlapped.
- Docs site: every local CSS, JS and SVG reference carries a content hash (`?v=…`), so a new release never runs with the previous release's cached files. This fixes the theme toggle doing nothing on iOS Safari right after a deploy.
- Docs site: on narrow screens the sticky row of section groups highlights the current group and scrolls to keep it in view.
- Docs site: navigating between the docs and the Playground keeps the old page on screen until the new one paints, preloads the main fonts, warms the cache for the other page, and lets Chrome prerender it.
- Docs site: Assets moves to Foundations; Labs (Atmosphere) is now the last group. Tighter hero spacing and a larger wordmark on phones.
- Playground: the preview width toggle is hidden on phones, where the preview is already mobile width. Links use `→` instead of `↗`, which iOS renders as an emoji.

## v0.1.11 — 2026-10-04

- Docs and Playground share one header: same markup (`makeHeader()` in `build/site.mjs`), styles (`site/shell.css`) and theme toggle (`site/shell.js`). The Playground gains the theme toggle; a test keeps both headers pixel-identical.
- `.u-shell-main` sets only block padding, so `.u-shell-layout` keeps its side gutters; `.u-shell-header-actions` gap is now `--u-space-2`.
- The Playground preview starts in the page's theme.
- The favicon follows the browser's color scheme (ink U on light, paper U on dark).
- Add `uniform-icon-color.svg` and its generated `uniform-icon-on-dark.svg`.
- Tighten the hero spacing; points sit between the lede and the actions.
- Fix the Atmosphere section anchor (`#labs-atmosphere`), which collided with the background canvas id.
- Playground tests run against the built site.

## v0.1.10 — 2026-10-04

- Fix CSS selector bug that broke the main site layout grid.

## v0.1.9 — 2026-10-04

- Fix button rendering width inside nav headers by removing whitespace and adding font-size: 0.
- Demote Atmosphere wave to an experimental feature in text.
- Remove overlapping s-hero-art collage from the landing page.
- Add a standard u-shell shell system and use it across playground and landing page for consistent spacing and margins.
- Add a new "Authentication" preset to the playground.
- Fix u-callout border rendering corner artifact by using a pseudo element.

## v0.1.8 — 2026-10-04

- Replace the gallery with an interactive Playground: five starter patterns, state and heading controls, editable HTML, copy/reset, and light/dark and mobile/desktop previews. Existing `/gallery/` links remain usable.
- Refine the docs with icon theme/copy controls, aligned token actions, and readable asset names with explicit SVG downloads.
- Add browser coverage for Playground editing, draft retention, reset, clipboard, preview isolation, and accessibility across starter states and themes.
- No changes to `dist/`.

## v0.1.7 — 2026-10-04

- The repository moved to [UniformChicago/design](https://github.com/UniformChicago/design). Install with `github:UniformChicago/design#v0.1.7`.
- Verify this release's attestation with `-R UniformChicago/design`. Older releases were signed under the previous org name.
- No changes to `dist/`.

## v0.1.6 — 2026-10-04

- Docs site redesign:
  - a sticky sidebar that highlights the current section, and a dark/light toggle that is remembered across visits;
  - color, theme-variable, type, spacing and radius cards with copy buttons;
  - a live preview of every component above its markup;
  - code highlighted at build time (no highlighter script ships), with copy buttons;
  - a hero built from real components.
- Tests: axe in both themes, theme persistence, sidebar targets, copy, and that each live example matches its code.
- No changes to `dist/`.

## v0.1.5 — 2026-10-04

- First GitHub Release. Releases now carry the npm tarball, `SHA256SUMS` and a signed build-provenance attestation. Releases are cut only after every check passes.
- Docs site at [design.uniformrealestate.com](https://design.uniformrealestate.com/): install, tokens generated from `tokens.json`, components, assets and releases. The gallery is included. Both are tested with axe and a link check.
- No changes to `dist/`. Upgrading from v0.1.4 is optional.

Earlier versions are plain tags, without Release assets.

## v0.1.4 — 2026-10-04

- `tokens.js` plus `tokens.d.ts` replace the raw TypeScript tokens, so `@uniform/design/tokens` imports in Node, bundlers and TypeScript alike.
- The package ships `NOTICE` and `LICENSE-BRAND` with the brand marks.
- CI fails if a brand SVG uses a color that isn't a token.
- `waves.js` rejects a zero step, out-of-range sizes and non-hex colors. This fixes a hang and markup injection.
- The gallery is tested in Playwright with axe, in both themes, on desktop and mobile. Tests cover keyboard focus and horizontal scroll.
- Fix: a scrollable `u-table` wrapper must be focusable.

## v0.1.3 — 2026-10-04

- Type declarations for `waves.js`.

## v0.1.2 — 2026-10-04

- `dist/vars.css`: variables only, for projects that self-host fonts.

## v0.1.1 — 2026-10-04

- Standalone `.u-hint`, and a styled file picker.

## v0.1.0 — 2026-10-04

- First release:
  - tokens from a single source, built to CSS, TypeScript and Python;
  - allowlisted brand assets;
  - self-hosted fonts (OFL);
  - Atmosphere waves, as canvas and static SVG;
  - `u-*` CSS components in dark and light;
  - the gallery;
  - an AA contrast check.
