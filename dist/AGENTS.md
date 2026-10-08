# Uniform Design agent contract

Package version: 0.2.0. Schema: 1.0.0.

Read catalog.json for machine-readable contracts and exact markup. These are preview contracts.

- Use semantic --u-* variables and documented u-* classes.
- Use the native element that supplies the required semantics.
- Use textContent for user-controlled values.
- Do not assume a preview component is certified or stable.
- Keep application policy and server authorization out of the design package.

## button: Actions

Trigger an action or navigate using a correctly typed element.

Maturity: preview. States: default, quiet, disabled, busy, danger.

- Use a button for actions and an anchor for navigation.
- Set type=button outside submission actions.
- Keep a visible label or accessible name; explain disabled actions.

Dependencies: design.css.

Customization: Labels, Documented variants, Adjacent layout.

Limitations: Browser and assistive-technology verification pending for this local change.

```html
<a class="u-button" href="#buttons">Primary action</a>
<button class="u-button u-button--quiet" type="button">Quiet action</button>
```

## field: Fields

Collect a labeled value with help and error feedback.

Maturity: preview. States: default, required, invalid, disabled, readonly.

- Associate a visible label with each control.
- Link help and error text through aria-describedby.
- Use aria-invalid=true only for an actual error.

Dependencies: design.css.

Customization: Label, Help text, Input type, Validation message.

Limitations: Browser and assistive-technology verification pending for this local change.

```html
<div class="u-field">
  <label for="ex-deal">Transaction</label>
  <input id="ex-deal" type="text" placeholder="e.g. 100 Example St" />
</div>
<div class="u-field">
  <label for="ex-category">Category</label>
  <span class="u-select">
    <select id="ex-category" aria-describedby="ex-category-hint">
      <option>agreement</option>
      <option>disclosure</option>
    </select>
  </span>
  <span class="u-hint" id="ex-category-hint">Uploads stay in your inbox until finalized.</span>
</div>
<div class="u-field">
  <label for="ex-file">File</label>
  <input id="ex-file" type="file" />
</div>
```

## select: Select

Choose one option using native keyboard and form behavior.

Maturity: preview. States: default, required, invalid, disabled.

- Wrap the select in u-select within u-field.
- Browser picker styling is progressive; unsupported browsers retain native menus.
- Searchable combobox behavior is not included.

Dependencies: design.css.

Customization: Label, Options, Required/disabled state.

Limitations: Browser and assistive-technology verification pending for this local change.

```html
<div class="u-field"><label for="example-status">Status</label><span class="u-select"><select id="example-status"><option>Draft</option><option>Complete</option></select></span></div>
```

## dialog: Confirmation dialog

Review a consequential action in a native modal dialog.

Maturity: preview. States: closed, open, cancelled, confirmed.

- Use showModal through the optional interaction controller.
- Provide aria-labelledby and an explicit cancel button.
- Initialize focus on the least destructive action.

Dependencies: design.css, interactions.js, UniformInteractions.mount(document).

Customization: Title, Description, Action labels.

Limitations: Browser and assistive-technology verification pending for this local change.

```html
<div class="u-stack">
  <div>
    <h3 class="u-section-heading">Review a sample action</h3>
    <p class="u-hint">Open a confirmation dialog. Cancel returns you to the preview; confirm updates its status.</p>
  </div>
  <div><button type="button" class="u-button" data-u-dialog-open="example-dialog" hidden>Review action</button></div>
  <p class="u-hint" id="example-dialog-status" role="status">No action taken.</p>
  <noscript><p class="u-hint">Enable JavaScript to try the confirmation.</p></noscript>
</div>
<dialog id="example-dialog" class="u-dialog" aria-labelledby="example-dialog-title" aria-describedby="example-dialog-description">
  <h2 id="example-dialog-title" class="u-section-heading">Confirm sample action</h2>
  <p id="example-dialog-description">This demonstrates a confirmation flow. No records will be changed.</p>
  <div class="u-actions">
    <button type="button" class="u-button u-button--quiet" data-u-dialog-close autofocus>Cancel</button>
    <button type="button" class="u-button" data-u-dialog-close="confirmed">Confirm</button>
  </div>
</dialog>
```

## table: Data table

Display comparable records with column and row semantics.

Maturity: preview. States: populated, loading, empty, error, filtered-empty.

- Use headers with scope and a named keyboard-reachable scroll region.
- Optional collection controller supplies title search, status filtering and title sorting. Pagination remains application-owned.

Dependencies: design.css.

Customization: Columns, Cell content, Row actions.

Limitations: Browser and assistive-technology verification pending for this local change.

```html
<div class="u-table" tabindex="0" role="region" aria-label="Example registry">
  <table>
    <thead>
      <tr>
        <th scope="col">Name</th>
        <th scope="col">Role</th>
        <th scope="col">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Jordan Rivera</td>
        <td>Example role</td>
        <td><span class="u-tag u-tag--ok">Active</span></td>
      </tr>
      <tr>
        <td>Sam Lee</td>
        <td>Example role</td>
        <td><span class="u-tag">Pending</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

## panel: Panel

Group related content into a readable surface.

Maturity: preview. States: default, accent.

- Provide a heading for meaningful sections.
- Avoid nested cards when a divider would suffice.

Dependencies: design.css.

Customization: Heading, Content, Accent variant.

Limitations: Browser and assistive-technology verification pending for this local change.

```html
<div class="u-panel">
  <p class="u-heading">Panel</p>
  <p>A surface for grouped content.</p>
</div>
<div class="u-panel u-panel--accent">
  <p class="u-heading">Accent panel</p>
  <p>The accent edge marks the primary panel on a page.</p>
</div>
```

## status: Status

Communicate state with text, not color alone.

Maturity: preview. States: neutral, attention, complete.

- Do not infer verification or authorization from a status color.

Dependencies: design.css.

Customization: Text, Documented status variants.

Limitations: Browser and assistive-technology verification pending for this local change.

```html
<span class="u-tag">Neutral</span>
<span class="u-tag u-tag--ok">Final</span>
<span class="u-tag u-tag--warn">Inbox</span>
```

## feedback: Feedback

Explain an outcome or recovery action.

Maturity: preview. States: informational, error.

- Describe what happened and what the user can do next.
- Use live announcements for dynamic events only.

Dependencies: design.css.

Customization: Message, Recovery action.

Limitations: Browser and assistive-technology verification pending for this local change.

```html
<p class="u-callout">Audit chain verified: 42 entries.</p>
<p class="u-callout u-callout--danger">Audit chain broken at entry 17.</p>
```

## empty: Empty state

Explain why a collection has no content and how to proceed.

Maturity: preview. States: initial, filtered-empty.

- Distinguish no data from no matching results and failed requests.

Dependencies: design.css.

Customization: Heading, Explanation, Action.

Limitations: Browser and assistive-technology verification pending for this local change.

```html
<div class="u-empty">
  <p class="u-heading">No records yet</p>
  <p>Upload a document to start.</p>
</div>
```

## facts: Labeled facts

Display stable details including financial and property information.

Maturity: preview. States: known, unknown, not-applicable.

- Unknown and missing are not zero.
- Keep units and estimated values explicit.

Dependencies: design.css.

Customization: Labels, Values, Units.

Limitations: Browser and assistive-technology verification pending for this local change.

```html
<dl class="u-facts">
  <dt>Category</dt>
  <dd>Agreement</dd>
  <dt>Size</dt>
  <dd>2.4 MB</dd>
</dl>
<dl class="u-facts u-facts--stacked">
  <dt>Name</dt>
  <dd>Jordan Rivera</dd>
  <dt>Service area</dt>
  <dd>Example City</dd>
</dl>
```

## progress: Progress

Show task completion without relying on color.

Maturity: preview. States: incomplete, complete, reduced-motion.

- Use accessible progress values and text.
- Respect reduced motion. For animated native progress, use optional UniformInteractions.setProgress(element, value); accessible values update immediately.
- Progress is not license approval.

Dependencies: design.css.

Customization: Label, Value, Maximum.

Limitations: Browser and assistive-technology verification pending for this local change.

```html
<div class="u-progress" role="progressbar" aria-label="Example progress" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100">
  <span class="s-w40"></span>
