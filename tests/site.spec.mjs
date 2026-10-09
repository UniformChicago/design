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

for (const path of [
  "/",
  "/gallery/",
  "/playground/",
  "/agent/",
  "/workflows/",
  "/workflows/dashboard.html",
  "/workflows/workspace.html",
  "/workflows/states.html",
  "/workflows/map.html",
]) {
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
  for (const path of ["/playground/", "/agent/", "/workflows/", "/workflows/map.html"]) {
    expect(await shell(path)).toEqual(docs);
  }
});

test("every sidebar anchor points at a section on the page", async ({ page }) => {
  await page.goto(SITE + "/");
  const ids = await page
    .locator('.s-side a[href^="#"]')
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

test("menus retain native scrolling with hidden scrollbars", async ({ page }) => {
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 600 });
    await page.goto(SITE + "/");
    const result = await page.locator(".s-side").evaluate((menu) => {
      const style = getComputedStyle(menu);
      menu.scrollTo({ left: menu.scrollWidth, top: menu.scrollHeight, behavior: "instant" });
      return {
        scrollbar: style.scrollbarWidth,
        moved: menu.scrollLeft > 0 || menu.scrollTop > 0,
      };
    });
    expect(result.scrollbar).toBe("none");
    expect(result.moved).toBe(true);
  }
});

test("code headers retain their height when copy controls are revealed", async ({ page }) => {
  await page.goto(SITE + "/");
  await expect(page.locator(".s-code-bar .s-copy").first()).toBeVisible();
  const heights = await page
    .locator(".s-code-bar")
    .first()
    .evaluate((bar) => {
      const control = bar.querySelector("button");
      const shown = bar.getBoundingClientRect().height;
      control.hidden = true;
      const hidden = bar.getBoundingClientRect().height;
      control.hidden = false;
      return { shown, hidden };
    });
  expect(heights.shown).toBe(heights.hidden);
});

test("the dialog example opens, confirms and restores focus", async ({ page }) => {
  await page.goto(SITE + "/#dialogs");
  const trigger = page.getByRole("button", { name: "Review action", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Confirm sample action" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.locator("#example-dialog-status")).toContainText("Sample action confirmed");
});

test("dashboard task changes preserve panel positions", async ({ page }) => {
  await page.goto(SITE + "/workflows/dashboard.html");
  await page.evaluate(() => document.fonts.ready);
  await page.locator("#tasks").scrollIntoViewIfNeeded();
  const geometry = () =>
    page.locator(".s-pattern-layout .u-panel").evaluateAll((panels) =>
      panels.map((panel) => {
        const rect = panel.getBoundingClientRect();
        return [rect.x, rect.y + window.scrollY, rect.width, rect.height].map((value) => Math.round(value));
      }),
    );
  const initial = await geometry();
  const tasks = page.locator("[data-task]");
  for (let mask = 0; mask < 8; mask++) {
    for (let i = 0; i < 3; i++) await tasks.nth(i).setChecked(Boolean(mask & (1 << i)));
    expect(await geometry()).toEqual(initial);
  }
});

test("header switches between docs and Playground icons without changing button geometry", async ({
  page,
}) => {
  await page.goto(SITE + "/");
  const link = page.locator(".s-pages a");
  const before = await link.boundingBox();
  const docsIcon = await link.innerHTML();
  for (let press = 0; press < 3; press++) {
    await page.getByRole("link", { name: "Playground", exact: true }).click();
    await expect(link).toHaveAttribute("aria-label", "Documentation");
    expect(await link.innerHTML()).not.toBe(docsIcon);
    expect(await link.boundingBox()).toEqual(before);
    await page.getByRole("link", { name: "Documentation", exact: true }).click();
    await expect(link).toHaveAttribute("aria-label", "Playground");
    expect(await link.innerHTML()).toBe(docsIcon);
    expect(await link.boundingBox()).toEqual(before);
  }
});

test("every docs page carries link-preview tags whose image and icon resolve", async ({ page }) => {
  for (const path of ["/", "/playground/", "/agent/", "/workflows/map.html"]) {
    await page.goto(SITE + path);
    const meta = (key) =>
      page.locator(`meta[property="${key}"], meta[name="${key}"]`).getAttribute("content");
    expect(await meta("og:title")).toBe(await page.title());
    expect(await meta("og:description")).toBeTruthy();
    expect(await meta("og:url")).toBe(`https://design.uniformrealestate.com${path}`);
    expect(await meta("og:image")).toBe("https://design.uniformrealestate.com/og.png");
    expect(await meta("twitter:card")).toBe("summary_large_image");
  }
  for (const [asset, size] of [
    ["/og.png", 200_000],
    ["/apple-touch-icon.png", 1_000],
  ]) {
    const response = await page.request.get(SITE + asset);
    expect(response.headers()["content-type"]).toBe("image/png");
    expect((await response.body()).length).toBeGreaterThan(size);
  }
});
