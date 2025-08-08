import { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

/**
 * System Test Configuration for MetaMask Extension
 *
 * This configuration extends the main Playwright config with system-specific settings
 */
const config: PlaywrightTestConfig = {
  testDir: './specs',
  timeout: 120 * 1000, // 2 minutes per test
  expect: {
    timeout: 30 * 1000,
  },
  fullyParallel: false, // Run system tests sequentially for stability
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker to avoid conflicts

  reporter: [
    ['list'],
    ['html', { outputFolder: './test-results/html' }],
    ['junit', { outputFile: './test-results/junit.xml' }],
  ],

  use: {
    actionTimeout: 30 * 1000,
    navigationTimeout: 30 * 1000,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: process.env.HEADLESS !== 'false',
  },

  projects: [
    {
      name: 'system-chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],

  outputDir: './test-results/artifacts',
};

export default config;
