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
| `pageLoadBenchmark`            | Dapp page load (Playwright)     | `dapp-page-load/`                                                |
| `all`                          | All benchmarks                  | Everything above                                                 |

### User journey benchmarks: browserify vs webpack

- **PRs:** User journey benchmarks run on **Chrome + Browserify** only.
- **Push to main/release:** User journey benchmarks also run on **Chrome + Webpack** (extra `benchmarks` matrix rows with `mainOnly: true` in `run-benchmarks.yml`) so we can compare build systems before releasing webpack to production.

### Special CI Requirements

| Preset                         | Requirement                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------- |
| `userJourneyAccountManagement` | Requires `TEST_SRP_2` secret (12-word seed phrase). Set as a CI secret in GitHub. |

### Benchmark Categories and Types

Each benchmark belongs to a category and has a `BENCHMARK_TYPE`:

| Category           | Directory         | BENCHMARK_TYPE | Description                                               |
| ------------------ | ----------------- | -------------- | --------------------------------------------------------- |
| **Startup**        | `startup/`        | `BENCHMARK`    | Extension cold-start and initialization times             |
| **Interaction**    | `interaction/`    | `USER_ACTION`  | Single discrete user interaction timings                  |
| **User Journey**   | `user-journey/`   | `PERFORMANCE`  | Multi-step E2E user flows with multiple timers            |
| **Dapp Page Load** | `dapp-page-load/` | `PERFORMANCE`  | Playwright-based dapp page load metrics (Core Web Vitals) |

### 1. Create a new file in the appropriate subdirectory

Choose the category that best fits your benchmark:

- `startup/` - For measuring extension cold-start and page load times
- `interaction/` - For measuring single discrete user interaction timings
- `user-journey/` - For E2E multi-step user flows with multiple timers
- `dapp-page-load/` - For Playwright-based dapp page load benchmarks (Core Web Vitals); not a Selenium `run()` flow. The Playwright `benchmark` project sets `testDir` to this folder.

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

**Threshold Validation (mandatory):**

Every benchmark **must** have a threshold entry in `THRESHOLD_REGISTRY` inside `test/e2e/benchmarks/utils/constants.ts`. Thresholds are validated after collecting statistics from all iterations.

To add thresholds for a new benchmark:

1. Define a threshold config constant in `test/e2e/benchmarks/utils/constants.ts`
2. Add it to `BENCHMARK_THRESHOLDS` with a camelCase key matching the filename

```typescript
const MY_BENCHMARK: ThresholdConfig = {
  myTimerId: {
    p75: { warn: 1000, fail: 1500 },
    p95: { warn: 2000, fail: 3000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
};

// Add to BENCHMARK_THRESHOLDS:
const BENCHMARK_THRESHOLDS = {
  myBenchmark: MY_BENCHMARK, // camelCase key matching filename (my-benchmark.ts → myBenchmark)
};
```

The key must be **camelCase matching the filename**: `my-benchmark.ts` → `myBenchmark`.

For startup benchmarks, use the `startup` prefix: `standard-home.ts` → `startupStandardHome`.

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
