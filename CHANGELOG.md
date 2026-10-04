# Changelog

Each release is a `vX.Y.Z` tag with a [GitHub Release](https://github.com/UniformRealEstate/design/releases): notes from this file, the npm tarball, `SHA256SUMS` and a signed build-provenance attestation. During `0.x`, any release may change markup or class names; read the notes before upgrading.

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
