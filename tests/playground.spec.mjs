import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const SITE = "http://127.0.0.1:4401/playground/";
const openSettings = async (page) => {
  const toggle = page.locator("#customize-toggle");
  if ((await toggle.isVisible()) && (await toggle.getAttribute("aria-expanded")) === "false")
    await toggle.click();
};
const chooseStarter = async (page, id) => {
  const picker = page.locator("#starter-picker");
  if (await picker.isVisible()) await picker.selectOption(id);
  else await page.locator(`[data-preset="${id}"]`).click();
};

test("patterns preserve edits, reset, change states and copy the current HTML", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(SITE + "#records");
  await openSettings(page);
  const preview = page.frameLocator("#preview");
  await expect(preview.getByRole("heading", { name: "Your documents" })).toBeVisible();
  await page.getByRole("combobox", { name: "State", exact: true }).selectOption("Complete");
  await expect(preview.getByText("Complete", { exact: true })).toHaveCount(3);
  await page.getByLabel("Heading", { exact: true }).fill("Sample records");
  await expect(preview.getByRole("heading", { name: "Sample records" })).toBeVisible();
  await page.locator("summary").click();
  await page
    .locator("#editor")
    .fill('<section class="u-panel"><h2 class="u-heading">Custom preview</h2></section>');
  await expect(preview.getByRole("heading", { name: "Custom preview" })).toBeVisible();
  await page.getByRole("button", { name: "Copy HTML", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("Custom preview");
  await chooseStarter(page, "form");
  await chooseStarter(page, "records");
  await expect(preview.getByRole("heading", { name: "Custom preview" })).toBeVisible();
  await page.getByRole("button", { name: "Reset pattern" }).click();
  await expect(preview.getByRole("heading", { name: "Your documents" })).toBeVisible();
});

test("all starter states render accessibly in both themes", async ({ page }) => {
  test.setTimeout(90_000);
  const specimen = await page.context().newPage();
  await page.goto(SITE + "#records");
  await openSettings(page);
  for (const theme of ["dark", "light"]) {
    await page.locator(`[data-theme-choice="${theme}"]`).click();
    for (const id of ["records", "form", "empty", "buttons", "callout"]) {
      await chooseStarter(page, id);
      const states = await page.locator("#variant option").allTextContents();
      for (const state of states) {
        await page.locator("#variant").selectOption(state);
        await expect(page.frameLocator("#preview").locator("html")).toHaveAttribute("data-theme", theme);
        // Audit the exact preview document separately so its no-script sandbox
        // cannot prevent axe from inspecting component content.
        await specimen.setContent(
          await page
            .locator("#preview")
            .evaluate((frame) => `<!doctype html>${frame.contentDocument.documentElement.outerHTML}`),
        );
        const result = await new AxeBuilder({ page: specimen })
          .setLegacyMode()
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"])
          .analyze();
        expect(
          result.violations.map((v) => `${v.id}: ${v.nodes.length}`),
          `${theme}/${id}/${state}`,
        ).toEqual([]);
      }
    }
  }
  await specimen.close();
  // On phones the width toggle is hidden: the preview is already mobile width.
  const mobile = page.getByRole("button", { name: "Mobile", exact: true });
  if (await mobile.isVisible()) await mobile.click();
  expect(
    await page.locator("#preview").evaluate((el) => el.getBoundingClientRect().width),
  ).toBeLessThanOrEqual(390);
});

test("edited HTML cannot execute scripts, navigate links, or load external resources", async ({ page }) => {
  const external = [];
  page.on("request", (request) => {
    if (request.url().startsWith("https://example.com")) external.push(request.url());
  });
  await page.goto(SITE + "#records");
  await openSettings(page);
  await page.locator("summary").click();
  await page
    .locator("#editor")
    .fill(
      '<script>parent.document.title="injected"</script><img src="https://example.com/probe" onerror="parent.document.title=\'injected\'"><a href="https://example.com">External</a><h2>Safe heading</h2>',
    );
  const frame = page.frameLocator("#preview");
  await expect(frame.getByRole("heading", { name: "Safe heading" })).toBeVisible();
  await expect(frame.locator("script")).toHaveCount(0);
  await expect(frame.locator("a")).not.toHaveAttribute("href");
  await expect(page).toHaveTitle("Playground · Uniform Design");
  expect(external).toEqual([]);
});

test("switching lab starters and states keeps the frame and controls in place", async ({ page }) => {
  await page.goto(SITE + "#records");
  await openSettings(page);
  await expect(page.frameLocator("#preview").getByRole("heading", { name: "Your documents" })).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.labDocument = document.getElementById("preview").contentDocument;
  });
  const geometry = () =>
    page
      .locator(".g-stage, .g-toolbar, #canvas, .g-customize, .g-preview-footer, .g-editor")
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node.getBoundingClientRect();
          return [rect.x, rect.y + window.scrollY, rect.width, rect.height].map(Math.round);
        }),
      );
  const initial = await geometry();
  for (const id of await page
    .locator("[data-preset]")
    .evaluateAll((buttons) => buttons.map((button) => button.dataset.preset))) {
    await chooseStarter(page, id);
    for (const state of await page.locator("#variant option").allTextContents()) {
      if (await page.locator("#variant").isEnabled()) await page.locator("#variant").selectOption(state);
      expect(await geometry(), `${id}/${state}`).toEqual(initial);
      expect(
        await page.evaluate(() => window.labDocument === document.getElementById("preview").contentDocument),
      ).toBe(true);
    }
  }
});

