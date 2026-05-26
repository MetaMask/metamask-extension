import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';
import { DAPP_PAGE_LOAD_BENCHMARK_DIR } from './test/e2e/benchmarks/utils/constants';
import { isHeadless } from './test/helpers/env';

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
    [
      'junit',
      {
        outputFile: `${logOutputFolder}/junit/test-results.xml`,
      },
    ],
    // Mocha-compatible JUnit reporter used by the central e2e test
    // report (`.github/scripts/create-e2e-test-report.mts`). Activates
    // only when `PLAYWRIGHT_JUNIT_OUTPUT_FILE` is set, which the
    // Playwright e2e CI jobs (chrome-e2e / firefox-e2e) export.
    // See: test/e2e/playwright/shared/mocha-compat-junit-reporter.ts
    ['./test/e2e/playwright/shared/mocha-compat-junit-reporter.ts'],
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
      name: 'swap',
      testMatch: '/swap/specs/*swap.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
      fullyParallel: false,
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
    {
      name: 'benchmark',
      testDir: DAPP_PAGE_LOAD_BENCHMARK_DIR,
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        headless: Boolean(process.env.CI),
      },
      fullyParallel: false,
      timeout: 600 * 1000, // 10 minutes
    },
    // Migrated Selenium specs running through the PlaywrightDriver shim.
    // See docs/superpowers/specs/2026-05-26-selenium-to-playwright-e2e-migration-design.md.
    // The browser fixtures from `use` are inert here — withFixtures spawns
    // its own Playwright context via buildPlaywrightDriver.
    {
      name: 'chrome-e2e',
      testDir: 'test/e2e/tests',
      testMatch: '**/*.pw.spec.ts',
      fullyParallel: false,
      timeout: 5 * 60 * 1000,
    },
    {
      name: 'firefox-e2e',
      testDir: 'test/e2e/tests',
      testMatch: '**/*.pw.spec.ts',
      fullyParallel: false,
      timeout: 5 * 60 * 1000,
    },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: `${logOutputFolder}/test-artifacts/`,
};

export default config;
