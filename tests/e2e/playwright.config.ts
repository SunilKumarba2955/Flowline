import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

const ci = Boolean(process.env.CI);
const apiPort = process.env.E2E_API_PORT ?? "4000";
const webPort = process.env.E2E_WEB_PORT ?? "5173";
const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  forbidOnly: ci,
  retries: ci ? 2 : 0,
  workers: ci ? 2 : undefined,
  reporter: ci ? [["line"], ["html", { open: "never" }]] : "list",
  outputDir: "../../test-results/playwright",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://127.0.0.1:${webPort}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: process.env.E2E_EXTERNAL_SERVER
    ? undefined
    : [
        { command: "npm run dev --workspace @flowline/api", cwd: repositoryRoot, url: `http://127.0.0.1:${apiPort}/health/ready`, reuseExistingServer: !ci, timeout: 120_000 },
        { command: `npm run dev --workspace @flowline/web -- --port ${webPort}`, cwd: repositoryRoot, url: `http://127.0.0.1:${webPort}`, reuseExistingServer: !ci, timeout: 120_000 }
      ],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } }
  ]
});
