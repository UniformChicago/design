// Render reproducible social cards from the labeled local sample photos.
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
const { color } = JSON.parse(readFileSync(join(root, "tokens/tokens.json")));
const temporary = mkdtempSync(join(tmpdir(), "uniform-property-share-"));
const browser = await chromium.launch();
try {
  mkdirSync(join(root, "site/share"), { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const photo of ["house_exterior", "apartment_exterior"]) {
    const src = pathToFileURL(join(root, `gallery/img/${photo}.jpg`)).href;
    const logo = pathToFileURL(join(root, "dist/svg/uniform-wordmark-on-dark.svg")).href;
    const html = `<!doctype html><html><head><style>
      *{box-sizing:border-box}body{margin:0;background:${color.night.value};color:${color.paper.value}}
      .photo{width:1200px;height:630px;object-fit:cover;display:block}
      footer{position:absolute;bottom:0;left:0;right:0;padding:40px 32px 24px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(transparent,${color.night.value});font:20px Arial,sans-serif}
      footer img{width:180px;height:auto}footer span{opacity:.85}
    </style></head><body><img class="photo" src="${src}"><footer><img src="${logo}"><span>AI-generated sample · Not a real listing</span></footer></body></html>`;
    const file = join(temporary, "card.html");
    writeFileSync(file, html);
    await page.goto(pathToFileURL(file).href);
    await page.locator(".photo").evaluate((image) => image.decode());
    await page.locator("footer img").evaluate((image) => image.decode());
    await page.screenshot({ path: join(root, `site/share/${photo}.jpg`), type: "jpeg", quality: 85 });
  }
} finally {
  await browser.close();
  rmSync(temporary, { recursive: true, force: true });
}
