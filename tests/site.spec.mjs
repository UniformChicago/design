import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";

const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const tokens = JSON.parse(readFileSync(new URL("../tokens/tokens.json", import.meta.url), "utf8"));

const SITE = "http://127.0.0.1:4401";

for (const path of ["/", "/gallery/"]) {
  test(`docs ${path}: zero axe violations, no horizontal scroll, no console errors`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto(SITE + path);
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
    const [sw, cw] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      document.documentElement.clientWidth,
    ]);
    expect(sw).toBeLessThanOrEqual(cw);
    expect(errors).toEqual([]);
  });

  test(`docs ${path}: every same-site link, image, stylesheet and script resolves`, async ({ page }) => {
    await page.goto(SITE + path);
    const refs = await page.evaluate(() =>
      [...document.querySelectorAll("a[href], link[href], img[src], script[src]")]
        .map((e) => e.href || e.src)
        .filter((u) => u.startsWith(location.origin))
        .map((u) => u.split("#")[0]),
    );
    expect(refs.length).toBeGreaterThan(5);
    for (const u of new Set(refs)) expect((await page.request.get(u)).status(), u).toBe(200);
  });
}

test("docs show the current version and every color token", async ({ page }) => {
  await page.goto(SITE + "/");
  await expect(page.getByText(`design#v${version}`)).toBeVisible();
  expect(await page.locator(".s-swatch").count()).toBe(Object.keys(tokens.color).length);
});
