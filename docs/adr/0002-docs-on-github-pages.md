# 0002: Host design.uniformrealestate.com on GitHub Pages

- Status: accepted
- Date: 2026-10-04

## Context

The kit needs a public docs site: install steps, tokens, components and assets. The repository is public, and so is everything the site shows.

## Decision

**Hosting and deploys:**

- GitHub Pages deploys the site from the release workflow, so the docs always match the latest release.
- Deploys use GitHub's built-in OIDC, with no stored credentials. A Cloudflare Pages project would need a deploy token kept as a secret in a public repository.

**Build:**

- `build/site.mjs` builds `_site/`: the docs page, with token tables generated from `tokens/tokens.json`, plus the gallery and `dist/`.
- The site's own tests (axe, links, layout) run with the gallery's in CI.

**Domain:**

- `design` in the `uniformrealestate.com` zone is a DNS-only CNAME to `uniformchicago.github.io`, managed in infra. It's DNS-only because GitHub must issue the certificate.
- The domain is verified on the GitHub organization, so no other repository can claim it. The custom domain was set on this repository before the DNS record existed.

## Consequences

- No Cloudflare headers on this site. It has no cookies, forms or personal data, so the portal's CSP and security headers don't apply.
- Pages being off-Cloudflare is deliberate for this site only. The website and portal stay on Cloudflare.
