# Performance Tests

This folder contains end-to-end performance tests for MetaMask Extension. These tests measure the time it takes to complete specific user flows and interactions, providing insights into the application's performance under realistic conditions.

## Overview

The performance tests use a **power user profile** with pre-loaded wallet state (multiple accounts, networks, and tokens) to simulate real-world usage patterns. Each test measures specific user interactions using a custom timer system with threshold validation.

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
    // Create a timer with optional threshold in ms
    const timer = new TimerHelper('Time to complete action', 5000);

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
  "hasThresholds": true,
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
  "testFile": "swap.spec.ts",
  "testName": "measures swap flow performance with quote fetching",
  "thresholdMarginPercent": 10,
  "timestamp": "2025-01-21T10:30:00.000Z",
  "total": 3.8,
  "totalThreshold": 16500,
  "totalValidation": {
    "passed": true,
    "exceeded": null,
    "percentOver": null
  }
}
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