</div>
<div class="u-check u-check--done">
  <span class="u-check__status" aria-hidden="true"></span>
  <span>
    <span class="u-check__title">Example document</span>
    <span class="u-check__detail">Done</span>
  </span>
</div>
<div class="u-check u-check--progress">
  <span class="u-check__status" aria-hidden="true"></span>
  <span>
    <span class="u-check__title">Example step</span>
    <span class="u-check__detail">In progress</span>
  </span>
</div>
```

## navigation: Navigation

Locate the current view and expose destinations.

Maturity: preview. States: default, current.

- Use aria-current=page for the current route and aria-current=location for the current section.
- Use aria-pressed for buttons that select an in-page preview.

Dependencies: design.css.

Customization: Destinations, Labels.

Limitations: Browser and assistive-technology verification pending for this local change.

```html
<nav class="u-nav" aria-label="Example navigation">
  <a href="#navigation" aria-current="page"><span>Office</span></a>
  <a href="#navigation"><span>Records</span></a>
  <a href="#navigation"><span>Activity</span></a>
</nav>
```

## file: Document selection

Inspect a locally selected document before application upload.

Maturity: preview. States: empty, selected, invalid.

- This controller validates metadata only, never file contents.
- Applications must validate and authorize files on the server.
- Announce selection and errors.

Dependencies: design.css, interactions.js, UniformInteractions.mount(document).

Customization: Label, Help.

Limitations: Browser and assistive-technology verification pending for this local change.

```html
<div class="u-field"><label for="example-file">Sample PDF</label><input id="example-file" type="file" accept="application/pdf,.pdf" data-u-file aria-describedby="example-file-status"><span id="example-file-status" role="status" class="u-hint">No file selected.</span></div>
```

## identity: Person or firm

Summarize a person or organization and their relationship.

Maturity: preview. States: known, pending.

- Use placeholder identity data in fixtures.
- Show role and relationship explicitly.

Dependencies: design.css.

Customization: Name, Relationship, Avatar initials.

Limitations: Browser and assistive-technology verification pending for this local change.

```html
<div class="u-identity"><span class="u-avatar" aria-hidden="true">E</span><div><strong>Example contact</strong><p class="u-hint">Primary contact · Pending</p></div></div>
```

## activity: Activity timeline

Display a sequence of labeled events.

Maturity: preview. States: populated, empty.

- Use real timestamps in applications and distinguish them from due dates.

Dependencies: design.css.

Customization: Event labels, Descriptions, Times.

Limitations: Browser and assistive-technology verification pending for this local change.

```html
<ol class="u-activity"><li><strong>Sample added</strong><p>Example record</p><small>Time not provided</small></li></ol>
```

## property: Property facts

Present property information without assuming listing or map services.

Maturity: preview. States: known, partial.

- Use explicit units and missing-value labels.
- No geocoding or listing provider is included.

Dependencies: design.css.

Customization: Facts, Address, Units.

Limitations: Browser and assistive-technology verification pending for this local change.

```html
<dl class="u-property-facts"><div><dt>Property type</dt><dd>Residential</dd></div><div><dt>Area</dt><dd>Not provided</dd></div></dl>
```

## context-menu: Context menu

Offer contextual actions through a native popover.

Maturity: preview. States: closed, open, disabled.

- Load context-menu.css and context-menu.js; call UniformContextMenu.mount(root).
- Use named buttons with menuitem roles and data-u-context-action. Handle uniform:context-action on the trigger.
- Provide a visible opener and equivalent ordinary actions. Browser context menus remain available outside opted-in controls.

Dependencies: design.css, context-menu.css, context-menu.js.

Customization: Actions, Labels.

Limitations: Browser and assistive-technology verification pending.

```html
<button type="button" class="u-button" data-u-context-menu="example-context" data-u-context-open hidden>Open actions</button>
<div id="example-context" class="u-context-menu" popover="auto" role="menu" aria-label="Example actions">
  <button type="button" role="menuitem" tabindex="-1" data-u-context-action="review">Review sample</button>
  <button type="button" role="menuitem" tabindex="-1" disabled>Unavailable action</button>
</div>
<p class="u-hint">Right-click the button, use Shift+F10, or open its actions directly.</p>
<p class="u-hint" id="example-context-status" role="status">No action taken.</p>
```

## multi-step-intake: Multi-step intake

Validate before advancing; retain values on Back; focus each new step heading; announce save failure.

Maturity: preview. States: initial, invalid, draft-saved, review.

- Validate before advancing; retain values on Back; focus each new step heading; announce save failure.
- Replace fixture copy and persistence with application-owned data and policy.
- Use data-u-stepper, data-u-step, data-u-next, data-u-back and data-u-step-count hooks. Listen to uniform:step-change to render a review and uniform:complete to submit through application code.
- Mount one stepper per root; keep its data-u-step-list in that root. Application owns draft persistence and completion side effects.

Dependencies: design.css, interactions.js, UniformInteractions.mount(document).

Customization: Content, Data bindings, Composition using documented components.

Limitations: Fixture controllers are examples; application backend, authorization and regulatory rules are not supplied.

```html
<div class="u-page-header">
  <div>
    <span class="u-tag">Preview · onboarding</span>
    <h1 class="u-page-title">Your next chapter starts here<span class="u-dot" aria-hidden="true"></span></h1>
    <p class="u-lede">Start with where you are. Build a plan you can come back to.</p>
  </div>
</div>
<div class="u-columns">
  <section class="u-panel">
    <form id="onboarding" data-u-stepper novalidate>
      <p class="u-meta" id="step-count" data-u-step-count>Step 1 of 3</p>
      <div data-u-step="0">
        <h2 class="u-section-heading" tabindex="-1">Your starting point</h2>
        <p class="u-hint">Choose a starting point for this sample plan.</p>
        <div class="u-field">
          <label for="stage">Where are you in your journey?</label
          ><span class="u-select"
            ><select id="stage" name="stage" required aria-describedby="stage-error">
              <option value="">Choose your current stage</option>
              <option>Exploring a first license</option>
              <option>Preparing an application</option>
              <option>Managing an existing license</option>
            </select></span
          ><span class="u-field-error" id="stage-error" hidden>Choose your current stage to continue.</span>
        </div>
        <div class="u-field">
          <label for="goal">Your next goal</label
          ><span class="u-select"
            ><select id="goal" name="goal">
              <option>Get organized</option>
              <option>Find a sponsoring firm</option>
              <option>Prepare for renewal</option>
            </select></span
          >
        </div>
      </div>
      <div data-u-step="1" hidden>
        <h2 class="u-section-heading" tabindex="-1">Make room for progress</h2>
        <p class="u-hint">Set a personal check-in. This is not a regulatory deadline.</p>
        <div class="u-field">
          <label for="checkin">Check-in date (optional)</label
          ><input id="checkin" name="checkin" type="date" />
        </div>
        <div class="u-field">
          <label for="notes">What would help you move forward? (optional)</label
          ><textarea
            id="notes"
            name="notes"
            rows="4"
            maxlength="500"
            placeholder="For example, gathering my education records"
          ></textarea>
        </div>
      </div>
      <div data-u-step="2" hidden>
        <h2 class="u-section-heading" tabindex="-1">Your plan, at a glance</h2>
        <p class="u-hint">Review your choices before opening the sample dashboard.</p>
        <dl id="review" class="u-facts u-facts--stacked"></dl>
      </div>
      <div class="u-form-footer">
        <button type="button" class="u-button u-button--quiet" id="back" data-u-back disabled>Back</button>
        <div class="u-actions">
          <button type="button" class="u-button u-button--quiet" id="save">Save draft</button
          ><button type="submit" class="u-button" id="next" data-u-next data-u-final-label="Open dashboard">
            Continue
          </button>
        </div>
      </div>
      <p id="form-status" class="u-hint" role="status"></p>
    </form>
    <noscript
      ><p>
        The fields above are available to explore. Enable JavaScript to navigate the example, or
        <a href="dashboard.html">view the dashboard</a>.
      </p></noscript
    >
  </section>
  <aside class="u-stack">
    <section class="u-panel">
      <h2 class="u-section-heading">Your route</h2>
      <ol class="u-step-list" data-u-step-list>
        <li aria-current="step">
          <span>Starting point<small>Your experience and next goal</small></span>
        </li>
        <li>
          <span>Personal check-in<small>A pace that works for you</small></span>
        </li>
        <li>
          <span>Review your plan<small>Everything in one place</small></span>
        </li>
      </ol>
    </section>
    <section class="u-panel">
      <h2 class="u-section-heading">One step at a time</h2>
      <p class="u-hint">
        A useful plan makes the next action clear, while keeping the bigger picture in view.
      </p>
      <p class="u-hint">Drafts stay in this browser session. Use only sample information.</p>
    </section>
  </aside>
