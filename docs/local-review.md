# Local review

Status: local frontend implementation; nothing deployed or released. Browser execution remains blocked by this session's server-binding sandbox.

## Review

Run `npm run build && node build/site.mjs`, serve `_site/` over HTTP, and open `/workflows/map.html`. The default map uses OpenFreeMap street maps through MapLibre, with automatic light/dark styles and no API key. File URLs are not supported for map modules/workers.

Five pattern pages share a generated shell: map/list, multi-step intake, status dashboard, searchable collection and component states. The catalog contains 17 component contracts and seven pattern contracts. Static catalog, generated Markdown, CLI and seven read-only WebMCP tools share that source.

Maps, dialogs, local collection filtering, file metadata checks and step navigation are frontend behavior. Application backends, uploads, live listings and regulatory rules are outside scope.

## Map provider choice

Omitting `provider` selects OpenFreeMap. A consumer can provide a MapLibre-compatible style or light/dark styles, optionally a request transform for a paid or self-hosted provider. An explicit renderer option supports other adapters; the existing Leaflet GeoJSON adapter remains available without loading it on the default page.

See `docs/map-integration.md` for asset order, record shape, CSP origins, attribution and lifecycle. Default map requests contact tiles.openfreemap.org. Provider errors do not trigger fallback to a different provider. Core CSS makes no map requests.

## Verification

Passed:

- Deterministic build, manifest hashes, formatting, token contrast and publishing guards.
- Twenty-two Node tests: agent recipes/validation, metadata integrity, lifecycle cleanup, source recovery, stale callbacks, provider overrides and theme/camera state preservation. Renderer behavior is tested with doubles, not a GPU/browser.
- Design lint, asset budgets, upstream vendor hashes and package dry run.
- OpenFreeMap light/dark style and TileJSON HTTP responses.

Pending:

- Actual browser rendering, accessibility, gestures, strict-CSP behavior and screenshot review in both themes. The latest attempt failed at `listen EPERM 127.0.0.1:4400` before executing tests.
- Browser-native WebMCP interoperability and autonomous-agent usability evaluation.
- Stable release, consumer upgrades and migration sign-off.

Browser tests now intercept style requests for deterministic integration checks, so they do not depend on public tile availability. Live-provider rendering needs a separate human review.

`npm run check:budgets` measures core and optional map assets separately. MapLibre main module and worker total about 430 KB gzip, plus CSS. This is an explicit optional cost; no map engine is added to ordinary component pages. Byte checks do not establish interaction performance.

Clustering is enabled by default for overlapping markers. The example includes two records about 180 m apart to review clustering and separation across zoom levels; identical-coordinate handling remains covered by unit tests.
