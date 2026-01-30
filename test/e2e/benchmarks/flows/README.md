# Benchmark Flows

This directory contains all benchmark implementations organized by category.

### Running Benchmarks

```bash
# Run a specific benchmark by file path, default is 10 iterations
yarn test:e2e:benchmark test/e2e/benchmarks/flows/performance/onboarding-import-wallet.ts

# Run a preset (group of benchmarks)
yarn test:e2e:benchmark --preset performanceOnboarding

# Run all benchmarks
yarn test:e2e:benchmark

# Run with custom iterations and retries
yarn test:e2e:benchmark --preset userActions --iterations 5 --retries 3

# Run multiple presets
yarn test:e2e:benchmark --preset performanceAssets --preset performanceLogin

# Save results to file
yarn test:e2e:benchmark --preset performanceOnboarding --out results.json
```

### Available Presets

| Preset                  | Description               | Benchmarks                                                       |
| ----------------------- | ------------------------- | ---------------------------------------------------------------- |
| `standardHome`          | Standard user page load   | `standard-home.ts`                                               |
| `powerUserHome`         | Power user page load      | `power-user-home.ts`                                             |
| `userActions`           | User interaction timings  | `load-new-account.ts`, `confirm-tx.ts`, `bridge-user-actions.ts` |
| `performanceOnboarding` | Onboarding flows          | `onboarding-import-wallet.ts`, `onboarding-new-wallet.ts`        |
| `performanceAssets`     | Asset detail page loads   | `asset-details.ts`, `solana-asset-details.ts`                    |
| `performanceLogin`      | Login & transaction flows | `import-srp-home.ts`, `send-transactions.ts`, `swap.ts`          |
| `pageLoadBenchmark`     | Playwright benchmarks     | `page-load-benchmark.spec.ts`                                    |
| `all`                   | All benchmarks            | Everything above                                                 |

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
  id: string,             // camelCase identifier (e.g., 'assetClickToPriceChartLoaded')
  threshold?: number      // Optional: Expected time in ms (10% margin applied, 1.5x in CI)
);

// Measure method - wraps async action
await timer.measure(async () => {
  // Your async actions to measure
  await page.load();
  await element.click();
});
```

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
  "onboarding-import-wallet": {
    "timers": [
      { "id": "importWalletToSocialScreen", "duration": 209 },
      { "id": "srpButtonToForm", "duration": 53 }
    ],
    "success": true
  }
}
```

Results are sent to Sentry in CI via `send-to-sentry.ts` for monitoring and analysis.
Format: TODO