</div>
```

## status-dashboard: Status dashboard

Update task counts and progress together; do not treat personal reminders as official deadlines.

Maturity: preview. States: in-progress, complete, documents-empty, deadlines-unknown.

- Update task counts and progress together; do not treat personal reminders as official deadlines.
- Replace fixture copy and persistence with application-owned data and policy.

Dependencies: design.css.

Customization: Content, Data bindings, Composition using documented components.

Limitations: Fixture controllers are examples; application backend, authorization and regulatory rules are not supplied.

```html
<div class="u-page-header">
  <div>
    <span class="u-tag">Preview · management</span>
    <h1 class="u-page-title">Your license, in focus<span class="u-dot" aria-hidden="true"></span></h1>
    <p class="u-lede">Your next steps, documents and milestones in one place.</p>
  </div>
  <a href="index.html" class="u-button u-button--quiet">Edit sample plan</a>
</div>
<div class="u-stack">
  <section class="u-stats" aria-label="At a glance">
    <div class="u-panel">
      <dl class="u-stat">
        <dt>Plan status</dt>
        <dd>In progress</dd>
      </dl>
    </div>
    <div class="u-panel">
      <dl class="u-stat">
        <dt>Sample tasks complete</dt>
        <dd id="task-count">1 of 3</dd>
      </dl>
    </div>
    <div class="u-panel">
      <dl class="u-stat">
        <dt>Personal check-in</dt>
        <dd id="checkin-display">Not set</dd>
      </dl>
    </div>
  </section>
  <div class="u-columns">
    <div class="u-stack">
      <section class="u-panel u-panel--accent">
        <span class="u-eyebrow">NEXT ACTION</span>
        <h2 class="u-section-heading">Bring your records together</h2>
        <p class="u-hint">
          Make a list of the documents you already have, and identify anything you still need to request.
        </p>
        <a class="u-button" href="#tasks">Review your checklist</a>
      </section>
      <section class="u-panel" id="tasks">
        <h2 class="u-section-heading">Your working checklist</h2>
        <p class="u-hint">Sample tasks for exploring the interface.</p>
        <progress class="u-meter" value="1" max="3" aria-label="Sample checklist progress"></progress>
        <ul class="u-task-list">
          <li>
            <label><input type="checkbox" data-task checked /> Set your starting point</label
            ><span class="u-tag">Planning</span>
          </li>
          <li>
            <label><input type="checkbox" data-task /> Gather education records</label
            ><span class="u-tag">Documents</span>
          </li>
          <li>
            <label><input type="checkbox" data-task /> Review questions with your firm</label
            ><span class="u-tag">Follow-up</span>
          </li>
        </ul>
        <p class="u-hint" id="task-status" role="status">Changes are for this preview only.</p>
      </section>
      <section class="u-panel">
        <h2 class="u-section-heading">Documents</h2>
        <p class="u-hint">No documents added yet. Your supporting records will appear here.</p>
        <p class="u-hint">Keep education certificates and application receipts together.</p>
        <a class="u-button u-button--quiet" href="workspace.html">Browse document examples</a>
      </section>
    </div>
    <aside class="u-stack">
      <section class="u-panel">
        <h2 class="u-section-heading">Plan details</h2>
        <dl class="u-facts u-facts--stacked">
          <dt>Starting point</dt>
          <dd id="stage-display">Exploring a first license</dd>
          <dt>Next goal</dt>
          <dd id="goal-display">Get organized</dd>
          <dt>Verification</dt>
          <dd>Sample information · not verified</dd>
        </dl>
      </section>
      <section class="u-panel">
        <p class="u-eyebrow">Property context</p>
        <h2 class="u-section-heading">Courtyard house</h2>
        <dl class="u-facts u-facts--stacked">
          <dt>Layout</dt>
          <dd>3 bedrooms · 2 bathrooms</dd>
          <dt>Workspace stage</dt>
          <dd>Document review</dd>
          <dt>Reference</dt>
          <dd>Fictional purchase workspace</dd>
        </dl>
      </section>
      <section class="u-panel">
        <h2 class="u-section-heading">Recent activity</h2>
        <ul class="u-activity">
          <li>
            <strong>Review started</strong>
            <p>Supporting records organized</p>
            <small>Sample event · Today</small>
          </li>
          <li>
            <strong>Contact added</strong>
            <p>Sample coordinator joined the workspace</p>
            <small>Sample event · Yesterday</small>
          </li>
          <li>
            <strong>Plan created</strong>
            <p>Starting point and next goal recorded</p>
            <small>Sample event · Earlier</small>
          </li>
        </ul>
      </section>
    </aside>
  </div>
</div>
```

## searchable-collection: Searchable collection

Combine search and status filters; announce result count; Clear restores all records and focuses search.

Maturity: preview. States: populated, filtered, filtered-empty.

- Combine search and status filters; announce result count; Clear restores all records and focuses search.
- Replace fixture copy and persistence with application-owned data and policy.
- Keep data-u-collection hooks and row headers for the optional controller. Remount after replacing the collection DOM.

Dependencies: design.css, interactions.js, UniformInteractions.mount(document).

Customization: Content, Data bindings, Composition using documented components.

Limitations: Fixture controllers are examples; application backend, authorization and regulatory rules are not supplied.

```html
<div class="u-page-header">
  <div>
    <span class="u-tag">Preview · workspace</span>
    <h1 class="u-page-title">Document collection<span class="u-dot" aria-hidden="true"></span></h1>
    <p class="u-lede">Find records, review their status and inspect supporting details.</p>
  </div>
