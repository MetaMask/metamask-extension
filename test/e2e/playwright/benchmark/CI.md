# Page Load Benchmark CI Process

This document outlines the implementation plan for tracking page load benchmark performance over time, similar to the existing bundle size tracking system.

## Overview

The goal is to implement a CI pipeline that:

1. **On main branch commits**: Runs page load benchmarks and saves results to a shared repository
2. **On pull requests**: Runs benchmarks, compares against baseline, and posts results to PR comments
3. **Fails PR checks**: If performance regressions exceed acceptable thresholds

## Current Bundle Size Tracking Process (Reference)

The existing bundle size tracking system works as follows:

### 1. Bundle Size Measurement (`test/e2e/mv3-perf-stats/bundle-size.ts`)

- Measures the size of background, UI, and common bundle files
- Outputs JSON with bundle sizes and file lists
- Can output to file or stdout

### 2. Main Branch Pipeline (`.github/workflows/main.yml`)

- Runs on every commit to main
- Executes: `yarn tsx test/e2e/mv3-perf-stats/bundle-size.ts --out test-artifacts/chrome`
- Calls: `./.github/scripts/bundle-stats-commit.sh` to save results

### 3. Bundle Stats Commit Script (`.github/scripts/bundle-stats-commit.sh`)

- Clones the `MetaMask/extension_bundlesize_stats` repository
- Appends new bundle size data to `stats/bundle_size_data.json`
- Commits and pushes the updated data
- Uses `EXTENSION_BUNDLESIZE_STATS_TOKEN` for authentication

### 4. PR Comparison (`.github/workflows/publish-prerelease.yml`)

- Runs on PR creation/updates
- Fetches baseline data from the shared repository
- Compares current bundle sizes against merge base
- Posts results via `development/metamaskbot-build-announce.ts`

## Proposed Page Load Benchmark Process

### 1. Benchmark Runner Script (`test/e2e/playwright/benchmark/run-benchmark.ts`)

Create a new script that:

- Runs the existing `page-load-benchmark.spec.ts` test
- Outputs results in a standardized JSON format
- Can be run from command line with configurable parameters

```typescript
// Example structure
type BenchmarkOutput = {
  timestamp: string;
  commit: string;
  summary: BenchmarkSummary[];
  rawResults: BenchmarkResult[];
};
```

### 2. Main Branch Pipeline Integration

Add to `.github/workflows/main.yml`:

```yaml
- name: Run page load benchmarks
  if: ${{ env.BRANCH == 'main' && env.IS_FORK == 'false'}}
  run: yarn tsx test/e2e/playwright/benchmark/run-benchmark.ts --out test-artifacts/benchmarks

- name: Record benchmark results at commit
  if: ${{ env.BRANCH == 'main' && env.IS_FORK == 'false'}}
  run: ./.github/scripts/benchmark-stats-commit.sh
```

### 3. Benchmark Stats Commit Script (`.github/scripts/benchmark-stats-commit.sh`)

Similar to `bundle-stats-commit.sh`:

- Clone a new repository: `MetaMask/extension_benchmark_stats`
- Save benchmark results to `stats/page_load_data.json`
- Commit and push with commit SHA as key

### 4. PR Benchmark Comparison

#### A. New Workflow (`.github/workflows/benchmark-pr.yml`)

```yaml
name: Benchmark PR Performance

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  benchmark-pr:
    runs-on: ubuntu-latest
    steps:
      - name: Run benchmarks
        run: yarn tsx test/e2e/playwright/benchmark/run-benchmark.ts --out test-artifacts/benchmarks

      - name: Compare and comment
        run: yarn tsx development/benchmark-pr-comment.ts
        env:
          PR_COMMENT_TOKEN: ${{ secrets.PR_COMMENT_TOKEN }}
```

#### B. PR Comment Script (`development/benchmark-pr-comment.ts`)

Similar to `metamaskbot-build-announce.ts`:

- Fetch baseline data from shared repository
- Compare current results against merge base
- Calculate percentage changes
- Post formatted results to PR
- Fail if regressions exceed thresholds

### 5. Shared Repository Structure

