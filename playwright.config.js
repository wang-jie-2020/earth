import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 120000,
  expect: {
    timeout: 10000
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    viewport: { width: 1440, height: 900 },
    channel: "chrome",
    launchOptions: {
      args: [
        "--enable-unsafe-webgpu",
        "--disable-dawn-features=disallow_unsafe_apis",
        "--disable-skia-graphite"
      ]
    }
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    timeout: 120000,
    reuseExistingServer: true
  }
});
