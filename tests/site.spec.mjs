import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, readdirSync } from "node:fs";

const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const tokens = JSON.parse(readFileSync(new URL("../tokens/tokens.json", import.meta.url), "utf8"));
const SITE = "http://127.0.0.1:4401";
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
const axe = async (page) =>
  (await new AxeBuilder({ page }).setLegacyMode().withTags(TAGS).analyze()).violations.map(
    (v) => `${v.id}: ${v.nodes.length} node(s)`,
  );

for (const path of ["/", "/gallery/", "/playground/"]) {
  test(`docs ${path}: zero axe violations, no horizontal scroll, no console errors`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    const consoleError = (m) => m.type() === "error" && errors.push(m.text());
    page.on("console", consoleError);
    await page.goto(SITE + path);
    const [sw, cw] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      document.documentElement.clientWidth,
    ]);
    expect(sw).toBeLessThanOrEqual(cw);
    expect(errors).toEqual([]);
    // Axe injects its own script into the deliberately script-free preview.
    // Check application console output before that instrumentation.
    page.off("console", consoleError);
    expect(await axe(page)).toEqual([]);
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

test("the light theme also has zero axe violations, and the choice survives a reload", async ({ page }) => {
  await page.goto(SITE + "/");
  const toggle = page.locator("#s-theme");
  await expect(toggle).toHaveAccessibleName("Switch to light theme");
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(toggle).toHaveAccessibleName("Switch to dark theme");
  expect(await axe(page)).toEqual([]);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("docs and Playground share one header: same position, size and controls", async ({ page }) => {
  const shell = async (path) => {
    await page.goto(SITE + path);
    await expect(page.locator("#s-theme")).toBeVisible();
    return page.evaluate(() => {
      const box = (e) => {
        const r = e.getBoundingClientRect();
        return [r.x, r.y, r.width, r.height].map(Math.round);
      };
      return {
        header: box(document.querySelector(".u-shell-header")),
        brand: box(document.querySelector(".s-brand")),
        controls: [...document.querySelectorAll(".u-shell-header-actions > *")].map(box),
      };
    });
  };
  const docs = await shell("/");
  expect(docs.controls).toHaveLength(3);
  expect(await shell("/playground/")).toEqual(docs);
});

test("every sidebar link points at a section on the page", async ({ page }) => {
  await page.goto(SITE + "/");
  const ids = await page
    .locator(".s-side a")
    .evaluateAll((as) => as.map((a) => a.getAttribute("href").slice(1)));
  expect(ids.length).toBeGreaterThan(15);
  for (const id of ids) expect(await page.locator(`[id="${id}"]`).count(), id).toBe(1);
});

test("each live example renders its source exactly, and the code block shows that same source", async ({
  page,
}) => {
  await page.goto(SITE + "/");
  const names = readdirSync(new URL("../site/examples/", import.meta.url)).map((f) =>
    f.replace(/\.html$/, ""),
  );
  const shown = await page.locator(".s-example .s-code code").allTextContents();
  for (const name of names) {
    const src = readFileSync(new URL(`../site/examples/${name}.html`, import.meta.url), "utf8").trimEnd();
    expect(shown, name).toContain(src);
  }
  expect(await page.locator(".s-example").count()).toBe(names.length);
});

test("copy buttons appear with JavaScript and copy the code", async ({ page, context, browserName }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(SITE + "/");
  const first = page.locator("#install button[data-copy]").first();
  await expect(first).toBeVisible();
  await first.click();
  await expect(first).toHaveAttribute("data-copied", "true");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    `npm install --save-exact github:UniformChicago/design#v${version}`,
  );
});

test("docs show the current version and every color token", async ({ page }) => {
  await page.goto(SITE + "/");
  await expect(page.locator("#install pre code").first()).toContainText(`design#v${version}`);
  expect(await page.locator("#color .s-card").count()).toBe(Object.keys(tokens.color).length);
});
