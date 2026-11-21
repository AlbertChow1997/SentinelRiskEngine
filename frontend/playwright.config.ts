import { defineConfig, devices } from '@playwright/test'

// Runs against the production preview build and the static Storybook build, so the checks
// match what ships. Build both first: `npm run build && npm run build-storybook`.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    trace: 'off',
    ...devices['Desktop Chrome'],
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : {},
  },
  webServer: [
    {
      command: 'npm run preview -- --port 4173 --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'http-server storybook-static --port 6006 --silent',
      url: 'http://localhost:6006',
      reuseExistingServer: !process.env.CI,
    },
  ],
})
