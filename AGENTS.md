# AGENTS.md

This is a **public** repository. Keep it to design: tokens, assets, components, and their build.

## Rules

1. **Nothing internal.** No business plans, company or product names that aren't public, people's names, license numbers, customer data, internal URLs, or explanations of why something is excluded. Example data in the gallery is placeholder data.
2. **Brand files are allowlisted.** A file in `brand/svg/` must be listed in `brand/assets.txt`; CI rejects anything else.
3. **Tokens are the only source of brand values.** Change `tokens/tokens.json`, rebuild, and commit `dist/`. Consumers never hard-code hex values.
4. **Accessibility is enforced.** Every text/background pair in `tokens.json → contrast.pairs` must meet WCAG AA; add a pair whenever a new combination is used.
5. **Components are plain CSS** (`u-*` classes) that work without JavaScript and under a strict CSP: no inline styles, no `data:` URIs, no third-party resources.
6. **The brand dot is `.u-dot`,** never a typed period.
7. Before saying done: `npm run build && npm run check`, and look at `gallery/index.html` in both themes.
