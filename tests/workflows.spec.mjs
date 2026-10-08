import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const base = "http://127.0.0.1:4401/workflows/";
// Deterministic renderer tests do not depend on or consume the public tile service.
const testMapStyle = {
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#14212b" } }],
};
// The map renderer needs WebGL2. GPU-less CI browsers (Linux Firefox) may lack it; real browsers have it.
const requireWebGL2 = async (page) =>
  test.skip(
    !(await page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl2")))),
    "This browser build has no WebGL2, which the map renderer needs",
  );
test.beforeEach(async ({ page }) => {
  // TEMP diagnostics for Linux Firefox map failures.
  if (test.info().project.name === "firefox-patterns") {
    page.on("console", (m) => m.type() !== "log" && console.log(`[ff ${m.type()}]`, m.text().slice(0, 400)));
    page.on("pageerror", (e) => console.log("[ff pageerror]", e.message));
    page.on("load", () =>
      page
        .evaluate(() => {
          const c = document.createElement("canvas");
          return {
            webgl2: !!c.getContext("webgl2"),
            webgl: !!document.createElement("canvas").getContext("webgl"),
          };
        })
        .then((r) => console.log("[ff gl]", JSON.stringify(r)))
        .catch(() => {}),
    );
  }
  await page.route("https://tiles.openfreemap.org/styles/*", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(testMapStyle) }),
  );
});
test("onboarding validates, saves, resumes and opens a matching dashboard", async ({ page }) => {
  await page.goto(base);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Where are you in your journey?")).toBeFocused();
  await expect(page.locator("#stage-error")).toBeVisible();
  await page.getByLabel("Where are you in your journey?").selectOption("Preparing an application");
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.reload();
  await expect(page.getByLabel("Where are you in your journey?")).toHaveValue("Preparing an application");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("What would help").fill("<script>example</script>");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator("#review")).toContainText("<script>example</script>");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByLabel("What would help")).toHaveValue("<script>example</script>");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Open dashboard" }).click();
  await expect(page.locator("#stage-display")).toHaveText("Preparing an application");
  await page.getByLabel("Gather education records").check();
  await page.getByLabel("Review questions with your firm").check();
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "3");
  await expect(page.getByRole("status")).toHaveText("All sample tasks complete.");
});
for (const path of ["", "dashboard.html", "workspace.html", "states.html", "map.html"])
  test(`${path || "onboarding"}: themes, accessibility and responsive layout`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("u-docs-theme", "light"));
    await page.goto(base + path);
    for (const theme of ["light", "dark"]) {
      if (theme === "dark") await page.getByRole("button", { name: "Switch to dark theme" }).click();
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(result.violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({
        path: `test-results/workflow-${path ? path.replace(".html", "") : "onboarding"}-${theme}-${test.info().project.name}.png`,
        fullPage: true,
      });
    }
  });

test("workspace combines search and status filters and clears empty results", async ({ page }) => {
  await page.goto(base + "workspace.html");
  await page.getByLabel("Find a document").fill("certificate");
  await expect(page.locator("#document-count")).toHaveText("1 record");
  await page.getByLabel("Status", { exact: true }).selectOption("requested");
  await expect(page.getByRole("heading", { name: "No matching documents" })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator("#document-count")).toHaveText("3 records");
  await expect(page.getByLabel("Find a document")).toBeFocused();
});

test("mobile masthead stays compact and exposes navigation on demand", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  const bounds = await page.locator(".u-app-nav").boundingBox();
  expect(bounds.height).toBeLessThanOrEqual(80);
  await expect(page.getByRole("navigation", { name: "Mobile patterns" })).toBeHidden();
  await page.getByLabel("Workflow navigation").click();
  await page
    .getByRole("navigation", { name: "Mobile patterns" })
    .getByRole("link", { name: "Searchable collection", exact: true })
    .click();
  // The pattern library opens each starter in the Playground.
  await expect(page).toHaveURL(/playground\/#searchable-collection$/);
});

