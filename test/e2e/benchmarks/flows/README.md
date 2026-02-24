# Benchmark Flows

This directory contains all benchmark implementations organized by category.

### Running Benchmarks

```bash
# Run a specific benchmark by file path, default is 5 iterations
yarn test:e2e:benchmark test/e2e/benchmarks/flows/user-journey/onboarding-import-wallet.ts

# Run a preset (group of benchmarks)
yarn test:e2e:benchmark --preset userJourneyOnboardingNew

# Run all benchmarks
yarn test:e2e:benchmark

# Run with custom iterations and retries
yarn test:e2e:benchmark --preset interactionUserActions --iterations 5 --retries 3

# Save results to file
yarn test:e2e:benchmark --preset userJourneyOnboardingNew --out results.json
```

### Available Presets

| Preset                         | Description                     | Benchmarks                                                       |
| ------------------------------ | ------------------------------- | ---------------------------------------------------------------- |
| `startupStandardHome`          | Standard user cold-start        | `standard-home.ts`                                               |
| `startupPowerUserHome`         | Power user cold-start           | `power-user-home.ts`                                             |
| `interactionUserActions`       | Single-action interaction times | `load-new-account.ts`, `confirm-tx.ts`, `bridge-user-actions.ts` |
| `userJourneyOnboardingImport`  | Import wallet onboarding        | `onboarding-import-wallet.ts`                                    |
| `userJourneyOnboardingNew`     | New wallet onboarding           | `onboarding-new-wallet.ts`                                       |
| `userJourneyAssets`            | Asset detail page loads         | `asset-details.ts`, `solana-asset-details.ts`                    |
| `userJourneyAccountManagement` | Login from home (import SRP)    | `import-srp-home.ts`                                             |
| `userJourneyTransactions`      | Send and swap transaction flows | `send-transactions.ts`, `swap.ts`                                |
| `pageLoadBenchmark`            | Playwright dapp page load       | `page-load-benchmark.spec.ts`                                    |
| `all`                          | All benchmarks                  | Everything above                                                 |

### User journey benchmarks: browserify vs webpack

- **PRs:** User journey benchmarks run on **Chrome + Browserify** only.
- **Push to main/release:** User journey benchmarks also run on **Chrome + Webpack** (separate `benchmarks-webpack-perf` job) so we can compare build systems before releasing webpack to production.

### Special CI Requirements

| Preset                         | Requirement                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------- |
| `userJourneyAccountManagement` | Requires `TEST_SRP_2` secret (12-word seed phrase). Set as a CI secret in GitHub. |

### 1. Create a new file in the appropriate subdirectory

Choose the category that best fits your benchmark:

- `startup/` - For measuring extension cold-start and page load times
- `interaction/` - For measuring single discrete user interaction timings
- `user-journey/` - For E2E multi-step user flows with multiple timers

### 2. Export a `run` function

Every benchmark must export a `run` function. The signature depends on the benchmark type:

#### TimerHelper API (for user journey benchmarks)

User journey benchmarks use the `TimerHelper` class to measure operations:

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

If your benchmark should run in CI, add its file path to the appropriate preset in `run-benchmark.ts`.

To create a **new** preset, update these locations:

1. `test/e2e/benchmarks/utils/constants.ts` — add a key to the relevant preset object (`USER_JOURNEY_PRESETS` for user journeys, `INTERACTION_PRESETS` for interactions, `STARTUP_PRESETS` for startup) or create a new one
2. `test/e2e/benchmarks/run-benchmark.ts` — add a `PRESETS` entry (using the constant key) mapping to benchmark file paths
3. `.github/workflows/run-benchmarks.yml` — add the preset to the CI matrix

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

Each benchmark entry becomes a **Sentry Structured Log** (`Sentry.logger.info`):

- **Message:** `<benchmarkType>.<presetName>` — e.g. `performance.userJourneyOnboardingImport`, `userAction.interactionUserActions`, `benchmark.startupStandardHome`
- **Attributes:**
  - `ci.branch`, `ci.commitHash`, `ci.prNumber` — Git/CI context
  - `ci.browser`, `ci.buildType` — e.g. `chrome` / `browserify`
  - `ci.persona` — `standard` or `powerUser`
  - `ci.testTitle` — human-readable test name from the benchmark file
  - Metric values, namespaced by stat type:
    - Statistical benchmarks (startup / user journey): `<type>.mean.<metric>`, `<type>.p75.<metric>`, `<type>.p95.<metric>` — e.g. `performance.mean.uiStartup`
    - Interaction benchmarks: flat numeric keys — e.g. `loadNewAccount`, `confirmTx`

Example Sentry log for a startup benchmark:

```
message:    "benchmark.startupStandardHome"
attributes: {
  "ci.branch":      "main",
  "ci.commitHash":  "abc1234",
  "ci.browser":     "chrome",
  "ci.buildType":   "browserify",
  "ci.persona":     "standard",
  "ci.testTitle":   "benchmark-standard-home",
  "benchmark.mean.uiStartup":          1443,
  "benchmark.mean.backgroundConnect":  210,
  "benchmark.p75.uiStartup":           1530,
  "benchmark.p95.uiStartup":           1620
}
```
