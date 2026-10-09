import { test, expect } from "@playwright/test";
const swipe = (node) =>
  node.evaluate((element) => {
    element.scrollTop = 0;
    const touch = (y) => new Touch({ identifier: 1, target: element, clientX: 100, clientY: y });
    element.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [touch(50)] }));
    element.dispatchEvent(new TouchEvent("touchend", { bubbles: true, changedTouches: [touch(200)] }));
  });
test("component gallery locks scrolling and closes by swipe; compact code and timeline stay clean", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:4401/");
  await expect(page.locator(".s-code--single code").first()).toHaveCSS("font-size", "13px");
  await expect(page.locator(".u-activity").first()).toHaveCSS("border-left-width", "0px");
  await page.getByRole("button", { name: "Open Gallery", exact: true }).click();
  const modal = page.locator("#demo-modal");
  await expect(modal).toBeVisible();
  await expect(page.locator("html")).toHaveCSS("overflow-y", "hidden");
  const before = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await swipe(modal);
  await expect(modal).toBeHidden();
  await expect(page.locator("html")).not.toHaveCSS("overflow-y", "hidden");
  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => (document.documentElement.dataset.theme = value), theme);
    await page.locator("#install").scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath(`components-${theme}.png`) });
  }
});
test("context trigger toggles, native sharing uses the selected property and fallback copies its link", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data) => {
        window.shared = data;
      },
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.copied = text;
        },
      },
    });
  });
  await page.goto("http://127.0.0.1:4401/workflows/map.html");
  const trigger = page.locator('[data-property="courtyard"] .u-context-trigger');
  const menu = page.locator("#property-context");
  await trigger.click();
  await expect(menu).toBeVisible();
  await expect(page.locator("html")).toHaveCSS("overflow-y", "hidden");
  await trigger.click();
  await expect(menu).toBeHidden();
  await trigger.click();
  await menu.getByRole("menuitem", { name: "Share property" }).click();
  const data = await page.evaluate(() => window.shared);
  expect(data.title).toBe("Courtyard house");
  expect(data.url).toBe("http://127.0.0.1:4401/workflows/map.html#property=courtyard");
  await expect(menu).toBeHidden();
  await page.evaluate(() => Object.defineProperty(navigator, "share", { value: undefined }));
  await trigger.click();
  await menu.getByRole("menuitem", { name: "Share property" }).click();
  expect(await page.evaluate(() => window.copied)).toBe(data.url);
  await page.goto(data.url);
  await expect(page.locator('[data-select="courtyard"]')).toHaveAttribute("aria-pressed", "true");
});
test("closing mobile details leaves the Playground background in place", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:4401/playground/#map-list");
  const preview = page.locator("#live-preview");
  const live = page.frameLocator("#live-preview");
  await live.locator('[data-select="courtyard"]').scrollIntoViewIfNeeded();
  const position = await page.evaluate(() => scrollY);
  const documentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await live.locator('[data-select="courtyard"]').click();
  await expect(preview).toHaveClass(/g-preview-fullscreen/);
  expect(
    Math.abs((await page.evaluate(() => document.documentElement.scrollHeight)) - documentHeight),
  ).toBeLessThan(2);
  await swipe(live.locator(".u-map-selection"));
  await expect(preview).not.toHaveClass(/g-preview-fullscreen/);
  await page.waitForTimeout(350);
  expect(Math.abs((await page.evaluate(() => scrollY)) - position)).toBeLessThan(2);
  await expect(page.locator(".g-overlay-spacer")).toHaveCount(0);
});
