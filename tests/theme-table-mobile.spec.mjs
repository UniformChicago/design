import { test, expect } from "@playwright/test";

for (const width of [320, 390]) {
  test(`theme variables stay readable and copy resets at ${width}px`, async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width, height: 844 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:4401/#theme");
    const table = page.locator(".s-theme-table");
    await table.scrollIntoViewIfNeeded();
    const names = await table.locator("code").evaluateAll((codes) =>
      codes.map((code) => ({
        height: code.getBoundingClientRect().height,
        lineHeight: parseFloat(getComputedStyle(code).lineHeight),
      })),
    );
    expect(names.length).toBeGreaterThan(5);
    for (const name of names) expect(name.height).toBeLessThanOrEqual(name.lineHeight + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const copy = table.locator("button[data-copy]").first();
    await copy.click();
    await expect(copy).toHaveAttribute("data-copied", "true");
    await expect(copy).not.toHaveAttribute("data-copied", "true");
    expect(errors).toEqual([]);
    for (const theme of ["dark", "light"]) {
      await page.evaluate((value) => (document.documentElement.dataset.theme = value), theme);
      await table.screenshot({ path: test.info().outputPath(`tokens-${theme}.png`) });
    }
  });
}
