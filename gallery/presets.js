import { workflowStarters } from "./workflow-starters.js";

const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const components = [
  {
    id: "records",
    name: "Record list",
    description: "Tables, tags & actions",
    section: "tables",
    title: "Your documents",
    states: ["Mixed", "Complete"],
    render: (title, state) => `<section class="u-panel">
  <p class="u-eyebrow">Workspace</p>
  <h2 class="u-heading">${esc(title)}</h2>
  <p class="u-meta">Everything you need for the next step.</p>
  <div class="u-table" tabindex="0" role="region" aria-label="Documents">
    <table>
      <thead><tr><th scope="col">Document</th><th scope="col">Category</th><th scope="col">Status</th></tr></thead>
      <tbody>
        <tr><td>Purchase agreement</td><td>Agreement</td><td><span class="u-tag u-tag--ok">Complete</span></td></tr>
        <tr><td>Property disclosure</td><td>Disclosure</td><td><span class="u-tag ${state === "Complete" ? "u-tag--ok" : "u-tag--warn"}">${state === "Complete" ? "Complete" : "In review"}</span></td></tr>
        <tr><td>Closing checklist</td><td>Checklist</td><td><span class="u-tag ${state === "Complete" ? "u-tag--ok" : ""}">${state === "Complete" ? "Complete" : "Draft"}</span></td></tr>
      </tbody>
    </table>
  </div>
</section>`,
  },
  {
    id: "form",
    name: "Intake form",
    description: "Fields, hints & buttons",
    section: "forms",
    title: "Add a document",
    states: ["Default", "Disabled"],
    render: (title, state) => `<section class="u-panel">
  <p class="u-eyebrow">New record</p>
  <h2 class="u-heading">${esc(title)}</h2>
  <p class="u-meta">Keep the details in one place.</p>
  <form>
    <div class="u-field"><label for="document-title">Document title</label><input id="document-title" placeholder="e.g. Purchase agreement" ${state === "Disabled" ? "disabled" : ""} /></div>
    <div class="u-field"><label for="category">Category</label><span class="u-select"><select id="category" ${state === "Disabled" ? "disabled" : ""}><option>Agreement</option><option>Disclosure</option><option>Checklist</option></select></span></div>
    <div class="u-field"><label for="notes">Notes</label><textarea id="notes" rows="3" aria-describedby="notes-hint" placeholder="Add a little context" ${state === "Disabled" ? "disabled" : ""}></textarea><span id="notes-hint" class="u-hint">Optional. Include anything helpful for review.</span></div>
    <div class="u-actions">
      <button class="u-button" type="button" ${state === "Disabled" ? "disabled" : ""}>Save document</button>
      <button class="u-button u-button--quiet" type="button" ${state === "Disabled" ? "disabled" : ""}>Cancel</button>
    </div>
  </form>
</section>`,
  },
  {
    id: "empty",
    name: "Empty state",
    description: "A clear next step",
    section: "empty",
    title: "A fresh start",
    states: ["First use", "No results"],
    render: (title, state) => `<section class="u-empty">
  <p class="u-eyebrow">${state === "No results" ? "Search" : "Documents"}</p>
  <h2 class="u-heading">${esc(title)}</h2>
  <p>${state === "No results" ? "No documents match these filters. Try a broader search." : "Your workspace is ready. Add your first document to get started."}</p>
  <button class="u-button" type="button">${state === "No results" ? "Clear filters" : "Add a document"}</button>
</section>`,
  },
  {
    id: "buttons",
    name: "Actions",
    description: "Primary & quiet buttons",
    section: "buttons",
    title: "Ready for the next step?",
    states: ["Default", "Disabled"],
    render: (title, state) => `<section class="u-panel">
  <h2 class="u-heading">${esc(title)}</h2>
  <p class="u-meta">One primary action, with room for an alternative.</p>
  <div class="u-actions">
    <button class="u-button" type="button" ${state === "Disabled" ? "disabled" : ""}>Continue</button>
    <button class="u-button u-button--quiet" type="button" ${state === "Disabled" ? "disabled" : ""}>Save for later</button>
  </div>
</section>`,
  },
  {
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
  ${state === "Error" ? '<p class="u-callout u-callout--danger" style="margin-bottom: var(--u-space-4);">Invalid email or password.</p>' : ""}
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
];

export const presets = [
  ...workflowStarters.map((starter) => ({
    ...starter,
    states: ["Default"],
    render: (title) =>
      starter.markup.replace(
        /(<h1[^>]*>)[\s\S]*?<\/h1>/,
        (_, opening) => `${opening}${esc(title)}<span class="u-dot" aria-hidden="true"></span></h1>`,
      ),
  })),
  ...components,
];
