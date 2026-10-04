# 0001: Distribute through GitHub Releases, not a package registry

- Status: accepted
- Date: 2026-10-04

## Context

Consumers (platform, marketing, the policy PDF builder) pin `github:UniformRealEstate/design#vX.Y.Z`, and `dist/` is committed, so installing never runs a build. There were tags but no Releases, and the repository's "Packages" panel was empty, which made it unclear how the kit ships.

The options:

- **GitHub Packages (npm):** installs need a token even for public packages, so every consumer's CI would gain a secret, outsiders included.
- **npmjs.com:** easiest for outsiders. But it needs an npm org, and the `@uniform` scope is likely taken, so the package would be renamed. It's another account to secure.
- **GitHub Releases:** no account and no token. The tag stays the install source.

## Decision

Each `v*` tag produces a GitHub Release (`.github/workflows/release.yml`) after the full check suite passes. The tag must equal `package.json` `version`. The release carries:

- the notes from `CHANGELOG.md`;
- the `npm pack` tarball;
- `SHA256SUMS`;
- a signed build-provenance attestation. Verify it with `gh attestation verify <tarball> -R UniformRealEstate/design`.

The "Packages" panel is hidden from the repository home page.

## Revisit when

- someone outside Uniform wants to depend on the kit (publish to npmjs.com with trusted publishing, no token); or
- a consumer can't use git dependencies.
