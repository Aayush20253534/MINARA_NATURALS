import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  use: {
    baseURL: "http://127.0.0.1:3101",
    browserName: "chromium",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
          args: ["--no-sandbox", "--disable-dev-shm-usage"],
        }
      : {},
  },
  webServer: [
    {
      command: "node --experimental-strip-types scripts/qa-catalogue.mjs",
      url: "http://127.0.0.1:9101/store/minara/catalogue",
      reuseExistingServer: false,
    },
    {
      command:
        "npm run build && npm run start -- --port 3101 --hostname 127.0.0.1",
      url: "http://127.0.0.1:3101",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_MEDUSA_BACKEND_URL: "http://127.0.0.1:9101",
        NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: "pk_local_qa_only",
        NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3101",
      },
    },
  ],
});
