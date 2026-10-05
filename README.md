<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="dist/svg/uniform-wordmark-on-dark.svg" />
    <img src="brand/svg/uniform-wordmark-color.svg" alt="Uniform" width="280" />
  </picture>
</p>

<p align="center">
  <a href="https://github.com/UniformChicago/design/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/UniformChicago/design/actions/workflows/ci.yml/badge.svg?branch=main" /></a>
  <a href="https://github.com/UniformChicago/design/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/UniformChicago/design?sort=semver" /></a>
  <a href="https://design.uniformrealestate.com/"><img alt="Docs" src="https://img.shields.io/badge/docs-design.uniformrealestate.com-1f5f7a" /></a>
  <a href="LICENSE"><img alt="License: Apache-2.0 (code)" src="https://img.shields.io/badge/code-Apache--2.0-5e6e79" /></a>
  <a href="tests/"><img alt="WCAG 2.2 AA: axe-tested" src="https://img.shields.io/badge/WCAG_2.2_AA-axe--tested-5e6e79" /></a>
</p>

# A shared visual foundation for real estate software

**Consistent interfaces, from the first public page to the last transaction document.**

Uniform Design brings brand tokens, CSS components, and self-hosted typography into one small, versioned package. It also includes experimental features like the Atmosphere wave. Use the same foundation in a website, an application, or an HTML document destined for PDF.

