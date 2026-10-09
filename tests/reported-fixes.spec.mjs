import { test, expect } from "@playwright/test";
const site = "http://127.0.0.1:4401";

test("calculator draws finite complete segments and keeps large totals inside the ring", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${site}/workflows/calculator.html`);
  await expect(page.locator("#calc-payment")).toHaveText(/\$[\d,]+/);
  for (const [price, rate, down] of [
    [342000, 6.5, 20],
    [450000, 0, 20],
    [450000, 0.000000000000001, 100],
    [0, 0, 0],
    [1000000000000, 100, 0],
    [-5, -5, 20],
  ]) {
    await page.locator("#calc-price").fill(String(price));
    await page.locator("#calc-rate").fill(String(rate));
    await page.locator("#calc-down").evaluate((input, value) => {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, String(down));
    const chart = await page.locator(".u-donut-chart").evaluate((svg) => {
      const paths = [...svg.querySelectorAll("path.u-donut-chart-segment")].map((path) =>
        path.getAttribute("d"),
      );
      return {
        finite: paths.every((path) => !/NaN|Infinity/.test(path)),
        visible: paths.some((path) => path.startsWith("M")),
        textWidth: svg.querySelector("text").getComputedTextLength(),
      };
    });
    expect(chart.finite).toBe(true);
    expect(chart.visible).toBe(true);
    if (price === 342000)
      await page.locator(".u-donut-chart").screenshot({ path: test.info().outputPath("chart.png") });
    expect(chart.textWidth).toBeLessThanOrEqual(62.1);
    await expect(page.locator("#calc-payment")).not.toHaveText(/NaN|Infinity/);
  }
  await page.locator("#calc-hoa-input").fill("0");
  await expect(page.locator("#calc-hoa")).toHaveText("$0");
  await expect(page.locator(".u-donut-chart-segment").last()).toHaveAttribute("d", "");
  expect(errors).toEqual([]);
});

test("document dialogs preserve table row heights and return focus", async ({ page }) => {
  await page.goto(`${site}/workflows/workspace.html`);
  const rows = page.locator("[data-u-row]");
  const before = await rows.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().height));
  const trigger = page.getByRole("button", { name: /Review items/ });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await rows.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().height))).toEqual(
    before,
  );
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("property arrow keys select adjacent filtered results", async ({ page }) => {
  await page.route("https://tiles.openfreemap.org/styles/*", (route) =>
    route.fulfill({ json: { version: 8, sources: {}, layers: [] } }),
  );
  await page.goto(`${site}/workflows/map.html`);
  const first = page.locator('[data-select="courtyard"]');
  await first.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator('[data-select="terrace"]')).toBeFocused();
  await expect(page.locator('[data-select="terrace"]')).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowUp");
  await expect(first).toBeFocused();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".u-map-caption")).toHaveCount(0);
});

test("docs slider fill updates and map demo has working price markers", async ({ page }) => {
  await page.route("https://tiles.openfreemap.org/styles/*", (route) =>
    route.fulfill({ json: { version: 8, sources: {}, layers: [] } }),
  );
  await page.goto(`${site}/`);
  await page.evaluate(() => document.fonts.ready);
  for (const theme of ["dark", "light"]) {
    await page.evaluate((value) => (document.documentElement.dataset.theme = value), theme);
    await page.locator("#overview").screenshot({ path: test.info().outputPath(`overview-${theme}.png`) });
  }
  const slider = page.locator("#slider-demo");
  await slider.evaluate((input) => {
    input.value = "25";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(slider).toHaveCSS("--progress", "25%");
  const map = page.locator("[data-doc-map]");
  await expect(map.locator(".u-map-price")).toHaveCount(3);
  await map.getByRole("button", { name: /Select Courtyard/ }).click();
  await expect(page.locator("[data-doc-map-status]")).toHaveText(/Selected Courtyard/);
  await page.getByRole("button", { name: "Open Gallery", exact: true }).click();
  await expect(page.locator("#demo-modal")).toBeVisible();
  await page.keyboard.press("Escape");
});

test("fullscreen sample photos remain labeled and captions clear the viewport edge", async ({ page }) => {
  await page.route("https://tiles.openfreemap.org/styles/*", (route) =>
    route.fulfill({ json: { version: 8, sources: {}, layers: [] } }),
  );
  await page.goto(`${site}/workflows/map.html`);
  await page.locator('[data-select="courtyard"]').click();
  await page.locator("[data-selection-photo]").click();
  const gallery = page.getByRole("dialog", { name: "Property photo gallery" });
  await expect(gallery).toBeVisible();
  await expect(page.locator("#gallery-caption")).toHaveText(/AI-generated sample/);
  const clearance = await page
    .locator("#gallery-caption")
    .evaluate((caption) => innerHeight - caption.getBoundingClientRect().bottom);
  expect(clearance).toBeGreaterThanOrEqual(24);
  await page.keyboard.press("Escape");
  await expect(gallery).toBeHidden();
  await expect(page.locator('[data-select="courtyard"]')).toHaveAttribute("aria-pressed", "true");
});