</div>
<div class="u-stack">
  <section class="u-panel" data-u-collection>
    <h2 class="u-section-heading">Documents</h2>
    <p class="u-hint">Illustrative records; no files are attached or requests sent.</p>
    <div class="u-toolbar">
      <div class="u-field">
        <label for="document-search">Find a document</label
        ><input
          type="search"
          enterkeyhint="search"
          spellcheck="false"
          id="document-search"
          data-u-search
          placeholder="Search titles"
        />
      </div>
      <div class="u-field">
        <label for="document-status">Status</label
        ><span class="u-select"
          ><select id="document-status" data-u-filter>
            <option value="all">All statuses</option>
            <option value="ready">Ready</option>
            <option value="review">Needs review</option>
            <option value="requested">Requested</option>
          </select></span
        >
      </div>
      <button class="u-button u-button--quiet" id="clear-filters" data-u-clear type="button">
        Clear filters
      </button>
    </div>
    <p class="u-hint" id="document-count" data-u-count role="status">3 documents</p>
    <div class="u-table" data-u-results tabindex="0" role="region" aria-label="Sample documents">
      <table>
        <thead>
          <tr>
            <th scope="col" aria-sort="none">
              <button type="button" class="u-sort" data-u-sort>
                Document <span aria-hidden="true">↕</span>
              </button>
            </th>
            <th scope="col">Category</th>
            <th scope="col">Status</th>
            <th scope="col">Details</th>
          </tr>
        </thead>
        <tbody>
          <tr data-u-row data-state="ready">
            <th scope="row">Education certificate</th>
            <td>Education</td>
            <td><span class="u-tag u-tag--ok">Ready</span></td>
            <td>
              <details>
                <summary>File information<span class="u-sr">: Education certificate</span></summary>
                <dl class="u-facts u-facts--stacked">
                  <dt>Format</dt>
                  <dd>PDF</dd>
                  <dt>Version</dt>
                  <dd>1</dd>
                  <dt>Attachment</dt>
                  <dd>Not supplied</dd>
                </dl>
              </details>
            </td>
          </tr>
          <tr data-u-row data-state="review">
            <th scope="row">Application checklist</th>
            <td>Application</td>
            <td><span class="u-tag u-tag--warn">Needs review</span></td>
            <td>
              <details>
                <summary>Review items<span class="u-sr">: Application checklist</span></summary>
                <ul class="u-hint">
                  <li>Confirm the document category.</li>
                  <li>Check that every required item is complete.</li>
                </ul>
              </details>
            </td>
          </tr>
          <tr data-u-row data-state="requested">
            <th scope="row">Firm confirmation</th>
            <td>Sponsorship</td>
            <td><span class="u-tag">Requested</span></td>
            <td>
              <details>
                <summary>Request information<span class="u-sr">: Firm confirmation</span></summary>
                <dl class="u-facts u-facts--stacked">
                  <dt>Contact</dt>
                  <dd>Sample firm</dd>
                  <dt>Next update</dt>
                  <dd>Written confirmation</dd>
                </dl>
              </details>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div id="document-empty" data-u-empty class="u-empty" hidden>
      <h3 class="u-section-heading">No matching documents</h3>
      <p>Try a different title or clear the status filter.</p>
    </div>
  </section>
  <div class="u-columns">
    <div class="u-stack">
      <section class="u-panel">
        <h2 class="u-section-heading">People &amp; firms</h2>
        <ul class="u-task-list">
          <li>
            <div class="u-identity">
              <span class="u-avatar" aria-hidden="true">A</span>
              <div>
                <strong>Example agent</strong>
                <p class="u-hint">Primary contact · Invitation accepted</p>
              </div>
            </div>
            <span class="u-tag">Member</span>
          </li>
          <li>
            <div class="u-identity">
              <span class="u-avatar" aria-hidden="true">F</span>
              <div>
                <strong>Sample firm</strong>
                <p class="u-hint">Organization · Relationship pending</p>
              </div>
            </div>
            <span class="u-tag">Pending</span>
          </li>
        </ul>
      </section>
      <section class="u-panel">
        <span class="u-eyebrow">PROPERTY SUMMARY</span>
        <h2 class="u-section-heading">Example property</h2>
        <p class="u-hint">Address not supplied</p>
        <dl class="u-property-facts">
          <div>
            <dt>Property type</dt>
            <dd>Residential</dd>
          </div>
          <div>
            <dt>Bedrooms</dt>
            <dd>3</dd>
          </div>
          <div>
            <dt>Bathrooms</dt>
            <dd>2</dd>
          </div>
          <div>
            <dt>Area</dt>
            <dd>Not provided</dd>
          </div>
        </dl>
        <p class="u-hint">Illustrative property details · Not a listing</p>
      </section>
    </div>
    <div class="u-stack">
      <section class="u-panel">
        <h2 class="u-section-heading">Recent activity</h2>
        <ol class="u-activity">
          <li>
            <strong>Document added</strong>
            <p>Education certificate</p>
            <small>Sample event · Today</small>
          </li>
          <li>
            <strong>Review started</strong>
            <p>Application checklist</p>
            <small>Sample event · Yesterday</small>
          </li>
          <li>
            <strong>Workspace created</strong>
            <p>Example workspace</p>
            <small>Sample event · Earlier</small>
          </li>
        </ol>
      </section>
      <section class="u-panel">
        <h2 class="u-section-heading">Cost summary</h2>
        <p class="u-hint">Illustrative amounts, not actual fees.</p>
        <dl class="u-facts">
          <dt>Sample service</dt>
          <dd>$120.00</dd>
          <dt>Sample processing</dt>
          <dd>$30.00</dd>
          <dt>Estimated total</dt>
          <dd><strong>$150.00</strong></dd>
        </dl>
      </section>
    </div>
  </div>
</div>
```

## component-states: Component state fixtures

State examples are fixtures; only labeled interactions perform local actions.

Maturity: preview. States: invalid, disabled, readonly, busy, empty, error, confirmation.

- State examples are fixtures; only labeled interactions perform local actions.
- Replace fixture copy and persistence with application-owned data and policy.

Dependencies: design.css.

Customization: Content, Data bindings, Composition using documented components.

Limitations: Fixture controllers are examples; application backend, authorization and regulatory rules are not supplied.

```html
<div class="u-page-header">
  <div>
    <span class="u-tag">Preview · state fixtures</span>
    <h1 class="u-page-title">Small details, complete states<span class="u-dot" aria-hidden="true"></span></h1>
    <p class="u-lede">Reference implementations for forms, feedback, collections and review.</p>
  </div>
</div>
<div class="u-stack">
  <section class="u-panel">
    <h2 class="u-section-heading">Actions</h2>
    <div class="u-actions">
      <button type="button" class="u-button">Primary action</button
      ><button type="button" class="u-button u-button--quiet">Secondary action</button
      ><button type="button" class="u-button u-button--danger" data-u-dialog-open="confirm-example" hidden>
        Remove sample</button
      ><button type="button" class="u-button" disabled>Unavailable</button
      ><button type="button" class="u-button" disabled aria-busy="true">Saving…</button>
    </div>
    <p class="u-hint">
      Disabled controls need a nearby explanation. “Saving” is a static busy-state example.
    </p>
  </section>
  <section class="u-panel">
    <h2 class="u-section-heading">Fields &amp; selection</h2>
    <div class="u-form-grid">
      <div class="u-field">
        <label for="state-name">Record title</label
        ><input id="state-name" placeholder="Enter a title" aria-describedby="state-help" /><span
          id="state-help"
          class="u-hint"
          >Use a short, descriptive title.</span
        >
      </div>
      <div class="u-field">
        <label for="state-invalid">Required category</label
        ><input id="state-invalid" required aria-invalid="true" aria-describedby="state-error" /><span
          class="u-field-error"
          id="state-error"
          >Choose a category before continuing.</span
        >
      </div>
      <div class="u-field">
        <label for="state-readonly">Reference (read only)</label
        ><input id="state-readonly" value="Sample reference" readonly />
      </div>
      <div class="u-field">
        <label for="state-disabled">Assignment (unavailable)</label
        ><input
          id="state-disabled"
          disabled
          value="Not available in this example"
          aria-describedby="state-disabled-help"
        /><span id="state-disabled-help" class="u-hint">Choose a firm before assigning this record.</span>
      </div>
      <div class="u-field">
        <label for="state-select">Record status</label
        ><span class="u-select"
          ><select id="state-select">
            <option>Draft</option>
            <option>In review</option>
            <option>Complete</option>
          </select></span
        >
      </div>
      <div class="u-field">
        <label for="state-date">Personal check-in</label
        ><input id="state-date" type="date" aria-describedby="date-help" /><span id="date-help" class="u-hint"
          >A personal reminder, not an official deadline.</span
        >
      </div>
    </div>
    <fieldset class="u-choice-group">
      <legend>Preferred view</legend>
      <label><input type="radio" name="view" checked /> Comfortable</label
      ><label><input type="radio" name="view" /> Compact</label>
    </fieldset>
    <label class="u-choice"><input type="checkbox" /> Include archived records</label>
  </section>
  <section class="u-panel">
    <h2 class="u-section-heading">Local document selection</h2>
    <div class="u-field">
      <label for="sample-file">Choose a sample PDF</label
      ><input
        id="sample-file"
        type="file"
        accept="application/pdf,.pdf"
        data-u-file
        aria-describedby="file-help file-status"
      /><span class="u-hint" id="file-help"
        >PDF only, up to 5 MiB. This example inspects metadata locally; it never uploads the file.</span
      ><span id="file-status" class="u-hint" role="status">No file selected.</span>
    </div>
  </section>
  <div class="u-columns">
    <section class="u-panel">
      <h2 class="u-section-heading">Collection states</h2>
      <div class="u-empty">
        <h3 class="u-section-heading">Nothing here yet</h3>
        <p>Add the first record when you are ready.</p>
      </div>
      <p class="u-hint" role="status" aria-busy="true">Loading records…</p>
      <div class="u-callout u-callout--danger">
        <strong>Records could not be loaded</strong>
        <p>Your existing records have not changed. Retry when your connection returns.</p>
      </div>
    </section>
    <section class="u-panel">
      <h2 class="u-section-heading">Status &amp; provenance</h2>
      <div class="u-actions">
        <span class="u-tag">Draft</span><span class="u-tag u-tag--warn">Needs review</span
        ><span class="u-tag u-tag--ok">Complete</span>
      </div>
      <dl class="u-facts u-facts--stacked">
        <dt>Source</dt>
        <dd>User-provided sample</dd>
        <dt>Verification</dt>
        <dd>Not independently verified</dd>
        <dt>Last checked</dt>
        <dd>Not checked</dd>
      </dl>
      <p class="u-hint">Use text labels as well as color. Unknown values are not zero.</p>
    </section>
  </div>
  <section class="u-panel">
    <h2 class="u-section-heading">Review summary</h2>
    <dl class="u-facts">
      <dt>Record</dt>
      <dd>Sample document</dd>
      <dt>Requested change</dt>
      <dd>Confirm its category</dd>
      <dt>Outcome</dt>
      <dd>Pending review</dd>
    </dl>
    <p class="u-hint" id="dialog-result" role="status">No action taken.</p>
  </section>
