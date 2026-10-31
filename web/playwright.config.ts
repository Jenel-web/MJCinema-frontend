import { defineConfig } from '@playwright/test'

// The backend only allows the origin http://127.0.0.1:5500 (CORS), so the app is always served there.
const ORIGIN = 'http://127.0.0.1:5500'

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e-output/results',
  // Render free tier can take ~45s+ to wake up.
  timeout: 150_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: ORIGIN,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5500 --strictPort',
    url: ORIGIN,
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
