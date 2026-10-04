# Uniform design system

Tokens, brand assets, the Atmosphere wave motif, and CSS components shared by every Uniform surface.

```
tokens/tokens.json      single source: color, type, radius, space, dot
components/             CSS components (u-*), dark by default, light with data-theme="light"
atmosphere/waves.js     contour math, animated canvas, static SVG export
brand/                  logos and icon (see LICENSE-BRAND), fonts (SIL OFL)
gallery/index.html      every component on dark and light
dist/                   built output, committed: design.css, tokens.css/.ts/.py, svg/, fonts/, waves/
```

## Use

- **Node projects:** `"@uniform/design": "github:UniformRealEstate/design#v0.1.0"`, then serve `node_modules/@uniform/design/dist/` (for example copied to `public/design/`) and link `design/design.css`.
- **Python or anything else:** download files from a tag's `dist/`, and verify them against `dist/manifest.json` (SHA-256 per file).
- Markup: `<body class="u-root">`, components like `<div class="u-panel">`. The brand dot is `<span class="u-dot" aria-hidden="true"></span>`, never a typed period.

## Change

1. Edit `tokens/`, `components/`, `atmosphere/` or `brand/`. A new brand file must also be listed in `brand/assets.txt`.
2. `npm run build`, then `npm run check` (format, dist up to date, WCAG AA contrast, asset allowlist).
3. Open `gallery/index.html` and check both themes.
4. Release with a tag (`vX.Y.Z`). Consumers upgrade by bumping their pinned tag.

## License

Code: Apache-2.0 (LICENSE). Brand marks: all rights reserved (LICENSE-BRAND). Fonts: SIL OFL. Copyright 2026 Uniform Real Estate LLC.