test("native dialog cancels with Escape, restores focus and confirms explicitly", async ({ page }) => {
  await page.goto(base + "states.html");
  const trigger = page.getByRole("button", { name: "Remove sample" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "Keep sample" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("button", { name: "Confirm example" }).click();
  await expect(page.locator("#dialog-result")).toHaveText("Example confirmed. No record was deleted.");
});

test("file selection announces metadata validation without uploading", async ({ page }) => {
  await page.goto(base + "states.html");
  await page
    .getByLabel("Choose a sample PDF")
    .setInputFiles({ name: "example.txt", mimeType: "text/plain", buffer: Buffer.from("example") });
  await expect(page.getByLabel("Choose a sample PDF")).toHaveAttribute("aria-invalid", "true");
  await page
    .getByLabel("Choose a sample PDF")
    .setInputFiles({ name: "example.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-example") });
  await expect(page.locator("#file-status")).toContainText("Selected locally, not uploaded");
  await expect(page.getByLabel("Choose a sample PDF")).toHaveAttribute("aria-invalid", "false");
});

test("collection sorting preserves filtering and announces direction", async ({ page }) => {
  await page.goto(base + "workspace.html");
  const sort = page.getByRole("button", { name: "Document" });
  await sort.click();
  await expect(sort.locator("..")).toHaveAttribute("aria-sort", "ascending");
  await expect(page.locator("[data-u-row] th").first()).toHaveText("Application checklist");
  await sort.click();
  await expect(sort.locator("..")).toHaveAttribute("aria-sort", "descending");
  await expect(page.locator("[data-u-row] th").first()).toHaveText("Firm confirmation");
});

test("theme follows system until explicitly selected and persists", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(base);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("map filtering retains unlocated records and clears hidden selection", async ({ page }) => {
  await requireWebGL2(page);
  await page.goto(base + "map.html");
  await page.getByRole("button", { name: "Select Courtyard house" }).click();
  await expect(page.locator('[data-select="courtyard"]')).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Property type").selectOption("Apartment");
  await expect(page.locator("[data-map-count]")).toHaveText("3 properties · 2 on map");
  await expect(page.locator('[data-property="studio"]')).toBeVisible();
  await expect(page.locator('[data-select="courtyard"]')).toHaveAttribute("aria-pressed", "false");
  await page.getByLabel("Property type").selectOption("Land");
  await expect(page.locator("[data-map-empty]")).toBeVisible();
  await page.getByRole("button", { name: "Clear filter", exact: true }).click();
  await expect(page.locator("[data-map-count]")).toHaveText("5 properties · 4 on map");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Map only", exact: true }).click();
  await expect(page.locator(".u-map-results")).toBeHidden();
  // Selecting Courtyard house zoomed in to it; bring every result back into view first.
  await page.getByRole("button", { name: "Fit all results" }).click();
  await page.getByRole("button", { name: "Select Terrace apartment, $310,000" }).click();
  await expect(page.locator("#map-selection")).not.toBeFocused();
  await page.getByRole("button", { name: "Clear selection" }).click();
  await expect(page.locator("[data-selection-empty]")).toBeVisible();
  await page.getByRole("button", { name: "Select Terrace apartment, $310,000" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#map-selection")).toBeFocused();
  await expect(page.locator("[data-map-selection]")).toContainText("Terrace apartment");
});

test("marker selection reveals its card without scrolling the page", async ({ page }) => {
  await requireWebGL2(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base + "map.html");
  const marker = page.getByRole("button", { name: "Select Garden house, $560,000" });
  await marker.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  await marker.click();
  const geometry = await page.locator(".u-map-results").evaluate((pane) => {
    const card = pane.querySelector('[data-property="garden"]').getBoundingClientRect();
    const bounds = pane.getBoundingClientRect();
    return {
      top: card.top,
      bottom: card.bottom,
      paneTop: bounds.top + pane.clientTop,
      paneBottom: bounds.top + pane.clientTop + pane.clientHeight,
      scroll: pane.scrollTop,
    };
  });
  expect(geometry.scroll).toBeGreaterThan(0);
  expect(geometry.top).toBeGreaterThanOrEqual(geometry.paneTop - 1);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.paneBottom + 1);
  expect(await page.evaluate(() => ({ x: scrollX, y: scrollY }))).toEqual(before);
});

test("map failure and retry preserve filters and selection", async ({ page }) => {
  await requireWebGL2(page);
  await page.goto(base + "map.html");
  await page.getByLabel("Property type").selectOption("House");
  await page.getByRole("button", { name: "Select Courtyard house", exact: true }).click();
  await page.getByText("Pattern reference", { exact: true }).click();
  await page.getByLabel("Simulated renderer state").selectOption("loading");
  await expect(page.locator(".u-map-surface")).toHaveAttribute("aria-busy", "true");
  await page.getByLabel("Simulated renderer state").selectOption("error");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Map only", exact: true }).click();
  await expect(page.locator(".u-map-canvas")).toBeHidden();
  await page.getByRole("button", { name: "Retry map" }).click();
  await expect(page.locator(".u-map-canvas")).toBeVisible();
  await expect(page.getByLabel("Property type")).toHaveValue("House");
  await expect(page.locator('[data-select="courtyard"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Simulated renderer state")).toBeFocused();
});

test("provider style failure retries the request and preserves selection", async ({ page }) => {
  await requireWebGL2(page);
  let failed = true;
  let requests = 0;
  await page.route("https://tiles.openfreemap.org/styles/*", async (route) => {
    requests++;
    if (failed) await route.fulfill({ status: 503, body: "Unavailable" });
    else await route.fulfill({ contentType: "application/json", body: JSON.stringify(testMapStyle) });
  });
  await page.goto(base + "map.html");
  await page.getByRole("button", { name: "Select Courtyard house", exact: true }).click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByRole("heading", { name: "The map couldn’t load" })).toBeVisible();
  failed = false;
  await page.getByRole("button", { name: "Retry map" }).click();
  await expect(page.locator(".u-map-surface")).toHaveAttribute("data-state", "ready");
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  await expect(page.locator(".u-map-cluster").first()).toHaveAttribute("aria-pressed", "true");
  expect(requests).toBe(2);
});

test("nearby properties expand into individual markers and regroup when zoomed out", async ({ page }) => {
  await requireWebGL2(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base + "map.html");
  const cluster = page.getByRole("button", { name: "2 properties. Expand group", exact: true });
  await cluster.focus();
  await page.keyboard.press("Enter");
  const flat = page.getByRole("button", { name: "Select Courtyard flat, $285,000", exact: true });
  await expect(flat).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await flat.click();
  await expect(page.locator("[data-selection-title]")).toHaveText("Courtyard flat");
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  await expect(cluster).toBeVisible();
  await expect(cluster).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Property type").selectOption("House");
  await expect(page.getByRole("button", { name: "Select Courtyard house, $425,000" })).toBeVisible();
  await expect(page.locator("[data-map-count]")).toHaveText("2 properties · 2 on map");
});

for (const width of [390, 1280]) {
  test(`controls share heights and toolbar alignment at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["map.html", "workspace.html"]) {
      await page.goto(base + path);
      const boxes = await page
        .locator(".u-toolbar")
        .first()
        .evaluate((toolbar) =>
          [...toolbar.querySelectorAll("input, select, button")].map((control) => {
            const { top, bottom, height } = control.getBoundingClientRect();
            return { top, bottom, height };
          }),
        );
      for (const box of boxes) expect(box.height).toBeCloseTo(48, 0);
      if (width === 1280) {
        for (const box of boxes) {
          expect(box.top).toBeCloseTo(boxes[0].top, 0);
          expect(box.bottom).toBeCloseTo(boxes[0].bottom, 0);
        }
      }
    }
  });
}
test("table bottom border is consistent after filtering and sorting", async ({ page }) => {
  await page.goto(base + "workspace.html");
  async function checkLastRow() {
    const borders = await page
      .locator("[data-u-row]:visible")
      .last()
      .evaluate((row) => [...row.children].map((cell) => getComputedStyle(cell).borderBottomWidth));
    expect(borders).toEqual(["0px", "0px", "0px", "0px"]);
  }
  await checkLastRow();
  await page.getByRole("button", { name: "Document" }).click();
  await checkLastRow();
  await page.getByLabel("Status", { exact: true }).selectOption("ready");
  await checkLastRow();
});
test("property summary shows matching details and remembers shortlist choices across selections", async ({
  page,
}) => {
  await page.goto(base + "map.html");
  await page.locator('[data-select="courtyard"]').click();
  await expect(page.locator("[data-selection-area]")).toHaveText("1,840 sq ft");
  await expect(page.locator("[data-selection-description]")).toContainText("Private courtyard");
  await page.getByRole("button", { name: "Save property", exact: true }).click();
  await expect(page.getByRole("button", { name: "Saved to shortlist" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator('[data-select="terrace"]').click();
  await expect(page.locator("[data-selection-area]")).toHaveText("1,260 sq ft");
  await expect(page.getByRole("button", { name: "Save property", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.locator('[data-select="courtyard"]').click();
  await page.getByRole("button", { name: "Saved to shortlist" }).click();
  await expect(page.locator("[data-map-selection]")).toContainText(
    "Removed Courtyard house from shortlist. 0 saved.",
  );
});

test("sortable headings match the typography of other column headings", async ({ page }) => {
  await page.goto(base + "workspace.html");
  const styles = await page.locator(".u-table thead").evaluate((head) =>
    [...head.querySelectorAll("th")].map((cell) => {
      const style = getComputedStyle(cell.querySelector("button") || cell);
      return Object.fromEntries(
        ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textTransform", "color"].map(
          (property) => [property, style[property]],
        ),
      );
    }),
  );
  for (const style of styles) expect(style).toEqual(styles[0]);
  expect(styles[0].textTransform).toBe("uppercase");
});

test("workspace cards stack independently without gaps from the neighboring column", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(base + "workspace.html");
  const columns = await page.locator(".u-columns > .u-stack").evaluateAll((stacks) =>
    stacks.map((stack) => {
      const cards = [...stack.children].map((card) => card.getBoundingClientRect());
      return {
        actualGap: cards[1].top - cards[0].bottom,
        expectedGap: parseFloat(getComputedStyle(stack).rowGap),
      };
    }),
  );
  expect(columns).toHaveLength(2);
  for (const column of columns) expect(column.actualGap).toBeCloseTo(column.expectedGap, 0);
});

for (const width of [390, 1280]) {
  test(`listing photos and complete details remain visible without internal scrolling at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + "map.html");
    for (const id of ["courtyard", "courtyard-flat", "studio"]) {
      await page.locator(`[data-select="${id}"]`).click();
      await expect(page.locator(".u-property-gallery figure")).toHaveCount(3);
      expect(await page.locator("#map-selection").evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(
        true,
      );
      await expect(page.locator("[data-selection-review]")).toBeVisible();
      expect(await page.locator("#map-selection").evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(
        true,
      );
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("desktop listing gallery aligns its edges and keeps a compact height", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base + "map.html");
  await page.locator('[data-select="garden"]').click();
  const photos = await page.locator(".u-property-gallery figure").evaluateAll((figures) =>
    figures.map((figure) => {
      const { top, bottom, height } = figure.getBoundingClientRect();
      return { top, bottom, height };
    }),
  );
  expect(photos[0].top).toBeCloseTo(photos[1].top, 0);
  expect(photos[0].bottom).toBeCloseTo(photos[2].bottom, 0);
  expect(photos[1].height).toBeCloseTo(photos[2].height, 0);
  expect(photos[0].height).toBeLessThanOrEqual(320);
});

test("property cards select from their photo or text and support keyboard activation", async ({ page }) => {
  await page.goto(base + "map.html");
  const card = page.locator('[data-property="courtyard"]');
  const box = await card.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + 30);
  await expect(page.locator("[data-selection-title]")).toHaveText("Courtyard house");
  const button = card.locator("[data-select]");
  const buttonBox = await button.boundingBox();
  expect(buttonBox.width).toBeGreaterThan(box.width - 3);
  expect(buttonBox.height).toBeGreaterThan(box.height - 3);
  await page.getByRole("button", { name: "Clear selection" }).click();
  await button.focus();
  await page.keyboard.press("Space");
  await expect(button).toHaveAttribute("aria-pressed", "true");
});

test("property results scroll with hidden scrollbar chrome", async ({ page }) => {
  await page.goto(base + "map.html");
  const state = await page.locator(".u-map-results").evaluate((list) => {
    const cards = list.querySelectorAll("[data-property]");
    list.scrollTo({ top: cards[1].offsetTop - cards[0].offsetTop, behavior: "instant" });
    return { scrollbar: getComputedStyle(list).scrollbarWidth, scrolled: list.scrollTop };
  });
  expect(state.scrollbar).toBe("none");
  expect(state.scrolled).toBeGreaterThan(0);
});

test("native scrolling snaps gently, contains result scrolling and honors reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(base + "map.html");
  const scrolling = () =>
    page.locator(".u-map-results").evaluate((list) => {
      const style = getComputedStyle(list);
      return {
        snap: style.scrollSnapType,
        chaining: style.overscrollBehaviorY,
        behavior: style.scrollBehavior,
      };
    });
  // Browsers serialize the default proximity strictness as just the axis.
  expect(await scrolling()).toEqual({ snap: "y", chaining: "contain", behavior: "smooth" });
  await expect(page.locator(".u-map-card").first()).toHaveCSS("scroll-snap-align", "start");
  await expect(page.locator(".s-pages")).toHaveCSS("scroll-snap-type", "x");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await scrolling()).toEqual({ snap: "none", chaining: "contain", behavior: "auto" });
  await expect(page.locator(".s-pages")).toHaveCSS("scroll-snap-type", "none");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel("Property type")).toHaveCSS("font-size", "16px");
  await expect(page.getByLabel("Property type")).toHaveCSS("touch-action", "manipulation");
});

test("selection without coordinates explains the unchanged map and still opens details", async ({ page }) => {
  await requireWebGL2(page);
  await page.goto(base + "map.html");
  await page.locator('[data-select="studio"]').click();
  await expect(page.locator("[data-selection-title]")).toHaveText("Corner studio");
  await expect(page.locator("[data-map-location-status]")).toBeVisible();
  await expect(page.locator("[data-map-location-status]")).toContainText("Location unknown");
  await expect(page.locator("[data-selection-price]")).toHaveText("$195,000");
  await expect(page.locator(".u-map-canvas")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("[data-selection-location-notice]")).toBeVisible();
  await expect(page.locator('[data-property="studio"] .u-tag')).toHaveText("Location unknown");
  await page.locator('[data-select="courtyard"]').click();
  await expect(page.locator("[data-map-location-status]")).toBeHidden();
  await expect(page.locator("[data-selection-location-notice]")).toBeHidden();
  await expect(page.locator(".u-map-canvas")).toHaveAttribute("aria-hidden", "false");
});

test("the first result card and map align at the top of the explorer", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(base + "map.html");
  const card = await page.locator(".u-map-card").first().boundingBox();
  const map = await page.locator(".u-map-surface").boundingBox();
  expect(card.y).toBeCloseTo(map.y, 0);
});

test("map reference groups behavior, state controls and integration in one disclosure", async ({ page }) => {
  await page.goto(base + "map.html");
  await expect(page.getByLabel("Simulated renderer state")).toBeHidden();
  await page.getByText("Pattern reference", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Interaction behavior" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "State previews" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Integration notes" })).toBeVisible();
  await page.getByLabel("Simulated renderer state").selectOption("error");
  await expect(page.getByRole("heading", { name: "The map couldn’t load" })).toBeVisible();
});