</div>
<dialog
  class="u-dialog"
  id="confirm-example"
  aria-labelledby="dialog-heading"
  aria-describedby="dialog-description"
>
  <h2 class="u-section-heading" id="dialog-heading">Remove this sample?</h2>
  <p id="dialog-description">This is a local confirmation example. No record will be deleted.</p>
  <div class="u-actions">
    <button class="u-button u-button--quiet" type="button" data-u-dialog-close autofocus>Keep sample</button
    ><button class="u-button u-button--danger" type="button" data-u-dialog-close="confirmed">
      Confirm example
    </button>
  </div>
</dialog>
```

## map-list: Map and list

Keep property selection and filtering consistent between an accessible list and a map.

Maturity: preview. States: populated, selected, filtered, empty, location-unavailable, map-loading, map-unavailable, retry, clustered, cluster-members, shortlisted, both, list-only, map-only, gallery, compact-gallery.

- Keep records without coordinates in the list.
- The optional sample shortlist is held only for the mounted page lifetime. Expose its toggle with aria-pressed and announce changes; never imply saved server data.
- Clear selection when a filter removes the selected result.
- Provide keyboard access and a list alternative to map markers.
- Label fictional data and preserve provider attribution in any live integration.
- Hover and focus preview the counterpart without changing selection.
- Keep structured selection details available in both mobile views. Escape and Clear selection dismiss and restore focus to the visible initiating control.
- Loading and renderer failure must preserve the list, filters and selected record. Announce renderer status separately from result counts.
- Retry changes renderer state only; restore focus when the retry control is removed.
- Call UniformMapList.connect(root, options) once per root; destroy the returned connection before removing its DOM.
- Provide unique record ids matching data-property attributes; nullable [latitude, longitude] locations; text-only title and label.
- Omit provider to use OpenFreeMap. Override provider.style or provider.lightStyle/darkStyle and optionally provider.transformRequest for another service.
- Keep source attribution visible. Allow the chosen provider origins in CSP; never put secret server credentials in frontend configuration.
- Group overlapping markers by default; counts include only visible located records. Activation zooms into a group; identical coordinates or maximum zoom open keyboard-accessible member choices.
- Cluster selection indicators include a selected member; filtering recomputes groups and dismisses stale member choices.

Dependencies: design.css, vendor/maplibre/maplibre-gl.css, map.css, maplibre.js, map-list.js, vendor/maplibre/maplibre-gl.mjs, vendor/maplibre/maplibre-gl-worker.mjs, context-menu.css, context-menu.js.

Customization: Application-owned records, Renderer and tile service.

Limitations: Default OpenFreeMap basemap requests go to tiles.openfreemap.org; network access and WebGL are required. No backend, geocoder or live listings service is included. Only MapLibre-compatible styles work with the default adapter. Other renderer SDKs need an adapter; an explicit Leaflet option remains available. Screen-space clustering is intended for modest frontend collections; server-scale indexing and viewport queries are outside scope. Browser/CSP and actual provider rendering verification remain pending.

Integration:

```json
{
  "styles": [
    "design.css",
    "vendor/maplibre/maplibre-gl.css",
    "map.css",
    "context-menu.css"
  ],
  "scripts": [
    "maplibre.js",
    "map-list.js",
    "context-menu.js"
  ],
  "modules": [
    "vendor/maplibre/maplibre-gl.mjs"
  ],
  "workers": [
    "vendor/maplibre/maplibre-gl-worker.mjs"
  ],
  "global": "UniformMapList.connect",
  "options": {
    "maplibre": "import * as maplibre from the packaged vendor/maplibre/maplibre-gl.mjs module",
    "records": "Array<{id:string,title:string,label:string,location:[latitude,longitude]|null}>",
    "provider": "Optional {style: URL|StyleSpecification} or {lightStyle,darkStyle}; optional transformRequest for browser-safe request configuration. Default: OpenFreeMap.",
    "renderer": "Optional adapter implementing mount(root, options); default UniformMapLibre. Use UniformMap explicitly for the separately loaded Leaflet adapter.",
    "clustering": "Optional boolean, defaults to true. Screen-space overlap grouping; false shows individual markers."
  },
  "initialization": "maplibre.setWorkerUrl(new URL(\"./vendor/maplibre/maplibre-gl-worker.mjs\", import.meta.url).href); const connection = UniformMapList.connect(root, {maplibre, records});",
  "lifecycle": "connection.reload(); connection.destroy();",
  "csp": "script-src 'self'; style-src 'self'; worker-src 'self'; connect-src 'self' https://tiles.openfreemap.org; img-src 'self' blob: https://tiles.openfreemap.org",
  "notes": [
    "Serve over HTTP(S). Network map requests are enabled by the default provider.",
    "Leaflet alternative: load vendor/leaflet.js, vendor/leaflet.css and map.js, then pass renderer: UniformMap, leaflet: L and an abortable GeoJSON source function.",
    "Use unique HTML ids when composing multiple roots.",
    "Provider styles are trusted application configuration. Custom providers may require public API keys, attribution and additional CSP origins.",
    "Map libraries remain optional assets, separate from core design.css.",
    "Call UniformContextMenu.mount(root) for optional card actions. Gallery controls preserve selection and filters; settings change columns and card density."
  ]
}
```

```html
<div class="u-page-header">
  <div>
    <span class="u-tag">Pattern · property explorer</span>
    <h1 class="u-page-title">Map and list<span class="u-dot" aria-hidden="true"></span></h1>
    <p class="u-lede">Explore properties with linked map, results and details.</p>
  </div>
