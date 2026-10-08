# Map defaults and provider independence

Status: implemented locally; browser acceptance pending.

Default to OpenFreeMap street tiles through MapLibre GL JS 6.13.0. Consumers get a useful map without arranging credentials. A provider configuration supplies a single style or light/dark styles and an optional request transform. No provider-specific behavior belongs in map/list selection, filters or details.

An explicit renderer adapter option permits other SDKs. The earlier Leaflet 1.9.4 GeoJSON renderer remains available as an alternative; the default page does not load it. Both renderer distributions remain optional package assets, separate from core CSS.

OpenFreeMap requests are enabled on mounting the default map and require visible attribution. Consumers opting for paid providers own their keys, terms and CSP configuration. Never silently switch providers after an error.

The design package owns presentation and interaction. Backends, geocoding and live listings remain outside scope. See [map-integration.md](../map-integration.md) for installation and verification limits.
