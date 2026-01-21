# Performance Tests

This folder contains end-to-end performance tests for MetaMask Extension. These tests measure the time it takes to complete specific user flows and interactions, providing insights into the application's performance under realistic conditions.

## Overview

The performance tests use a **power user profile** with pre-loaded wallet state (multiple accounts, networks, and tokens) to simulate real-world usage patterns. Each test measures specific user interactions using a custom timer system with threshold validation.

## Test Scenarios

| Folder | Scenario | Description |
|--------|----------|-------------|
| `onboarding/` | Wallet Creation | Measures onboarding flow for new wallet creation |
| `onboarding/` | Wallet Import | Measures onboarding flow when importing an existing wallet via SRP |
| `login/` | Import SRP from Home | Measures importing a second SRP after login |
| `login/` | Send Transactions | Measures the send flow performance for native tokens |
| `login/` | Swap | Measures swap page load and quote fetching times |
| `login/` | Asset Details | Measures asset details page load time (EVM & Solana) |

## Timer System

### Architecture

The timer system consists of three main components:

1. **`Timers`** - Singleton class that manages timer storage
2. **`TimerHelper`** - Wrapper class with `measure()` method and threshold support
3. **`PerformanceTracker`** - Collects timers and generates reports

### Usage Pattern

```typescript
import {
  setupPerformanceReporting,
  performanceTracker,
  TimerHelper,
} from '../utils/testSetup';

describe('My Performance Test', function () {
  // Enable automatic performance reporting
  setupPerformanceReporting();

  it('measures something', async function () {
    // Create a timer with browser-specific thresholds (in ms)
    const timer = new TimerHelper(
      'Time to complete action',
      { chrome: 5000, firefox: 6000 }  // thresholds
    );

    // Measure an async action using the measure() method
    await timer.measure(async () => {
      // ... actions to measure ...
      await page.waitForElement();
    });

    // Add timer to the tracker for reporting
    performanceTracker.addTimer(timer);
  });
});
```

### TimerHelper Features

- **`measure(action)`** - Wraps an async function, automatically starting and stopping the timer
- **`start()` / `stop()`** - Manual timer control if needed
- **`getDuration()`** - Returns duration in milliseconds
- **`getDurationInSeconds()`** - Returns duration in seconds
- **`hasThreshold()`** - Check if threshold is defined
- **`threshold`** - Effective threshold (base + 10% margin)
- **`baseThreshold`** - Original threshold without margin

### Threshold Validation

Thresholds include a 10% margin to account for variance. If a timer exceeds its threshold, the report will show validation details:

```json
{
  "validation": {
    "passed": false,
    "exceeded": 500,
    "percentOver": "10.0%"
  }
}
```

## Report Structure

Reports are saved to `test/test-results/power-user-scenarios/` as JSON files:

```json
{
  "testName": "measures swap flow performance with quote fetching",
  "testFile": "swap.spec.ts",
  "timestamp": "2025-01-21T10:30:00.000Z",
  "thresholdMarginPercent": 10,
  "steps": [
    {
      "name": "Time to open swap page from home",
      "duration": 1234,
      "baseThreshold": 5000,
      "threshold": 5500,
      "validation": {
        "passed": true,
        "exceeded": null,
        "percentOver": null
      }
    }
  ],
  "total": 3.8,
  "totalThreshold": 16500,
  "hasThresholds": true,
  "totalValidation": {
    "passed": true,
    "exceeded": null,
    "percentOver": null
  }
}
```

## Complete Example: Swap Performance Test

