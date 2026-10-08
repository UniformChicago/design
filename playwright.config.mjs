import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  testIgnore: "**/unit/**",
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4400" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    {
      name: "firefox-patterns",
      testMatch: "workflows.spec.mjs",
      // GPU-less Linux runners block Firefox's software WebGL by default, which the map renderer needs.
      use: {
        ...devices["Desktop Firefox"],
        launchOptions: { firefoxUserPrefs: { "webgl.force-enabled": true } },
      },
    },
    { name: "webkit-patterns", testMatch: "workflows.spec.mjs", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: [
    {
      command: "node scripts/serve.mjs 4400",
      url: "http://127.0.0.1:4400/gallery/index.html",
      reuseExistingServer: !process.env.CI,
    },
    {
      // The docs site exactly as deployed: built into _site/ and served from there.
      command: "node build/site.mjs && node scripts/serve.mjs 4401 ../_site/",
      url: "http://127.0.0.1:4401/",
      reuseExistingServer: false, // always rebuild, so tests never see a stale _site/
    },
  ],
});