test("the initial lab is visible and keeps its geometry while JavaScript initializes", async ({ page }) => {
  const script = "**/playground/playground.js*";
  await page.route(script, (route) => route.abort());
  await page.goto(SITE);
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(
    page.frameLocator("#live-preview").getByRole("heading", { name: "Map and list", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const geometry = () =>
    page.locator("#workspace, .g-library, .g-stage, #canvas, .g-customize").evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return [rect.x, rect.y + window.scrollY, rect.width, rect.height].map(Math.round);
      }),
    );
  const before = await geometry();
  const count = await page.locator("[data-preset]").count();
  await page.unroute(script);
  await page.reload();
  await expect(page.locator("#s-theme")).toBeVisible();
  expect(await geometry()).toEqual(before);
  await openSettings(page);
  await page.getByLabel("Heading", { exact: true }).fill("Initialized lab");
  await expect(page.frameLocator("#preview").getByRole("heading", { name: "Initialized lab" })).toBeVisible();
  expect(await page.locator("[data-preset]").count()).toBe(count);
});

test("complete workflows are editable starters with working isolated previews", async ({ page }) => {
  await page.goto(SITE + "#status-dashboard");
  await openSettings(page);
  const live = page.frameLocator("#live-preview");
  await expect(live.locator("#task-count")).toHaveText("1 of 3");
  await live.locator("[data-task]").nth(1).check();
  await expect(live.locator("#task-count")).toHaveText("2 of 3");
  await page.locator("#sample-title").fill("My transaction overview");
  await expect(page.locator("#preview")).toBeVisible();
  await expect(
    page.frameLocator("#preview").getByRole("heading", { name: "My transaction overview" }),
  ).toBeVisible();
  await expect(page.locator("#editor")).toHaveValue(/My transaction overview/);
  await chooseStarter(page, "searchable-collection");
  await expect(live.getByRole("heading", { name: "Document collection", exact: true })).toBeVisible();
  await chooseStarter(page, "status-dashboard");
  await expect(
    page.frameLocator("#preview").getByRole("heading", { name: "My transaction overview" }),
  ).toBeVisible();
  await expect(page.locator(".g-library a[href*='workflows/']")).toHaveCount(0);
});

test("live and markup use matching page, control and map geometry", async ({ page }) => {
  await page.goto(SITE + "#map-list");
  const live = page.frameLocator("#live-preview");
  await expect(live.getByRole("heading", { name: "Map and list", exact: true })).toBeVisible();
  const boxes = (frame) =>
    frame.locator("body").evaluate(async (body) => {
      await document.fonts.ready;
      return [
        ".u-page-header",
        ".u-map-toolbar",
        ".u-map-views",
        ".u-map-layout",
        ".u-map-results",
        ".u-map-surface",
      ].map((selector) => {
        const rect = body.querySelector(selector).getBoundingClientRect();
        return [rect.x, rect.y + window.scrollY, rect.width, rect.height].map(Math.round);
      });
    });
  const initial = await boxes(live);
  await page.getByRole("button", { name: "Markup", exact: true }).click();
  await expect(page.locator("#preview")).toBeVisible();
  expect(await boxes(page.frameLocator("#preview"))).toEqual(initial);
});

test("phone starter picker shows full names and stacks customization fields", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(SITE);
  const picker = page.getByRole("combobox", { name: "Starter", exact: true });
  await expect(picker).toBeVisible();
  await expect(page.locator("#presets")).toBeHidden();
  await expect(page.locator("#starter-settings")).toBeHidden();
  const preview = await page.locator("#canvas").boundingBox();
  expect(preview.y).toBeLessThan(500);
  expect(await picker.evaluate((select) => getComputedStyle(select).alignItems)).toBe("center");
  await picker.selectOption("buttons");
  await openSettings(page);
  await expect(page.locator('[data-preset="buttons"]')).toHaveAttribute("aria-pressed", "true");
  const state = await page.locator("#variant").boundingBox();
  const heading = await page.locator("#sample-title").boundingBox();
  expect(heading.y).toBeGreaterThan(state.y + state.height);
  expect(heading.width).toEqual(state.width);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
  ).toBe(true);
});
