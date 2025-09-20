## Specs

### Existing context
**PageLoadBenchmark Class** -- test/e2e/page-objects/benchmark/page-load-benchmark.ts
 * Main class for conducting page load performance benchmarks using Playwright.
 * Manages browser lifecycle, extension loading, and performance measurement collection.

**TestDapp Page Object Class** -- test/e2e/page-objects/pages/test-dapp.ts
 * Abstraction class used in Selenium based e2e tests for interacting with the test dapp UI
 * Should be used as a guide to how interaction with the test dapp UI works, direct compatibility with Playwright might not be possible

**Page Load Benchmark Spec*** -- test/e2e/playwright/benchmark/page-load-benchmark.spec.ts
 * Existing spec for page load benchmark
 * Can be used as guideline on how to implement the new desired flow

**Dapp Transaction Proposal Benchmark Spec** -- test/e2e/playwright/benchmark/dapp-transaction-proposal-benchmark.spec.ts
 * Incomplete spec file created to house the new Spec

**Page Load Benchmark Workflow config** -- .github/workflows/page-load-benchmark-pr.yml
 * YML config file for the github workflow responsible for running the existing page load benchmark

**Page Load Benchmark Data Upload Workflow config** -- .github/workflows/page-load-benchmark-upload.yml
 * YML config file for the github workflow responsible for upload data gathered from page load benchmark workflow

### Desired output
- Prototype an automated benchmark to measure the time from when a dapp proposes a transaction to when the MetaMask extension UI is fully visible and interactive.
- Use existing **PageLoadBenchmark Class** abstraction to house the flow for this.
- Set up the test dapp server, and interact with the page to trigger transaction proposal (for example, Sign Typed Data V4, needs to Request Permissions beforehand)
- Capture timestamps for:
  - Proposal initiation
  - Wallet UI fully loaded/interactive
    - Run N iterations, log averages and raw data
    - Document method, variance, and recommendations for CI integration

### Acceptance Criteria
- Script runs locally and outputs benchmark data for N runs
- Measurement method is documented and reproducible