</div>
<section data-map-preview aria-label="Sample property explorer">
  <svg class="u-sr" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="property-photo-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--u-link)" stop-opacity="0.28" />
        <stop offset="1" stop-color="var(--u-link)" stop-opacity="0.04" />
      </linearGradient>
      <symbol id="property-photo-exterior" viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice">
        <rect width="480" height="300" fill="var(--u-surface)" />
        <rect width="480" height="300" fill="url(#property-photo-sky)" />
        <path d="M0 200Q120 150 240 185T480 170V300H0Z" fill="var(--u-line)" opacity="0.5" />
        <path d="M0 232H480V300H0Z" fill="var(--u-hover)" />
        <ellipse cx="240" cy="250" rx="170" ry="9" fill="var(--u-bg)" opacity="0.5" />
        <path d="M130 150H350V248H130Z" fill="var(--u-bg)" />
        <path d="M290 150H350V248H290Z" fill="var(--u-fg)" opacity="0.06" />
        <path d="M110 154L240 74L370 154Z" fill="var(--u-muted)" opacity="0.7" />
        <path d="M240 74L370 154H330L240 98Z" fill="var(--u-fg)" opacity="0.12" />
        <path d="M300 92H322V122L300 108Z" fill="var(--u-muted)" opacity="0.7" />
        <path d="M156 176H196V208H156Z M284 176H324V208H284Z" fill="var(--u-accent)" opacity="0.55" />
        <path d="M218 188H262V248H218Z" fill="var(--u-hover)" />
        <path d="M384 250V196" stroke="var(--u-muted)" stroke-width="6" stroke-linecap="round" />
        <circle cx="384" cy="176" r="30" fill="var(--u-ok)" opacity="0.45" />
        <circle cx="398" cy="190" r="20" fill="var(--u-ok)" opacity="0.3" />
        <circle cx="86" cy="206" r="24" fill="var(--u-ok)" opacity="0.35" />
      </symbol>
      <symbol id="property-photo-apartment" viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice">
        <rect width="480" height="300" fill="var(--u-surface)" />
        <rect width="480" height="300" fill="url(#property-photo-sky)" />
        <path d="M30 120H120V260H30Z M360 90H450V260H360Z" fill="var(--u-line)" opacity="0.55" />
        <path d="M0 254H480V300H0Z" fill="var(--u-hover)" />
        <path d="M140 46H340V256H140Z" fill="var(--u-bg)" />
        <path d="M290 46H340V256H290Z" fill="var(--u-fg)" opacity="0.06" />
        <path d="M132 40H348V50H132Z" fill="var(--u-muted)" opacity="0.7" />
        <path
          d="M164 76H200V106H164Z M222 76H258V106H222Z M164 132H200V162H164Z M280 132H316V162H280Z M222 188H258V218H222Z"
          fill="var(--u-accent)"
          opacity="0.55"
        />
        <path
          d="M280 76H316V106H280Z M222 132H258V162H222Z M164 188H200V218H164Z M280 188H316V218H280Z"
          fill="var(--u-hover)"
        />
        <path d="M218 230H262V256H218Z" fill="var(--u-hover)" />
        <path d="M210 226H270V232H210Z" fill="var(--u-muted)" opacity="0.7" />
      </symbol>
      <symbol id="property-photo-interior" viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice">
        <rect width="480" height="300" fill="var(--u-surface)" />
        <path d="M0 220H480V300H0Z" fill="var(--u-hover)" />
        <path d="M0 220H480" stroke="var(--u-line)" stroke-width="4" />
        <path d="M80 50H220V170H80Z" fill="url(#property-photo-sky)" />
        <path
          d="M80 50H220V170H80Z M150 50V170 M80 110H220"
          fill="none"
          stroke="var(--u-line)"
          stroke-width="6"
        />
        <path d="M60 170H240V178H60Z" fill="var(--u-muted)" opacity="0.5" />
        <path d="M352 52V96" stroke="var(--u-muted)" stroke-width="3" />
        <path d="M330 96H374L364 120H340Z" fill="var(--u-accent)" opacity="0.6" />
        <ellipse cx="300" cy="258" rx="130" ry="8" fill="var(--u-bg)" opacity="0.5" />
        <path
          d="M200 176Q200 160 216 160H384Q400 160 400 176V214H200Z"
          fill="var(--u-muted)"
          opacity="0.55"
        />
        <path
          d="M184 206Q184 194 196 194H404Q416 194 416 206V246H184Z"
          fill="var(--u-muted)"
          opacity="0.75"
        />
        <path d="M200 246V258 M400 246V258" stroke="var(--u-muted)" stroke-width="6" />
        <rect x="222" y="172" width="44" height="30" rx="8" fill="var(--u-accent)" opacity="0.45" />
        <path d="M60 230H130V244H60Z" fill="var(--u-bg)" />
        <circle cx="95" cy="214" r="18" fill="var(--u-ok)" opacity="0.4" />
      </symbol>
      <symbol id="property-photo-outdoor" viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice">
        <rect width="480" height="300" fill="var(--u-surface)" />
        <rect width="480" height="300" fill="url(#property-photo-sky)" />
        <circle cx="390" cy="70" r="26" fill="var(--u-accent)" opacity="0.45" />
        <path d="M0 214H480V300H0Z" fill="var(--u-ok)" opacity="0.22" />
        <path d="M30 214V140H450V214Z" fill="var(--u-line)" opacity="0.35" />
        <path d="M30 140H450 M30 160H450" stroke="var(--u-muted)" stroke-width="4" opacity="0.6" />
        <path d="M150 232H330L362 280H118Z" fill="var(--u-hover)" />
        <path d="M188 196H292V224H188Z" fill="var(--u-muted)" opacity="0.7" />
        <path d="M200 224V256 M280 224V256" stroke="var(--u-muted)" stroke-width="6" />
        <path d="M240 120V196" stroke="var(--u-muted)" stroke-width="4" />
        <path d="M186 132Q240 96 294 132Z" fill="var(--u-accent)" opacity="0.5" />
        <path d="M86 218V140" stroke="var(--u-muted)" stroke-width="6" stroke-linecap="round" />
        <circle cx="86" cy="116" r="40" fill="var(--u-ok)" opacity="0.45" />
        <circle cx="62" cy="134" r="24" fill="var(--u-ok)" opacity="0.35" />
      </symbol>
    </defs>
  </svg>
  <div class="u-toolbar u-map-toolbar">
    <div class="u-field">
      <label for="property-kind">Property type</label
      ><span class="u-select"
        ><select id="property-kind" data-map-filter>
          <option value="all">All properties</option>
          <option>House</option>
          <option>Apartment</option>
          <option>Land</option>
        </select></span
      >
    </div>
    <button type="button" class="u-button u-button--quiet" data-map-clear>Clear filter</button>
    <div class="u-map-views" role="group" aria-label="View">
      <button type="button" class="u-button u-button--quiet" data-map-view="both" aria-pressed="true">
        Map and list
      </button>
      <button type="button" class="u-button u-button--quiet" data-map-view="list" aria-pressed="false">
        List only
      </button>
      <button type="button" class="u-button u-button--quiet" data-map-view="map" aria-pressed="false">
        Map only
      </button>
      <button type="button" class="u-button u-button--quiet" data-map-view="gallery" aria-pressed="false">
        Gallery
      </button>
    </div>
    <p class="u-hint" data-map-count role="status">5 properties · 4 on map</p>
  </div>
  <p class="u-sr" data-map-announcement role="status"></p>
  <details data-map-gallery-controls hidden>
    <summary>Gallery settings</summary>
    <div class="u-toolbar">
      <div class="u-field">
        <label for="gallery-columns">Columns</label
        ><span class="u-select"
          ><select id="gallery-columns" data-map-columns>
            <option value="auto">Automatic</option>
            <option value="2">Two</option>
            <option value="3">Three</option>
          </select></span
        >
      </div>
      <div class="u-field">
        <label for="gallery-density">Card style</label
        ><span class="u-select"
          ><select id="gallery-density" data-map-density>
            <option value="roomy">Photo cards</option>
            <option value="compact">Compact cards</option>
          </select></span
        >
      </div>
    </div>
  </details>
  <div class="u-map-layout" data-view="both">
    <div class="u-map-results" aria-label="Property results" data-columns="auto" data-density="roomy">
      <article
        class="u-map-card"
        data-property="courtyard"
        data-area="1,840 sq ft"
        data-description="Private courtyard, a flexible main-floor workspace and a detached two-car garage."
        data-review="Confirm roof age, garage condition and recent maintenance."
        data-lat="41.94"
        data-lng="-87.67"
        data-kind="House"
      >
        <figure class="u-property-thumbnail">
          <svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <use href="#property-photo-exterior" />
          </svg>
          <figcaption>Exterior · Placeholder</figcaption>
        </figure>
        <span class="u-eyebrow">House</span>
        <h2 class="u-section-heading">Courtyard house</h2>
        <p>3 beds · 2 baths</p>
        <strong>$425,000</strong>
        <p class="u-hint">Sample location</p>
        <button
          type="button"
          class="u-map-card-select"
          data-select="courtyard"
          data-u-context-menu="property-context"
          aria-pressed="false"
        >
          <span class="u-sr">Select Courtyard house</span>
        </button>
        <button
          type="button"
          class="u-context-trigger"
          data-u-context-menu="property-context"
          data-u-context-open
          aria-label="Actions for Courtyard house"
          hidden
        >
          <span aria-hidden="true">⋯</span>
        </button>
      </article>
      <article
        class="u-map-card"
        data-property="terrace"
        data-area="1,260 sq ft"
        data-description="A corner apartment with an open living area, a covered terrace and dedicated parking."
        data-review="Review association documents, monthly dues and rental restrictions."
        data-lat="41.9"
        data-lng="-87.64"
        data-kind="Apartment"
      >
        <figure class="u-property-thumbnail">
          <svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <use href="#property-photo-apartment" />
          </svg>
          <figcaption>Exterior · Placeholder</figcaption>
        </figure>
        <span class="u-eyebrow">Apartment</span>
        <h2 class="u-section-heading">Terrace apartment</h2>
        <p>2 beds · 2 baths</p>
        <strong>$310,000</strong>
        <p class="u-hint">Sample location</p>
        <button
          type="button"
          class="u-map-card-select"
          data-select="terrace"
          data-u-context-menu="property-context"
          aria-pressed="false"
        >
          <span class="u-sr">Select Terrace apartment</span>
        </button>
        <button
          type="button"
          class="u-context-trigger"
          data-u-context-menu="property-context"
          data-u-context-open
          aria-label="Actions for Terrace apartment"
          hidden
        >
          <span aria-hidden="true">⋯</span>
        </button>
      </article>
      <article
        class="u-map-card"
        data-property="garden"
        data-area="2,420 sq ft"
        data-description="Four bedrooms, a generous backyard and a separate lower-level living area."
        data-review="Confirm lower-level permits, drainage and mechanical service history."
        data-lat="41.86"
        data-lng="-87.68"
        data-kind="House"
      >
        <figure class="u-property-thumbnail">
          <svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <use href="#property-photo-exterior" />
          </svg>
          <figcaption>Exterior · Placeholder</figcaption>
        </figure>
        <span class="u-eyebrow">House</span>
        <h2 class="u-section-heading">Garden house</h2>
        <p>4 beds · 3 baths</p>
        <strong>$560,000</strong>
        <p class="u-hint">Sample location</p>
        <button
          type="button"
          class="u-map-card-select"
          data-select="garden"
          data-u-context-menu="property-context"
          aria-pressed="false"
        >
          <span class="u-sr">Select Garden house</span>
        </button>
        <button
          type="button"
          class="u-context-trigger"
          data-u-context-menu="property-context"
          data-u-context-open
          aria-label="Actions for Garden house"
          hidden
        >
          <span aria-hidden="true">⋯</span>
        </button>
      </article>
      <article
        class="u-map-card"
        data-property="courtyard-flat"
        data-area="980 sq ft"
        data-description="A compact two-bedroom layout near the courtyard house, with shared outdoor space."
        data-review="Review reserves, shared-space rules and recent building improvements."
        data-lat="41.9412"
        data-lng="-87.6685"
        data-kind="Apartment"
      >
        <figure class="u-property-thumbnail">
          <svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <use href="#property-photo-apartment" />
          </svg>
          <figcaption>Exterior · Placeholder</figcaption>
        </figure>
        <span class="u-eyebrow">Apartment</span>
        <h2 class="u-section-heading">Courtyard flat</h2>
        <p>2 beds · 1 bath</p>
        <strong>$285,000</strong>
        <p class="u-hint">Nearby sample location · About 180 m from Courtyard house</p>
        <button
          type="button"
          class="u-map-card-select"
          data-select="courtyard-flat"
          data-u-context-menu="property-context"
          aria-pressed="false"
        >
          <span class="u-sr">Select Courtyard flat</span>
        </button>
        <button
          type="button"
          class="u-context-trigger"
          data-u-context-menu="property-context"
          data-u-context-open
          aria-label="Actions for Courtyard flat"
          hidden
        >
          <span aria-hidden="true">⋯</span>
        </button>
      </article>
      <article
        class="u-map-card"
        data-property="studio"
        data-area="540 sq ft"
        data-description="An efficient studio with an independent kitchen and built-in storage."
        data-review="Request the location before planning a visit; review building documents."
        data-kind="Apartment"
      >
        <figure class="u-property-thumbnail">
          <svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <use href="#property-photo-apartment" />
          </svg>
          <figcaption>Exterior · Placeholder</figcaption>
        </figure>
        <span class="u-eyebrow">Apartment</span>
        <h2 class="u-section-heading">Corner studio</h2>
        <p>Studio · 1 bath</p>
        <strong>$195,000</strong>
        <p class="u-hint" id="studio-location"><span class="u-tag u-tag--warn">Location unknown</span></p>
        <button
          type="button"
          class="u-map-card-select"
          data-select="studio"
          aria-pressed="false"
          aria-describedby="studio-location"
        >
          <span class="u-sr">Select Corner studio</span>
        </button>
        <button
          type="button"
          class="u-context-trigger"
          data-u-context-menu="property-context"
          data-u-context-open
          aria-label="Actions for Corner studio"
          hidden
        >
          <span aria-hidden="true">⋯</span>
        </button>
      </article>
      <div class="u-empty" data-map-empty hidden>
        <h2 class="u-section-heading">No matching properties</h2>
        <p>Choose another property type or clear the filter.</p>
      </div>
    </div>
    <div class="u-map-surface" aria-busy="false">
      <div class="u-map-notice" data-map-notice hidden>
        <div class="u-map-state-art" aria-hidden="true">
          <svg viewBox="0 0 640 520" preserveAspectRatio="xMidYMid slice">
            <path
              class="u-map-state-block"
              d="M40 35h130v115H40zM200 35h150v115H200zM40 180h130v130H40zM200 180h150v130H200zM380 35h90v275h-90zM40 340h310v140H40z"
            />
            <path class="u-map-state-river" d="M570-20Q450 150 560 280T570 550" />
            <g class="u-map-state-markers">
              <rect x="120" y="120" width="90" height="34" rx="17" />
              <rect x="320" y="220" width="90" height="34" rx="17" />
              <rect x="200" y="360" width="90" height="34" rx="17" />
            </g>
          </svg>
        </div>
        <div class="u-map-state-card">
          <span class="u-map-state-icon" aria-hidden="true"
            ><svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z M9 3v15 M15 6v15" /></svg
          ></span>
          <div class="u-map-state-message">
            <span class="u-eyebrow" data-map-notice-label>MAP VIEW</span>
            <h3 class="u-section-heading" data-map-notice-title></h3>
            <p data-map-notice-copy></p>
          </div>
          <div class="u-map-state-actions">
            <button type="button" class="u-button" data-map-retry hidden>
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
              >
                <path d="M20 7v5h-5M20 12a8 8 0 1 0-2 5" /></svg
              >Retry map</button
            ><button type="button" class="u-button u-button--quiet" data-map-show-list>
              View results <span aria-hidden="true">→</span>
            </button>
          </div>
          <span class="u-map-loading-track" aria-hidden="true"></span>
        </div>
      </div>
      <p class="u-map-caption">OpenFreeMap · Sample properties</p>
      <div
        class="u-map-notice"
        data-map-location-status
        role="region"
        aria-labelledby="unknown-location-title"
        hidden
      >
        <div class="u-map-state-card">
          <span class="u-map-state-icon" aria-hidden="true"
            ><svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M9 3a7 7 0 0 1 10 6c0 5-7 12-7 12l-4-5M5 6a7 7 0 0 0 0 7 M3 3l18 18" /></svg
          ></span>
          <div class="u-map-state-message">
            <span class="u-eyebrow" data-map-location-name></span>
            <h3 class="u-section-heading" id="unknown-location-title">Location unknown</h3>
            <p>This property has no address or coordinates yet. There is no map pin to show.</p>
          </div>
          <div class="u-map-state-actions">
            <a class="u-button" href="#map-selection">View property details</a>
          </div>
        </div>
      </div>
      <div
        class="u-map-canvas u-geo-map"
        tabindex="0"
        role="region"
        aria-label="Property map. Use arrow keys to pan, plus and minus to zoom."
      ></div>
    </div>
  </div>
  <section class="u-map-selection" id="map-selection" tabindex="-1" aria-label="Selected property details">
    <p class="u-sr" data-map-selection role="status">Select a marker or result to inspect it.</p>
    <p class="u-hint" data-selection-empty>
      Select a property to explore its photos, features and review notes.
    </p>
    <div data-selection-facts hidden>
      <div class="u-property-gallery" aria-label="Sample property photo placeholders">
        <button
          type="button"
          class="u-button u-button--quiet u-shell-icon u-property-dismiss"
          data-map-dismiss
          aria-label="Clear selection"
          title="Clear selection"
          hidden
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            aria-hidden="true"
          >
            <path d="M6 6L18 18M18 6L6 18" />
          </svg>
        </button>
        <figure>
          <svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <use data-selection-photo href="#property-photo-exterior" />
          </svg>
          <figcaption>Exterior · Placeholder</figcaption>
        </figure>
        <figure>
          <svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <use href="#property-photo-interior" />
          </svg>
          <figcaption>Living space · Placeholder</figcaption>
        </figure>
        <figure>
          <svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <use href="#property-photo-outdoor" />
          </svg>
          <figcaption>Outdoor space · Placeholder</figcaption>
        </figure>
      </div>
      <div class="u-property-summary">
        <div>
          <h2 class="u-section-heading" data-selection-title>Property details</h2>
          <span class="u-tag" data-selection-kind></span>
          <p class="u-property-price" data-selection-price></p>
          <dl class="u-property-facts">
            <div>
              <dt>Layout</dt>
              <dd data-selection-layout></dd>
            </div>
            <div>
              <dt>Interior</dt>
              <dd data-selection-area></dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd data-selection-location></dd>
            </div>
          </dl>
        </div>
        <div class="u-property-overview">
          <h3 class="u-section-heading">Property snapshot</h3>
          <p data-selection-description></p>
          <div class="u-callout" data-selection-location-notice hidden>
            <strong>Address not provided</strong>
            <p class="u-hint">
              Request a confirmed location before planning a visit. Photos and property details are still
              available.
            </p>
          </div>
          <h3 class="u-section-heading">Before a tour</h3>
          <p class="u-hint" data-selection-review></p>
          <div class="u-actions">
            <button type="button" class="u-button" data-selection-save aria-pressed="false">
              Save property
            </button>
            <span class="u-hint">Sample shortlist · this page only.</span>
          </div>
        </div>
      </div>
    </div>
  </section>
  <div id="property-context" class="u-context-menu" popover="auto" role="menu" aria-label="Property actions">
    <button type="button" role="menuitem" tabindex="-1" data-u-context-action="view">View details</button>
    <button type="button" role="menuitem" tabindex="-1" data-u-context-action="save">Save property</button>
    <button type="button" role="menuitem" tabindex="-1" data-u-context-action="copy">Copy price</button>
  </div>
  <p class="u-hint">Fictional listings with illustrative image placeholders.</p>
  <details class="u-panel u-map-guide">
    <summary id="map-contract-title">Pattern reference</summary>
    <div class="u-columns">
      <section aria-labelledby="map-behavior-title">
        <h2 class="u-section-heading" id="map-behavior-title">Interaction behavior</h2>
        <dl class="u-facts">
          <dt>Preview</dt>
          <dd>Hover or focus to highlight the matching card or marker.</dd>
          <dt>Select</dt>
          <dd>Activate a card or marker to open its details. Selection carries between views.</dd>
          <dt>Dismiss</dt>
          <dd>Clear selection or press Escape to return focus to the initiating control.</dd>
          <dt>Filter</dt>
          <dd>Update the list and map together. Clear selection only if its result is excluded.</dd>
          <dt>Unknown location</dt>
          <dd>
            Keep the listing and its details available. Show an explicit location state instead of a map pin.
          </dd>
        </dl>
      </section>
      <section class="u-map-review-controls" aria-labelledby="map-review-title">
        <h2 class="u-section-heading" id="map-review-title">State previews</h2>
        <div class="u-field">
          <label for="map-state">Simulated renderer state</label>
          <span class="u-select"
            ><select id="map-state" data-map-state>
              <option value="ready">Ready</option>
              <option value="loading">Loading</option>
              <option value="error">Unavailable</option>
            </select></span
          >
        </div>
        <p class="u-hint">Inspect loading and failure states while keeping filters and selection.</p>
        <h3 class="u-section-heading">Integration notes</h3>
        <p class="u-hint">
          OpenFreeMap is the default provider. Keep its attribution visible when using a live map.
        </p>
        <ul class="u-hint">
          <li>Retry reconnects to the configured provider.</li>
          <li>Viewport searches require an explicit action.</li>
          <li>Clusters expose counts and keyboard access.</li>
        </ul>
      </section>
    </div>
  </details>
