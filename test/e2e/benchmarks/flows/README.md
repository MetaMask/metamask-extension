# Benchmark Flows

This directory contains all benchmark implementations organized by category.

## Summary of Changes

Previously, benchmarks had multiple entry points:

- `yarn tsx test/e2e/benchmarks/benchmark.ts` (page load)
- `yarn tsx test/e2e/benchmarks/user-actions-benchmark.ts` (user actions)
- `yarn tsx test/e2e/benchmarks/performance-benchmark.ts` (performance flows)
- `yarn test:e2e:benchmark:performance` (package.json script)

This structure made sense when the list was short, but as more teams add flow benchmarks, having multiple entry points becomes confusing and hard to maintain.

**What changed:**

- ✅ **Single entry point**: All benchmarks now run through `run-benchmark.ts`
- ✅ **File-based execution**: Run any benchmark by specifying its file path
- ✅ **Presets for CI**: Groups of benchmarks defined in code, not scattered across scripts
- ✅ **TypeScript decides**: The runner auto-detects benchmark type (performance, page-load, user-actions, Playwright) and handles execution appropriately
- ✅ **Simplified CLI**: One command (`yarn test:e2e:benchmark`) to rule them all

**Deleted files:**

- `benchmark.ts` → logic moved to `flows/page-load/*.ts`
- `user-actions-benchmark.ts` → logic moved to `flows/user-actions/*.ts`
- `performance-benchmark.ts` → logic moved to `flows/performance/*.ts`

## Unified Entry Point

All benchmarks are run through a single entry point: `test/e2e/benchmarks/run-benchmark.ts`

### Running Benchmarks

```bash
# Run a specific benchmark by file path, default is 10 iterarions
yarn test:e2e:benchmark test/e2e/benchmarks/flows/performance/onboarding-import-wallet.ts

# Run a preset (group of benchmarks)
yarn test:e2e:benchmark --preset performance-onboarding

# Run all benchmarks
yarn test:e2e:benchmark

# Run with options
yarn test:e2e:benchmark --preset user-actions --iterations 5 --retries 3
```

### Available Presets

| Preset                   | Description              | Benchmarks                                                       |
| ------------------------ | ------------------------ | ---------------------------------------------------------------- |
| `standard-home`          | Standard user page load  | `standard-home.ts`                                               |
| `power-user-home`        | Power user page load     | `power-user-home.ts`                                             |
| `user-actions`           | User interaction timings | `load-new-account.ts`, `confirm-tx.ts`, `bridge-user-actions.ts` |
| `performance-onboarding` | Onboarding flows         | `onboarding-import-wallet.ts`, `onboarding-new-wallet.ts`        |
| `performance-assets`     | Asset page loads         | `asset-details.ts`, `solana-asset-details.ts`                    |
| `playwright-page-load`   | Playwright benchmarks    | `page-load-benchmark.spec.ts`                                    |
| `all`                    | All benchmarks           | Everything above                                                 |

## Writing New Benchmarks

### 1. Create a new file in the appropriate subdirectory

Choose the category that best fits your benchmark:

- `page-load/` - For measuring page load times
- `user-actions/` - For measuring user interaction timings
- `performance/` - For E2E performance flows with multiple timers

### 2. Export a `run` function

Every benchmark must export a `run` function. The signature depends on the benchmark type:

**Performance benchmarks** (return `BenchmarkRunResult`):

```typescript
import type { BenchmarkRunResult } from '../../utils/types';

export async function run(): Promise<BenchmarkRunResult> {
  // Use Timers to measure specific operations
  const timer = Timers.createTimer('operation_name');
  timer.startTimer();
  // ... do work ...
  timer.stopTimer();

  return { timers: collectTimerResults(), success: true };
}
```

**Page load benchmarks** (accept options, return results):

```typescript
export async function run(options: {
  browserLoads: number;
  pageLoads: number;
  retries: number;
}): Promise<BenchmarkResults> {
  // ... benchmark logic ...
}
```

**User action benchmarks** (return `UserActionResult`):

```typescript
import type { UserActionResult } from '../../utils/types';

export async function run(): Promise<UserActionResult> {
  // ... benchmark logic ...
  return { actionName: timingMs, ... };
}
```

### 3. Add to a preset (optional)

If your benchmark should run in CI, add its file path to the appropriate preset in `run-benchmark.ts`:

```typescript
const CI_PRESETS: Record<string, string[]> = {
  'my-preset': ['test/e2e/benchmarks/flows/category/my-benchmark.ts'],
  // ...
};
```

### 4. Handle errors gracefully

Return `{ success: false, error }` on failure instead of throwing:

```typescript
try {
  // ... benchmark logic ...
  return { timers: collectTimerResults(), success: true };
} catch (error) {
  return {
    timers: collectTimerResults(),
    success: false,
    error: error instanceof Error ? error.message : String(error),
  };
}
```

## Output Format

Benchmark results are output as JSON, either to stdout or to a file via `--out`:

```json
{
  "onboarding-import-wallet": {
    "timers": [
      { "id": "import_wallet_to_social_screen", "duration": 209 },
      { "id": "srp_button_to_form", "duration": 53 }
    ],
    "success": true
  }
}
```

Results are sent to Sentry in CI via `send-to-sentry.ts` for monitoring and analysis.
Format: TODO
