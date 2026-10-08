# Release readiness — v0.2.0

The documentation design has been reviewed by the founder. Browser-native WebMCP registration, `list_design` and `get_recipe` have also been exercised in Chrome. Automated browser/accessibility checks still need to pass on a host that can run Playwright; the local sandbox prevents browser startup and server binding.

## Prepared

- A shared logo link to Components, an accessible Playground icon and theme controls across documentation pages.
- Menus and sidebars retain native scrolling and sticky positioning with hidden scrollbar chrome.
- Consistent 48px form controls, complete table borders and richer property summaries with a page-local shortlist.
- Seventeen component contracts, seven pattern contracts and five generated workflow pages.
- Deterministic build, manifest, token contrast, 34 contract tests and asset budgets pass locally.
- Package dry run includes the distributable assets and third-party licenses; it excludes tests, documentation output and development dependencies.
- Release workflow installs Chromium, Firefox and WebKit to match the test configuration.
- Optional map libraries retain their licenses and are listed in NOTICE.
- Version `0.2.0` is set in package.json and package-lock.json, with matching release notes, README installation examples and regenerated assets. Publication has not happened.

## Before tagging

1. Run the full browser suite in CI: Chromium desktop/mobile plus Firefox/WebKit workflow checks. Fix any failures. Check the compact header at narrow widths and on a short desktop viewport in both themes. Exercise keyboard navigation, context menus, unknown locations and all four map/list modes. Confirm Live/Markup switching and starter changes preserve geometry and drafts.
2. Review the new source and generated files together, including optional map assets and licenses. Commit all required files; local untracked files do not ship in a Git tag.
3. Keep the component maturity at preview until broader accessibility and consumer review is complete. Version and release notes are prepared for `0.2.0`.
4. Run `npm run build && npm run check`, `npm run test:a11y` on a supported host, and `npm pack --dry-run`. Verify packaged contracts, modules, styles, fonts and licenses.
5. Merge with green CI, then push the matching `vX.Y.Z` tag. The existing release workflow publishes the GitHub Release, tarball, checksums and provenance, then deploys the documentation to GitHub Pages.
6. Confirm the release workflow and documentation deployment succeeded. Check the live page navigation, theme persistence, Playground and Agent contract; confirm the version and packaged links match the release.

Pixelmatch screenshot comparisons remain a separate proposal. They are not configured and are not required by the existing release workflow.