test("property context actions support right-click, keyboard navigation and touch openers", async ({
  page,
}) => {
  await page.goto(base + "map.html");
  const trigger = page.locator('[data-select="courtyard"]');
  await trigger.click({ button: "right" });
  const menu = page.getByRole("menu", { name: "Property actions" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "View details" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Saved to shortlist" })).toBeVisible();
  await trigger.focus();
  await page.keyboard.press("Shift+F10");
  await expect(menu.getByRole("menuitem", { name: "Remove from shortlist" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-pressed", "true");
  await page.locator('[data-property="courtyard"] .u-context-trigger').click();
  await menu.getByRole("menuitem", { name: "View details" }).click();
  await expect(page.locator("#map-selection")).toBeFocused();
  expect(await page.locator("#property-context").getAttribute("style")).toBeNull();
});
test("gallery hides the map, keeps selection and applies column and card preferences", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(base + "map.html");
  await page.locator('[data-select="courtyard"]').click();
  await page.getByRole("button", { name: "Gallery", exact: true }).click();
  await expect(page.locator(".u-map-surface")).toBeHidden();
  await expect(page.locator(".u-map-card:visible")).toHaveCount(5);
  await page.getByText("Gallery settings", { exact: true }).click();
  await page.getByLabel("Columns", { exact: true }).selectOption("2");
  await page.getByLabel("Card style", { exact: true }).selectOption("compact");
  await expect(page.locator(".u-map-results")).toHaveAttribute("data-columns", "2");
  await expect(page.locator(".u-map-results")).toHaveAttribute("data-density", "compact");
  const first = await page.locator(".u-map-card").first().boundingBox();
  const second = await page.locator(".u-map-card").nth(1).boundingBox();
  expect(first.y).toBeCloseTo(second.y, 0);
  await page.getByRole("button", { name: "Map and list", exact: true }).click();
  await expect(page.locator(".u-map-surface")).toBeVisible();
  await expect(page.locator('[data-select="courtyard"]')).toHaveAttribute("aria-pressed", "true");
});
test("expanding document details preserves every column position and width", async ({ page }) => {
  await page.goto(base + "workspace.html");
  const geometry = () =>
    page.locator(".u-table thead th").evaluateAll((cells) =>
      cells.map((cell) => {
        const { x, width } = cell.getBoundingClientRect();
        // Reaching a row can scroll the table sideways; measure columns within that scroll.
        return { x: x + cell.closest(".u-table").scrollLeft, width };
      }),
    );
  const before = await geometry();
  await page.getByText("File information", { exact: false }).first().click();
  expect(await geometry()).toEqual(before);
});

test("map, list and combined views retain selection and filters", async ({ page }) => {
  await page.goto(base + "map.html");
  await expect(page.locator(".u-map-layout")).toHaveAttribute("data-view", "both");
  await page.locator('[data-select="courtyard"]').click();
  await page.getByLabel("Property type").selectOption("House");
  await page.getByRole("button", { name: "List only", exact: true }).click();
  await expect(page.locator(".u-map-surface")).toBeHidden();
  await expect(page.locator(".u-map-results")).toBeVisible();
  await page.getByRole("button", { name: "Map only", exact: true }).click();
  await expect(page.locator(".u-map-results")).toBeHidden();
  await expect(page.locator(".u-map-surface")).toBeVisible();
  await page.getByRole("button", { name: "Map and list", exact: true }).click();
  await expect(page.locator(".u-map-results")).toBeVisible();
  await expect(page.locator(".u-map-surface")).toBeVisible();
  await expect(page.getByLabel("Property type")).toHaveValue("House");
  await expect(page.locator('[data-select="courtyard"]')).toHaveAttribute("aria-pressed", "true");
});
