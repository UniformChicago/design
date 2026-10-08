// Example-only interaction controller; the component package remains CSS-only.
const key = "uniform-workflow-preview-v1";
let draft = {};
try {
  draft = JSON.parse(sessionStorage.getItem(key) || "{}");
  if (!draft || typeof draft !== "object") draft = {};
} catch {
  draft = {};
}
const theme = document.querySelector("[data-theme-toggle]");
if (theme) {
  const preference = matchMedia("(prefers-color-scheme: dark)");
  let manualTheme = false;
  try {
    manualTheme = ["dark", "light"].includes(localStorage.getItem("u-docs-theme"));
  } catch {}
  const syncTheme = () => {
    const label = `Switch to ${document.documentElement.dataset.theme === "dark" ? "light" : "dark"} theme`;
    theme.setAttribute("aria-label", label);
    theme.title = label;
  };
  syncTheme();
  theme.hidden = false;
  theme.addEventListener("click", () => {
    document.documentElement.dataset.theme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    manualTheme = true;
    try {
      localStorage.setItem("u-docs-theme", document.documentElement.dataset.theme);
    } catch {}
    syncTheme();
  });
  preference.addEventListener("change", (event) => {
    if (!manualTheme) {
      document.documentElement.dataset.theme = event.matches ? "dark" : "light";
      syncTheme();
    }
  });
}
const form = document.querySelector("#onboarding");
if (form) {
  const fields = ["stage", "goal", "checkin", "notes"];
  for (const name of fields) if (typeof draft[name] === "string") form.elements[name].value = draft[name];
  const status = document.querySelector("#form-status");
  const snapshot = () => Object.fromEntries(fields.map((name) => [name, form.elements[name].value]));
  const persist = () => {
    try {
      sessionStorage.setItem(key, JSON.stringify(snapshot()));
      return true;
    } catch {
      return false;
    }
  };
  document.querySelector("#save").addEventListener("click", () => {
    status.textContent = persist()
      ? "Draft saved for this browser session."
      : "Draft could not be saved. Keep this page open to continue.";
  });
  form.addEventListener("uniform:step-change", (event) => {
    status.textContent = "";
    if (event.detail.index !== event.detail.total - 1) return;
    const review = document.querySelector("#review");
    review.replaceChildren();
    for (const [label, value] of [
      ["Starting point", form.elements.stage.value],
      ["Next goal", form.elements.goal.value],
      ["Personal check-in", form.elements.checkin.value || "Not set"],
      ["Notes", form.elements.notes.value || "None added"],
    ]) {
      const dt = document.createElement("dt"),
        dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      review.append(dt, dd);
    }
  });
  form.addEventListener("uniform:complete", () => {
    if (!persist()) {
      status.textContent =
        "Your browser could not save the plan. Keep this page open or use navigation to view the default dashboard.";
      return;
    }
    location.href = "dashboard.html";
  });
}
for (const name of ["stage", "goal", "checkin"]) {
  const el = document.querySelector(`#${name}-display`);
  if (el && typeof draft[name] === "string" && draft[name]) el.textContent = draft[name];
}
const tasks = [...document.querySelectorAll("[data-task]")];
for (const task of tasks)
  task.addEventListener("change", () => {
    const count = tasks.filter((el) => el.checked).length;
    document.querySelector("#task-count").textContent = `${count} of ${tasks.length}`;
    const meter = document.querySelector("progress");
    if (globalThis.UniformInteractions) globalThis.UniformInteractions.setProgress(meter, count);
    else meter.value = count;
    document.querySelector("#task-status").textContent =
      count === tasks.length
        ? "All sample tasks complete."
        : `${count} of ${tasks.length} sample tasks complete.`;
  });

if (globalThis.UniformInteractions) globalThis.UniformInteractions.mount(document);
document.addEventListener("uniform:dialog-close", (event) => {
  const result = document.querySelector("#dialog-result");
  if (result)
    result.textContent =
      event.detail.value === "confirmed" ? "Example confirmed. No record was deleted." : "Sample kept.";
});

if (globalThis.UniformContextMenu) globalThis.UniformContextMenu.mount(document);