[Docs](https://design.uniformrealestate.com/) · [Get started](#get-started) · [Components](#components) · [Tokens and assets](#tokens-and-assets) · [Contribute](#contribute) · [Licensing](#licensing)

## Built to travel

- **HTML first.** Plain `u-*` CSS classes. No framework or component JavaScript required.
- **Shared brand values.** Tokens generate CSS variables, TypeScript constants, and Python constants.
- **Two themes.** Dark by default; light wherever you set `data-theme="light"`.
- **Self-hosted assets.** Fonts, logos, styles, and optional animation ship together. No runtime CDN requests.
- **CSP-conscious.** External CSS, with no inline styles or `data:` assets required for components.
- **Small dependency surface.** No runtime package dependencies; a Node build produces committed assets and a SHA-256 manifest.

### Status and scope

**Early foundation · v0.1.8.** This release supplies visual primitives and an interactive component playground. It is not yet a complete application UI framework or an accessibility certification. Pin a release and test it in your application before upgrading.

The direction is a shared foundation for more real estate experiences. Today, routing, authentication, data handling, interactive widget behavior, and regulatory requirements belong to the consuming application. Dialogs, comboboxes, date pickers, and other complex controls are not supplied.

## Get started

### 1. Install a pinned release

```sh
npm install --save-exact github:UniformChicago/design#v0.1.8
```

The package name is `@uniform/design`. It installs from a Git tag; there is no registry package ([why](docs/adr/0001-releases-not-a-registry.md)). Each tag has a [GitHub Release](https://github.com/UniformChicago/design/releases) with the tarball, `SHA256SUMS` and a signed provenance attestation. The package declares Node 24 or newer; repository development uses the version in [`.nvmrc`](.nvmrc).

### 2. Serve the assets

Copy the **contents** of `node_modules/@uniform/design/dist/` into your application's static directory. For an application serving `public/` at its root:

```sh
mkdir -p public/design
cp -R node_modules/@uniform/design/dist/. public/design/
```

Keep the directory structure intact: CSS references fonts through relative paths. Link the stylesheet:

```html
<link rel="stylesheet" href="/design/design.css" />
```

### 3. Compose with semantic HTML

```html
<body class="u-root" data-theme="light">
  <main class="u-panel">
    <h1 class="u-title">Your workspace<span class="u-dot" aria-hidden="true"></span></h1>
    <p class="u-lede">A clear place to begin.</p>
    <a class="u-button" href="/records">View records</a>
  </main>
</body>
```

Omit `data-theme="light"` for dark mode. Theme attributes can also be applied to individual sections. Styles define root-level theme variables and `color-scheme`; evaluate those global defaults when embedding the kit in an existing application.

Use native elements for their behavior: anchors for navigation, buttons for actions, and labels associated with form controls. CSS supplies presentation; your markup and application supply semantics and behavior.

## Components

| Need                         | Classes                                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Typography                   | `u-title`, `u-heading`, `u-eyebrow`, `u-lede`, `u-meta`, `u-code`                                                                  |
| Surfaces and messages        | `u-panel`, `u-panel--accent`, `u-callout`, `u-callout--danger`, `u-empty`                                                          |
| Actions                      | `u-button`, `u-button--quiet`                                                                                                      |
| Forms                        | `u-field`, `u-select`, `u-hint`                                                                                                    |
| Structured information       | `u-facts`, `u-facts--stacked`, `u-table` (scrolls on narrow screens: give the wrapper `tabindex="0" role="region" aria-label="…"`) |
| Status and progress          | `u-tag`, `u-tag--ok`, `u-tag--warn`, `u-check`, `u-progress`                                                                       |
| Navigation and accessibility | `u-nav`, `u-skip`, `u-sr`                                                                                                          |
| Brand details                | `u-dot`, `u-atmosphere`                                                                                                            |

[Playground](https://design.uniformrealestate.com/playground/) offers starter patterns, state and heading controls, light/dark previews, a mobile-width preview, and editable HTML with copy/reset actions. Drafts survive switching patterns within the current page; reloading clears them. State and heading controls regenerate the current pattern.

For a local preview, run `npm run build`, `node build/site.mjs`, and `node scripts/serve.mjs 4401 ../_site/`, then open `http://127.0.0.1:4401/playground/`. The built site also keeps `/gallery/` working as an alias.

For a labeled field with help text:

```html
<div class="u-field">
  <label for="record-title">Record title</label>
  <input id="record-title" name="title" type="text" aria-describedby="title-hint" />
  <span class="u-hint" id="title-hint">Use a short, descriptive title.</span>
</div>
```

Provide application-specific validation, error announcements, loading states, and disabled behavior. The kit does not yet define a complete state system for every control.

## Tokens and assets

| Entry                        | Use                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `@uniform/design/design.css` | Tokens, font faces, and components together                                  |
| `@uniform/design/tokens.css` | Brand variables and font faces                                               |
| `@uniform/design/vars.css`   | Brand variables only, for applications managing their own fonts              |
| `dist/tokens.js` + `.d.ts`   | `import { tokens } from "@uniform/design/tokens"`: plain JS with exact types |
| `dist/tokens.py`             | Constants for Python consumers                                               |
| `@uniform/design/waves`      | Contour math, SVG generation, and browser animation                          |
| `dist/svg/`, `dist/fonts/`   | Brand marks and self-hosted fonts; separate licenses apply                   |
| `dist/manifest.json`         | SHA-256 hashes for generated files                                           |

For your own components, use semantic variables from `design.css`, plus spacing and radius tokens:

```css
.record-card {
  background: var(--u-surface);
  color: var(--u-fg);
  padding: var(--u-space-5);
  border-radius: var(--u-radius-lg);
}
```

Python and other non-Node projects can obtain `dist/` from a pinned Git tag. Verify downloaded files against its manifest. The manifest detects mismatched files; establish trust in the release separately. Preserve the accompanying code, brand, and font license files when redistributing assets.

## Labs: Atmosphere

The optional wave effect shares one implementation between animated canvas and static SVG output. For a server-rendered page:

```html
<canvas id="atmosphere" class="u-atmosphere" aria-hidden="true"></canvas>
<script type="module" src="/design/atmosphere.js"></script>
```

For application-controlled mounting:

```js
import { mountAtmosphere } from "@uniform/design/waves";

const dispose = mountAtmosphere(document.querySelector("#atmosphere"));
// Call dispose() when the owning view unmounts.
```

The canvas uses viewport dimensions. Animation pauses for reduced-motion preferences and hidden documents; cleanup removes listeners and its animation frame. Keep decorative canvas hidden from assistive technology and check its stacking order in your layout.

`contours(width, height, time, options)` returns polylines; `contoursSvg(width, height, options)` returns SVG text. See [the API types](atmosphere/waves.d.ts). These helpers currently expect trusted, valid inputs: finite positive dimensions and step values, bounded strand counts, and trusted color constants. Do not pass user-controlled strings into SVG generation or insert untrusted SVG into a page.

## Quality and accessibility

Current CI checks formatting, exact agreement between sources and committed `dist/`, AA text contrast for explicitly listed token pairs, brand SVG colors, the brand-asset allowlist, a limited credential-pattern scan, and GitHub Actions workflow security linting. Playwright runs axe (WCAG 2.2 AA plus best practices), keyboard focus, horizontal-scroll and broken-link checks on the gallery and the docs site, at desktop and mobile sizes.

These checks are a baseline. They do not yet cover every rendered component state, screen reader behavior, or browser. Test actual pages in both themes, including focus, errors, zoom, and reduced motion. Verify CSP compatibility against the consuming application's policy.

## Contribute

Read [AGENTS.md](AGENTS.md) for repository rules. Keep changes focused on reusable design assets and behavior, with placeholder data in examples.

```sh
nvm use
npm ci
npm run build
npm run check
```

1. Edit source files, not generated `dist/` files.
2. Change brand values in `tokens/tokens.json`; register new text/background combinations in `contrast.pairs`.
3. Add brand files to `brand/assets.txt` when applicable.
4. Rebuild and commit `dist/` alongside the source change.
5. Inspect the gallery in both themes and verify affected consuming applications.

```text
tokens/        Brand values and declared contrast pairs
components/    Framework-independent CSS
atmosphere/    Shared wave implementation and types
brand/         Marks, fonts, and font licenses
build/         Deterministic asset generation
scripts/       Repository checks
gallery/       Playground source (built at /playground/ and /gallery/)
site/          Docs site source (built into _site/ by build/site.mjs)
docs/adr/      Decisions: distribution, docs hosting
dist/          Committed release assets
```

To release: bump `version` in `package.json`, add a `## vX.Y.Z` section to [CHANGELOG.md](CHANGELOG.md), merge, then push the tag `vX.Y.Z`. [The release workflow](.github/workflows/release.yml) reruns every check, then publishes the GitHub Release and deploys the docs. Consumers upgrade explicitly by updating their pinned dependency and lockfile. During `0.x`, review changes and validate integrations before adopting a new release.

## Licensing

**Code is reusable; Uniform's identity is reserved.**

- Code: [Apache-2.0](LICENSE), with attribution details in [NOTICE](NOTICE).
- Uniform names, logos, wordmarks, and icons: [all rights reserved](LICENSE-BRAND). Publishing assets does not grant permission to brand another product as Uniform.
- Fonts: SIL Open Font License; see [Public Sans](brand/fonts/OFL-PublicSans.txt) and [IBM Plex Mono](brand/fonts/OFL-IBMPlexMono.txt).

If you use the code for a different brand, supply your own identity assets and tokens.
