import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const SITE = "http://127.0.0.1:4401/playground/";

test("patterns preserve edits, reset, change states and copy the current HTML", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(SITE);
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
  await page.locator('[data-preset="form"]').click();
  await page.locator('[data-preset="records"]').click();
  await expect(preview.getByRole("heading", { name: "Custom preview" })).toBeVisible();
  await page.getByRole("button", { name: "Reset pattern" }).click();
  await expect(preview.getByRole("heading", { name: "Your documents" })).toBeVisible();
});

test("all starter states render accessibly in both themes", async ({ page }) => {
  test.setTimeout(90_000);
  const specimen = await page.context().newPage();
  await page.goto(SITE);
  for (const theme of ["dark", "light"]) {
    await page.locator(`[data-theme-choice="${theme}"]`).click();
    for (const id of ["records", "form", "empty", "buttons", "callout"]) {
      await page.locator(`[data-preset="${id}"]`).click();
      const states = await page.locator("#variant option").allTextContents();
      for (const state of states) {
        await page.locator("#variant").selectOption(state);
        await expect(page.frameLocator("#preview").locator("html")).toHaveAttribute("data-theme", theme);
        // Audit the exact preview document separately so its no-script sandbox
        // cannot prevent axe from inspecting component content.
        await specimen.setContent(await page.locator("#preview").getAttribute("srcdoc"));
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
  await page.getByRole("button", { name: "Mobile", exact: true }).click();
  expect(
    await page.locator("#preview").evaluate((el) => el.getBoundingClientRect().width),
  ).toBeLessThanOrEqual(390);
});

test("edited HTML cannot execute scripts, navigate links, or load external resources", async ({ page }) => {
  const external = [];
  page.on("request", (request) => {
    if (request.url().startsWith("https://example.com")) external.push(request.url());
  });
  await page.goto(SITE);
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