Create `MetaMask/extension_benchmark_stats`:

```
stats/
  page_load_data.json  # { commit_sha: benchmark_results }
  config.json          # Thresholds and configuration
```

## Implementation Steps

### Phase 1: Infrastructure Setup

1. Create `MetaMask/extension_benchmark_stats` repository
2. Set up `EXTENSION_BENCHMARK_STATS_TOKEN` secret
3. Create `test/e2e/playwright/benchmark/run-benchmark.ts`
4. Create `.github/scripts/benchmark-stats-commit.sh`

### Phase 2: Main Branch Integration

1. Add benchmark step to main workflow
2. Test the commit script with a test commit
3. Verify data is being saved correctly

### Phase 3: PR Comparison

1. Create `development/benchmark-pr-comment.ts`
2. Create `.github/workflows/benchmark-pr.yml`
3. Test PR comment functionality

### Phase 4: Threshold Enforcement

1. Define performance thresholds in shared repository
2. Implement failure logic in PR workflow
3. Test threshold enforcement

## Configuration and Thresholds

### Threshold Configuration (`stats/config.json`)

```json
{
  "baseline": {
    "commit": "latest_main_commit",
    "date": "2024-01-01T00:00:00Z"
  },
  "thresholds": {
    "pageLoadTime": {
      "warning": 10, // 10% increase triggers warning
      "failure": 25 // 25% increase fails PR
    },
    "firstContentfulPaint": {
      "warning": 15,
      "failure": 30
    },
    "largestContentfulPaint": {
      "warning": 20,
      "failure": 40
    }
  }
}
```

### First Iteration Handling

For the first iteration when no baseline exists:

1. **Main branch**: Save results as baseline (no comparison)
2. **PR workflow**:
   - If no baseline exists, post results without comparison
   - Add note: "No baseline available for comparison"
   - Don't fail the check
   - Set the current results as the new baseline for future comparisons

## Data Format

### Benchmark Results Structure

```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "commit": "abc1234",
  "summary": [
    {
      "page": "https://metamask.github.io/test-dapp/",
      "samples": 100,
      "mean": {
        "pageLoadTime": 1250,
        "firstContentfulPaint": 850,
        "largestContentfulPaint": 1200
      },
      "p95": {
        "pageLoadTime": 1500,
        "firstContentfulPaint": 1000,
        "largestContentfulPaint": 1400
      },
      "standardDeviation": {
        "pageLoadTime": 150,
        "firstContentfulPaint": 100,
        "largestContentfulPaint": 120
      }
    }
  ],
  "rawResults": [...]
}
```

## PR Comment Format

Example PR comment structure:

```
## 📊 Page Load Benchmark Results

### Summary
- **Page Load Time**: 1,250ms (±150ms) - 🟢 **-5.2%** vs baseline
- **First Contentful Paint**: 850ms (±100ms) - 🟡 **+12.3%** vs baseline
- **Largest Contentful Paint**: 1,200ms (±120ms) - 🟢 **-8.1%** vs baseline

### Detailed Results
<details>
<summary>Performance Metrics</summary>

| Metric | Current | Baseline | Change | Status |
|--------|---------|----------|--------|--------|
| Page Load Time | 1,250ms | 1,320ms | -5.2% | ✅ |
| First Contentful Paint | 850ms | 757ms | +12.3% | ⚠️ |
| Largest Contentful Paint | 1,200ms | 1,305ms | -8.1% | ✅ |

</details>

**Note**: Results based on 100 samples per metric.
```

## Error Handling

1. **Benchmark failures**: Log error, don't fail the entire workflow
2. **Missing baseline**: Post results without comparison, don't fail
3. **Network issues**: Retry logic for fetching baseline data
4. **Invalid data**: Validate JSON structure before processing

## Future Enhancements

1. **Historical trends**: Add charts/graphs to PR comments
2. **Multiple environments**: Test against different test dapps
3. **Regression alerts**: Slack/email notifications for significant regressions
4. **Performance budgets**: Enforce stricter limits for critical metrics
5. **Automated rollback**: Auto-revert commits that cause severe regressions