```typescript
import { generateWalletState } from '../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../app/scripts/fixtures/with-networks';
import { WITH_STATE_POWER_USER } from '../../e2e/benchmarks/constants';
import { withFixtures } from '../../e2e/helpers';
import HomePage from '../../e2e/page-objects/pages/home/homepage';
import { Driver } from '../../e2e/webdriver/driver';
import {
  setupPerformanceReporting,
  performanceTracker,
  TimerHelper,
} from '../utils/testSetup';
import LoginPage from '../../e2e/page-objects/pages/login-page';
import SwapPage from '../../e2e/page-objects/pages/swap/swap-page';

describe('Swap Performance', function () {
  setupPerformanceReporting();

  it('measures swap flow performance', async function () {
    await withFixtures(
      { /* fixture config */ },
      async ({ driver }: { driver: Driver }) => {
        // Create timers with thresholds
        const timerOpenSwapPage = new TimerHelper(
          'Time to open swap page',
          { chrome: 5000, firefox: 6000 }
        );
        const timerQuoteFetching = new TimerHelper(
          'Time to fetch quotes',
          { chrome: 10000, firefox: 12000 }
        );

        // Login
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.loginToHomepage();

        // Measure: Open swap page
        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();
        await timerOpenSwapPage.measure(async () => {
          const swapPage = new SwapPage(driver);
          await swapPage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerOpenSwapPage);

        // Measure: Fetch quotes
        const swapPage = new SwapPage(driver);
        await swapPage.enterSwapAmount('1');
        await timerQuoteFetching.measure(async () => {
          await swapPage.checkQuoteIsDisplayed();
        });
        performanceTracker.addTimer(timerQuoteFetching);
      },
    );
  });
});
```

## Running the Tests

### Locally

Performance tests reuse the existing e2e infrastructure via the `--performance` flag in `test/e2e/run-all.ts`.

```bash
# Build test extension first
yarn build:test

# Run all performance tests
yarn test:e2e:performance

# Run with retries
yarn test:e2e:performance --retries 2

# Run with Firefox
SELENIUM_BROWSER=firefox yarn test:e2e:performance

# Run a specific performance test
yarn test:e2e:single test/performance-tests/login/swap.spec.ts --browser=chrome
```

**Available options:**
- `--retries <n>` - Number of retries on failure
- `--browser <chrome|firefox>` - Browser to use (default: chrome)
- `--debug` - Enable debug logging (default: true)

### CI/CD (GitHub Actions)

Performance tests run automatically on every push to `main` branch via the `.github/workflows/run-performance-tests.yml` workflow.

**Workflow features:**
- Builds the test extension
- Runs all performance tests sequentially for accurate timing measurements
- Uploads test artifacts with timing results
- Displays performance summary in the job logs

**View results:**
1. Go to the GitHub Actions tab
2. Find the "Performance Tests" workflow
3. Download the `performance-tests-results` artifact for detailed timing data

**Required secrets:**
- `INFURA_PROJECT_ID` - Required for all tests
- `E2E_POWER_USER_SRP` - Optional, for power user tests
- `TEST_SRP_2` - Optional, for import SRP tests

## Prerequisites

These tests require:
- `INFURA_PROJECT_ID` environment variable set in `.metamaskrc`
- For some tests: `E2E_POWER_USER_SRP` or `TEST_SRP_2` environment variables

## Output

After running the tests, check the `test/test-results/power-user-scenarios/` folder for JSON reports containing timing data and threshold validation results.

## Integration with E2E Infrastructure

Performance tests are integrated with the existing e2e test infrastructure:

- **Runner:** Uses `test/e2e/run-all.ts` with the `--performance` flag
- **Test execution:** Uses `test/e2e/run-e2e-test.js` for each test file
- **Page objects:** Reuses page objects from `test/e2e/page-objects/`
- **Fixtures:** Reuses fixtures and helpers from `test/e2e/`

The npm script `test:e2e:performance` is defined as:
```json
"test:e2e:performance": "SELENIUM_BROWSER=chrome tsx test/e2e/run-all.ts --performance"
```

This approach ensures consistency with the rest of the e2e tests and avoids code duplication.

## File Structure

```
test/performance-tests/
├── README.md
├── power-user.spec.ts
├── login/
│   ├── asset-details-power-user.spec.ts
│   ├── import-srp-home.spec.ts
│   ├── send-transactions.spec.ts
│   ├── solana-asset-details-power-user.spec.ts
│   └── swap.spec.ts
├── onboarding/
│   ├── onboarding-import-wallet.spec.ts
│   └── onboarding-new-wallet.spec.ts
└── utils/
    ├── commonMocks.ts
    ├── PerformanceTracker.ts
    ├── testSetup.ts
    ├── TimerHelper.ts
    └── Timers.ts
```
