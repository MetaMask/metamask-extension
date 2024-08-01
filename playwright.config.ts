import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';
import dotenv from 'dotenv';
import { isHeadless } from './test/helpers/env';

dotenv.config({ path: './test/e2e/playwright/mmi/.env' });
const logOutputFolder = './public/playwright/playwright-reports';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: 'test/e2e/playwright',
  /* Maximum time one test can run for. */
  timeout: 300 * 1000,
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
    /* Run tests headless in local */
    headless: isHeadless('PLAYWRIGHT'),
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'mmi',
      testMatch: '/mmi/specs/**.spec.ts',
      testIgnore: '/mmi/specs/visual.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'mmi.visual',
      testMatch: '/mmi/**/*visual.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'swap',
      testMatch: '/swap/specs/*swap.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
    },
    // Global: universal, common, shared, and non feature related tests
    {
      name: 'global',
      testMatch: '/global/specs/**.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
    },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: `${logOutputFolder}/test-artifacts/`,
};

export default config;
