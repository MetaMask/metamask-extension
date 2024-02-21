import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: './test/e2e/mmi/.env' });
const logOutputFolder = './public/playwright/playwright-reports';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: 'test/e2e/mmi/specs',
  /* Maximum time one test can run for. */
  timeout: 70 * 1000,
  expect: {
    timeout: 30 * 1000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: Boolean(process.env.CI),
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    [
      'html',
      {
        open: 'on-failure',
        outputFolder: `${logOutputFolder}/html/`,
      },
    ],
    ['junit', { outputFile: `${logOutputFolder}/junit/test-results.xml` }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on',
    video: 'off',
    // Run tests headless in local
    headless: process.env.HEADLESS === 'true',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'mmi',
      testMatch: '**/*.spec.ts',
      testIgnore: '**/*visual.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'mmi.visual',
      testMatch: '**/*visual.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: `${logOutputFolder}/test-artifacts/`,
};

export default config;