</section>
```

## application-shell: Application Shell

Standard layout framework for Uniform web applications, including responsive navigation and workspace areas.

Maturity: preview. States: initial.

- Always use u-app as the top-level container.
- Mobile navigation uses a <details> element for the collapsible menu.
- Include both light and dark theme brand marks.

Dependencies: design.css.

Customization: Content, Navigation links.

Limitations: Theme toggle requires client-side JavaScript (e.g. theme.js) for logic.

```html
<div class="u-app">
  <aside class="u-app-nav" aria-label="Workflows">
    <a class="u-app-brand" href="#" aria-label="Uniform Design">
      <img
        class="u-app-brand-dark"
        src="../dist/svg/uniform-wordmark-on-dark.svg"
        width="136"
        height="30"
        alt="Uniform"
      />
      <img
        class="u-app-brand-light"
        src="../dist/svg/uniform-wordmark-color.svg"
        width="136"
        height="30"
        alt="Uniform"
      />
    </a>
    <nav class="u-nav u-desktop-nav" aria-label="Application navigation">
      <a href="#" aria-current="page"><span>Dashboard</span></a>
      <a href="#"><span>Listings</span></a>
    </nav>
    <details class="u-mobile-nav">
      <summary aria-label="Menu">
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span class="u-sr">Menu</span>
      </summary>
      <nav class="u-nav" aria-label="Mobile navigation">
        <a href="#" aria-current="page"><span>Dashboard</span></a>
        <a href="#"><span>Listings</span></a>
      </nav>
    </details>
    <div class="u-app-utility">
      <span class="u-app-utility-label">Appearance</span>
      <button type="button" class="u-button u-button--quiet u-icon-button" aria-label="Switch theme">
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
        </svg>
      </button>
    </div>
  </aside>
  <main class="u-workspace">
    <header class="u-page-header">
      <div>
        <h1 class="u-page-title">Dashboard<span class="u-dot" aria-hidden="true"></span></h1>
      </div>
    </header>
    <div class="u-stack">
      <p>Workspace content goes here.</p>
    </div>
  </main>
</div>
```

## map-preview: Map Preview

A simple, read-only map embed for displaying a single property location.

Maturity: preview. States: ready, loading, error.

- Provide data-lat and data-lng attributes on the canvas.
- Initialize with UniformMapLibre or Leaflet adapter.

Dependencies: design.css, map.css.

Customization: Coordinates, Provider styles.

Limitations: Does not include clustering or linked list filtering.

```html
<div class="u-map-surface" aria-busy="false" data-state="ready">
  <div
    class="u-map-canvas u-geo-map"
    tabindex="0"
    role="region"
    aria-label="Property location map"
    data-lat="41.94"
    data-lng="-87.67"
  ></div>
</div>
```
