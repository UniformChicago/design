import { test, expect } from "@playwright/test";
const swipeDown = async (locator) => {
  return locator.evaluate((element) => {
    element.scrollTop = 0;
    const touch = (y) => new Touch({ identifier: 1, target: element, clientX: 160, clientY: y });
    element.dispatchEvent(
      new TouchEvent("touchstart", { bubbles: true, touches: [touch(80)], changedTouches: [touch(80)] }),
    );
    element.dispatchEvent(
      new TouchEvent("touchend", { bubbles: true, touches: [], changedTouches: [touch(220)] }),
    );
    return { animating: element.classList.contains("u-swipe-dismiss"), open: element.open ?? null };
  });
};

test("mobile Playground overlays fit the phone and all photos scroll without arrows", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("https://tiles.openfreemap.org/styles/*", (route) =>
    route.fulfill({ json: { version: 8, sources: {}, layers: [] } }),
  );
  await page.goto("http://127.0.0.1:4401/playground/#map-list");
  const frame = page.locator("#live-preview");
  const live = page.frameLocator("#live-preview");
  await expect(live.locator("[data-map-filter]")).toHaveCSS("white-space", "nowrap");
  const filterWidth = (await live.locator("[data-map-filter]").boundingBox()).width;
  expect(filterWidth).toBeGreaterThan(180);
  await live.locator('[data-select="courtyard"]').click();
  await expect(frame).toHaveClass(/g-preview-fullscreen/);
  expect(await frame.boundingBox()).toEqual({ x: 0, y: 0, width: 390, height: 844 });
  const facts = await live.locator(".u-property-facts").boundingBox();
  const overview = await live.locator(".u-property-overview").boundingBox();
  expect(Math.abs(facts.x - overview.x)).toBeLessThan(1);
  await live.locator("[data-selection-save]").scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath("mobile-property-details.png") });
  await live.locator("[data-selection-photo]").click();
  const modal = live.locator("#gallery-modal");
  await expect(modal).toBeVisible();
  await expect(modal.locator(".u-gallery-modal-next")).toBeHidden();
  await expect(modal.locator(".u-gallery-modal-prev")).toBeHidden();
  const images = modal.locator(".u-gallery-mobile img");
  await expect(images).toHaveCount(3);
  await expect(live.locator("#gallery-image")).toBeHidden();
  expect((await images.first().boundingBox()).y).toBeLessThan(2);
  await expect(images.first()).toHaveCSS("user-select", "none");
  await expect(images.first()).toHaveAttribute("draggable", "false");
  await images.last().scrollIntoViewIfNeeded();
  await expect(images.last()).toBeInViewport();
  await expect(modal.locator(".u-gallery-modal-close")).toHaveCSS("clip-path", "inset(50%)");
  await page.screenshot({ path: test.info().outputPath("mobile-gallery.png") });
  expect(await swipeDown(modal)).toEqual({ animating: true, open: true });
  await page.waitForTimeout(80);
  expect((await modal.boundingBox()).y).toBeGreaterThan(5);
  await expect(modal).toBeHidden();
  await expect(frame).toHaveClass(/g-preview-fullscreen/);
  const details = live.locator(".u-map-selection");
  const closingFrames = details.evaluate(
    (element) =>
      new Promise((resolve) => {
        const frames = [];
        const started = performance.now();
        const record = () => {
          const closed = !element.querySelector("[data-selection-empty]").hidden;
          frames.push({ closed, visible: getComputedStyle(element).visibility !== "hidden" });
          if (performance.now() - started < 650) requestAnimationFrame(record);
          else resolve(frames);
        };
        record();
      }),
  );
  expect(await swipeDown(details)).toEqual({ animating: true, open: null });
  await expect(frame).not.toHaveClass(/g-preview-fullscreen/);
  const frames = await closingFrames;
  expect(frames.some((frame) => frame.closed)).toBe(true);
  expect(frames.filter((frame) => frame.closed && frame.visible)).toEqual([]);
  await expect(page.locator("body")).not.toHaveClass(/g-preview-open/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await live.locator('[data-select="courtyard"]').click();
  expect(await swipeDown(live.locator(".u-map-selection"))).toEqual({ animating: false, open: null });
  await expect(frame).not.toHaveClass(/g-preview-fullscreen/);
  for (const theme of ["light", "dark"]) {
    await page.goto("http://127.0.0.1:4400/gallery/index.html");
    await page.evaluate((value) => (document.documentElement.dataset.theme = value), theme);
    await page.locator(`[data-theme-choice="${theme}"]`).click();
    await page.screenshot({ path: test.info().outputPath(`gallery-${theme}.png`) });
  }
});

test("desktop photo viewer retains one photo and arrow navigation", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "Desktop pointer controls");
  await page.goto("http://127.0.0.1:4401/workflows/map.html");
  await page.locator('[data-select="courtyard"]').click();
  await page.locator("[data-selection-photo]").click();
  const image = page.locator("#gallery-image");
  await expect(image).toBeVisible();
  await expect(page.locator(".u-gallery-mobile")).toBeHidden();
  const before = await image.getAttribute("src");
  await page.getByRole("button", { name: "Next image" }).click();
  await expect(image).not.toHaveAttribute("src", before);
});
