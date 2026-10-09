# Maps: working default, configurable provider

The default is MapLibre GL JS 6.13.0 with OpenFreeMap: street maps, labels, light/dark themes, no account or API key. OpenFreeMap states that its public instance is free with no view/request limits; this is a third-party service, not a Uniform availability guarantee. Required provider/data attribution stays visible.

The map/list UI is independent of the renderer and tile provider. Core design.css does not load a map library or make network requests. Mounting the default map does request external styles, tiles, glyphs and sprites from tiles.openfreemap.org.

## Default integration

Retrieve `node scripts/design.mjs recipe map-list` or WebMCP `get_recipe({id: "map-list"})`. Load the returned markup, stylesheet list and classic scripts, then initialize from an external ES module:

```js
import * as maplibre from "./dist/vendor/maplibre/maplibre-gl.mjs";
maplibre.setWorkerUrl(
  new URL("./dist/vendor/maplibre/maplibre-gl-worker.mjs?v=6.13.0", import.meta.url).href,
);
const root = document.querySelector("[data-map-preview]");
const connection = UniformMapList.connect(root, {
  maplibre,
  records: [{ id: "example", title: "Example property", label: "$425,000", location: [41.94, -87.67] }],
});
// connection.reload() retries the current provider.
// connection.destroy() runs before removing the root.
```

Styles, in order: `design.css`, `vendor/maplibre/maplibre-gl.css`, `map.css`. Classic scripts: `maplibre.js`, `map-list.js`. Serve over HTTP(S); workers and module imports need a normal web origin. The package contains the pinned upstream runtime, worker, CSS, license and provenance hashes; no CDN script dependency is needed.

Record locations use `[latitude, longitude]`, converted internally for MapLibre. IDs must match the `data-property` cards. Records without locations stay in the list. Replace the example cards and data together. Records are fixed for a mount; destroy/remount to replace the dataset. Use unique HTML IDs across instances. The optional state controls inside “Pattern reference” can be omitted.

## Choose a different provider

Supply a MapLibre-compatible style URL or style object. A single style stays the same across theme changes:

```js
const connection = UniformMapList.connect(root, {
  maplibre,
  records,
  provider: {
    style: "https://your-provider.example/style.json?key=YOUR_PUBLIC_BROWSER_KEY",
    // Optional transformRequest(url, resourceType) for provider-specific requests.
  },
});
```

Or provide `lightStyle` and `darkStyle` URLs/objects. Custom configuration fully replaces the OpenFreeMap default; failure never silently sends requests to another provider. Style changes and retry preserve the viewport, selection and filters.

Provider keys, usage limits, browser-origin restrictions, attribution and CSP origins belong to the consuming application. Use only browser-safe public credentials. Style definitions are trusted application configuration. A Mapbox/Google-specific SDK is not interchangeable with a MapLibre style; it needs its own renderer adapter.

## Renderer alternatives

`renderer` accepts an adapter with `mount(root, options)` returning `select(id)`, `preview(id)`, `filter(ids)`, `reload()`, `resize()` and `destroy()`. The adapter calls `onState("loading"|"ready"|"error")`, `onPreview(id|null)` and `onSelect(id, keyboard, originatingElement)`.

The earlier Leaflet boundary renderer remains available explicitly. Load `vendor/leaflet.js`, `vendor/leaflet.css` and `map.js`, then pass `renderer: UniformMap`, `leaflet: L`, records and an abortable `source({signal})` returning GeoJSON. This alternative does not use OpenFreeMap. Its local Chicago data fixture is retained for testing; it is no longer the default basemap.

## Interaction and failure behavior

- Pan/pinch, keyboard navigation and accessible zoom buttons; wheel zoom is disabled to preserve page scrolling.
- Markers and list cards share selection/hover state. Selection scrolls only the results pane.
- Map loading/error overlays keep the renderer's dimensions stable. The list remains usable if WebGL or the provider fails.
- Initial framing uses located records. Retry and theme changes preserve the camera, visible records and selection.
- Default theme follows the containing `data-theme` element. Reduced motion disables zoom-control animation.
- Retry recreates the provider map; stale events from a removed instance cannot update state. Teardown removes map resources, listeners, timers and observers.
- Overlapping marker hit areas cluster by default. Activate a count to zoom in; shared coordinates or maximum zoom open a native dialog of members. Counts and selection indicators follow filters. Pass `clustering: false` to opt out.
- Clustering runs in screen space on movement completion, resize and filter changes; it is intended for modest client collections, not server-scale datasets.
- Geocoding, live listings, viewport queries and backends are outside this contract.

## CSP and verification

The default page allows same-origin scripts/workers, `connect-src https://tiles.openfreemap.org` and same-origin/blob/provider images. It uses custom HTML zoom controls instead of MapLibre's data-URI toolbar icons. Core styles keep the existing strict policy; only the map page gains the necessary network origins. Browser/CSP verification remains pending—MapLibre's upstream general CSP guidance also permits data images, while this integration keeps them disallowed.

Node tests cover provider override, coordinate conversion, theme/retry state preservation, stale events, cleanup and package assets using renderer test doubles. Browser integration tests use an intercepted style for deterministic checks, not public tile downloads. This session cannot bind the preview server, so real rendering, GPU/gesture compatibility and native WebMCP verification remain outstanding. The public light/dark style and TileJSON endpoints were fetched successfully; that is not a browser rendering test.

Sources: [OpenFreeMap](https://openfreemap.org/), [provider integration guide](https://openfreemap.org/quick_start/), [MapLibre installation/CSP](https://maplibre.org/maplibre-gl-js/docs/).

## Listing gallery and contextual actions

The preview switches between the split map/list surface and a full-width gallery. Gallery settings offer automatic, two or three columns plus photo or compact cards. Mobile galleries use one column. These controls preserve filters, selection and the sample shortlist.

Context actions are optional. Load `context-menu.css` after `design.css`, load `context-menu.js`, and call `UniformContextMenu.mount(root)`. Opt in only intended controls with `data-u-context-menu="menu-id"`; include a visible button with `data-u-context-open` for touch and keyboard users. Native menus remain available elsewhere and on unsupported hosts. Shift-right-click also preserves the native browser menu where the browser delivers that event.

Menus use native auto popovers, viewport-clamped cursor placement, arrow/Home/End navigation and Escape dismissal. Their position lives in the linked stylesheet through CSSOM; no inline style attribute or style element is added. Menu items dispatch `uniform:context-action` with `{action, trigger}`. Consumers provide the action handlers. The property fixture implements detail navigation, shortlist toggling and price copying, with clipboard failure announcements. Dispose the function returned by `mount` before removing a root.

Selecting a record without coordinates replaces the geographic view with an explicit unknown-location panel. The listing, photos and facts remain available. Renderer loading and failure states remain separate and take precedence while the provider is unavailable.

## Listing share previews

Set `data-share-url` on each `[data-property]` card to its public listing page. The Share property action uses that URL with the native share sheet, or copies the link when native sharing is unavailable. Without this attribute, it uses the current page with a property-selection hash.

The destination page must serve Open Graph metadata in its initial HTML: an absolute `og:url`, `og:title`, and an absolute `og:image` pointing to the property photo, with a default branded image when no photo is available. A hash selects a record in the browser but does not provide distinct metadata to share crawlers. The docs build demonstrates this with five static sample listing pages and labeled, watermarked photo cards. Consumers provide their own listing routes and image assets.

To regenerate the docs photo cards after changing sample photos or branding, run `node scripts/render-property-share.mjs`. Generated files in `site/share/` are committed; releases do not rerender them.
