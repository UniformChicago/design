import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const GALLERY = "/gallery/index.html";

test("Playground shell has zero axe violations (WCAG 2.2 AA + best practices)", async ({ page }) => {
  await page.goto(GALLERY);
  const r = await new AxeBuilder({ page })
    .setLegacyMode()
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
    .analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
});

test("keyboard: skip link first, and every control shows a visible focus ring", async ({ page }) => {
  await page.goto(GALLERY);
  await page.keyboard.press("Tab");
  await expect(page.locator(".u-skip")).toBeFocused();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const el = document.activeElement;
      return el && el !== document.body ? getComputedStyle(el).outlineStyle : "none";
    });
    expect(outline, "focused element has a visible outline").not.toBe("none");
  }
});

test("never scrolls horizontally", async ({ page }) => {
  await page.goto(GALLERY);
  const [sw, cw] = await page.evaluate(() => [
    document.documentElement.scrollWidth,
    document.documentElement.clientWidth,
  ]);
  expect(sw).toBeLessThanOrEqual(cw);
});

test("the brand dot is a circle, never a typed period", async ({ page }) => {
  await page.goto(GALLERY);
  const dots = page.locator(".u-dot");
  expect(await dots.count()).toBeGreaterThan(0);
  for (const r of await dots.evaluateAll((els) => els.map((e) => getComputedStyle(e).borderRadius)))
    expect(r).toBe("50%");
  expect(await page.locator(".u-dot").allTextContents()).toEqual(expect.arrayContaining([""]));
});

test("loads with no console errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(GALLERY);
  await page.waitForTimeout(300);
  expect(errors).toEqual([]);
});
