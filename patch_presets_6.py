import sys

with open("gallery/presets.js", "r") as f:
    content = f.read()

target = """  {
    id: "callout",
    name: "Feedback",
    description: "Status & callouts",
    section: "callouts",
    title: "Everything is up to date",
    states: ["Information", "Error"],
    render: (title, state) => `<section class="u-panel">
  <p class="u-eyebrow">Workspace status</p>
  <h2 class="u-heading">${esc(title)}</h2>
  <p class="u-callout${state === "Error" ? " u-callout--danger" : ""}">${state === "Error" ? "We couldn’t save your changes. Please try again." : "Your latest changes have been saved."}</p>
</section>`,
  },
];"""

replacement = """  {
    id: "callout",
    name: "Feedback",
    description: "Status & callouts",
    section: "callouts",
    title: "Everything is up to date",
    states: ["Information", "Error"],
    render: (title, state) => `<section class="u-panel">
  <p class="u-eyebrow">Workspace status</p>
  <h2 class="u-heading">${esc(title)}</h2>
  <p class="u-callout${state === "Error" ? " u-callout--danger" : ""}">${state === "Error" ? "We couldn’t save your changes. Please try again." : "Your latest changes have been saved."}</p>
</section>`,
  },
  {
    id: "auth",
    name: "Authentication",
    description: "Forms, inputs & links",
    section: "auth",
    title: "Sign in",
    states: ["Default", "Error"],
    render: (title, state) => `<section class="u-panel" style="max-width: 400px; margin: 0 auto;">
  <h2 class="u-heading">${esc(title)}</h2>
  <p class="u-meta">Welcome back to Uniform.</p>
  ${state === "Error" ? '<p class="u-callout u-callout--danger" style="margin-bottom: var(--u-space-4);">Invalid email or password.</p>' : ''}
  <form>
    <div class="u-field"><label for="email">Email address</label><input id="email" type="email" placeholder="you@example.com" /></div>
    <div class="u-field"><label for="password">Password</label><input id="password" type="password" /></div>
    <div class="u-actions">
      <button class="u-button" type="button">Sign in</button>
      <button class="u-button u-button--quiet" type="button">Forgot password?</button>
    </div>
  </form>
</section>`,
  },
];"""

if target in content:
    content = content.replace(target, replacement)
    with open("gallery/presets.js", "w") as f:
        f.write(content)
    print("Updated presets.js with 6th example")
else:
    print("Target not found in presets.js")

