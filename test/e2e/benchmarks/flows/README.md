# Benchmark Flows

This directory contains all benchmark implementations organized by category.

### Running Benchmarks

```bash
# Run a specific benchmark by file path, default is 5 iterations
yarn test:e2e:benchmark test/e2e/benchmarks/flows/performance/onboarding-import-wallet.ts

# Run a preset (group of benchmarks)
yarn test:e2e:benchmark --preset performanceOnboardingNew

# Run all benchmarks
yarn test:e2e:benchmark

# Run with custom iterations and retries
yarn test:e2e:benchmark --preset userActions --iterations 5 --retries 3

# Save results to file
yarn test:e2e:benchmark --preset performanceOnboardingNew --out results.json
```

### Available Presets

| Preset                         | Description                     | Benchmarks                                                       |
| ------------------------------ | ------------------------------- | ---------------------------------------------------------------- |
| `standardHome`                 | Standard user page load         | `standard-home.ts`                                               |
| `powerUserHome`                | Power user page load            | `power-user-home.ts`                                             |
| `userActions`                  | User interaction timings        | `load-new-account.ts`, `confirm-tx.ts`, `bridge-user-actions.ts` |
| `performanceOnboardingImport`  | Import wallet onboarding        | `onboarding-import-wallet.ts`                                    |
| `performanceOnboardingNew`     | New wallet onboarding           | `onboarding-new-wallet.ts`                                       |
| `performanceAssets`            | Asset detail page loads         | `asset-details.ts`, `solana-asset-details.ts`                    |
| `performanceAccountManagement` | Login from home (import SRP)    | `import-srp-home.ts`                                             |
| `performanceTransactions`      | Send and swap transaction flows | `send-transactions.ts`, `swap.ts`                                |
| `pageLoadBenchmark`            | Playwright benchmarks           | `page-load-benchmark.spec.ts`                                    |
| `all`                          | All benchmarks                  | Everything above                                                 |

### Performance benchmarks: browserify vs webpack

- **PRs:** Performance benchmarks run on **Chrome + Browserify** only.
- **Push to main/release:** Performance benchmarks also run on **Chrome + Webpack** (separate `benchmarks-webpack-perf` job) so we can compare build systems before releasing webpack to production.

### Special CI Requirements

| Preset                         | Requirement                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------- |
| `performanceAccountManagement` | Requires `TEST_SRP_2` secret (12-word seed phrase). Set as a CI secret in GitHub. |

### 1. Create a new file in the appropriate subdirectory

Choose the category that best fits your benchmark:

- `page-load/` - For measuring page load times
- `user-actions/` - For measuring user interaction timings
- `performance/` - For E2E performance flows with multiple timers

### 2. Export a `run` function

Every benchmark must export a `run` function. The signature depends on the benchmark type:

#### TimerHelper API (for performance benchmarks)

Performance benchmarks use the `TimerHelper` class to measure operations:

```typescript
// Constructor
const timer = new TimerHelper(
  id: string  // camelCase identifier (e.g., 'assetClickToPriceChart')
);

// Measure method - wraps async action
await timer.measure(async () => {
  // Your async actions to measure
  await page.load();
  await element.click();
});
```

**Threshold Validation:**

Thresholds are configured separately in `test/e2e/benchmarks/utils/constants.ts` for statistical validation after multiple iterations. Each timer can have P75 and P95 thresholds with warn/fail levels:

```typescript
export const MY_BENCHMARK_THRESHOLDS: ThresholdConfig = {
  myTimerId: {
    p75: { warn: 1000, fail: 1500 }, // 75th percentile thresholds (ms)
    p95: { warn: 2000, fail: 3000 }, // 95th percentile thresholds (ms)
    ciMultiplier: DEFAULT_CI_MULTIPLIER, // 1.5x multiplier for CI environments
  },
};
```

Thresholds are validated by the benchmark runner after collecting statistics from all iterations. This approach is more reliable than per-run validation for performance testing.

### 3. Add to a preset (optional)

If your benchmark should run in CI, add its file path to the appropriate preset in `run-benchmark.ts`:

```typescript
const CI_PRESETS: Record<string, string[]> = {
  'my-preset': ['test/e2e/benchmarks/flows/category/my-benchmark.ts'],
  // ...
};
```

## Output Format

Benchmark results are output as JSON, either to stdout or to a file via `--out`:

```json
{
  "onboardingImportWallet": {
    "testTitle": "benchmark-onboarding-import-wallet",
    "persona": "standard",
    "mean": {
      "importWalletToSocialScreen": 209,
      "srpButtonToForm": 53
    },
    "p75": { ... },
    "p95": { ... }
  }
}
```

Results are sent to Sentry in CI via `send-to-sentry.ts` for monitoring and analysis.
Format: TODO
