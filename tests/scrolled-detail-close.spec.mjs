import { test, expect } from "@playwright/test";
test("scrolled mobile details close without moving the preview or leaving header content", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto("http://127.0.0.1:4401/playground/#map-list");
  const preview = page.locator("#live-preview");
  const live = page.frameLocator("#live-preview");
  const card = live.locator('[data-select="courtyard"]');
  await card.scrollIntoViewIfNeeded();
  const before = await preview.boundingBox();
  const scroll = await page.evaluate(() => scrollY);
  await card.click();
  await expect(preview).toHaveClass(/g-preview-fullscreen/);
  const details = live.locator(".u-map-selection");
  await page.waitForTimeout(350);
  await details.evaluate((e) => (e.scrollTop = e.scrollHeight));
  expect(await details.evaluate((e) => e.scrollTop)).toBeGreaterThan(0);
  await details.focus();
  await page.keyboard.press("Escape");
  await expect(preview).not.toHaveClass(/g-preview-fullscreen/);
  await page.waitForTimeout(400);
  const after = await preview.boundingBox();
  expect(Math.abs(after.height - before.height)).toBeLessThan(2);
  expect(Math.abs(after.y - before.y)).toBeLessThan(2);
  expect(Math.abs((await page.evaluate(() => scrollY)) - scroll)).toBeLessThan(2);
  await expect(details).toBeHidden();
  await card.click();
  await expect.poll(() => details.evaluate((e) => e.scrollTop)).toBe(0);
});

test("touch clears outlines and sticky hover while keyboard focus remains visible", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "mobile", "Requires a touch pointer");
  await page.goto("http://127.0.0.1:4401/workflows/map.html");
  const filter = page.getByRole("button", { name: "Clear filter", exact: true });
  const baseline = await filter.evaluate((e) => ({
    color: getComputedStyle(e).color,
    background: getComputedStyle(e).backgroundColor,
  }));
  await filter.tap();
  await expect(page.locator("html")).toHaveAttribute("data-u-touch", "");
  await expect(filter).toHaveCSS("outline-style", "none");
  expect(
    await filter.evaluate((e) => ({
      color: getComputedStyle(e).color,
      background: getComputedStyle(e).backgroundColor,
    })),
  ).toEqual(baseline);
  await page.keyboard.press("Tab");
  await expect(page.locator("html")).not.toHaveAttribute("data-u-touch", "");
  await expect(page.locator(":focus")).toHaveCSS("outline-style", "solid");
});
test("property share pages expose photo metadata without scripts and generic pages retain the default", async ({
  page,
}) => {
  for (const [id, photo] of [
    ["courtyard", "house_exterior"],
    ["terrace", "apartment_exterior"],
  ]) {
    const response = await page.request.get(`http://127.0.0.1:4401/workflows/property-${id}.html`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(
      `property="og:image" content="https://design.uniformrealestate.com/share/${photo}.jpg"`,
    );
    expect(html).toContain(`data-initial-property="${id}"`);
    const image = await page.request.get(`http://127.0.0.1:4401/share/${photo}.jpg`);
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toContain("image/jpeg");
  }
  const home = await page.request.get("http://127.0.0.1:4401/");
  expect(await home.text()).toContain(
    'property="og:image" content="https://design.uniformrealestate.com/og.png"',
  );
});
