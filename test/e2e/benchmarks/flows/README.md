# Benchmark Flows

This directory contains all benchmark implementations organized by category.

## Design Principles

### Entry Points vs Implementations

- **Entry points** (`benchmark.ts`, `user-actions-benchmark.ts`, `performance-benchmark.ts`, etc):
  - Handle CLI argument parsing
  - Orchestrate benchmark execution
  - Output results to file or stdout
  - Should be thin wrappers that delegate to flow implementations

- **Flow implementations** (files in this directory):
  - Contain the actual benchmark logic
  - Export a `Benchmark` object with `testTitle`, `persona`, and `run` function
  - Are responsible for timing specific operations
  - Should be self-contained and reusable

### Writing New Benchmarks

1. Create a new file in the appropriate subdirectory
2. Export a `Benchmark` object with:
   - `testTitle`: Unique identifier for Sentry logging (e.g., `'benchmark-onboarding-import-wallet'`)
   - `persona`: User persona type (`BENCHMARK_PERSONA.STANDARD` or `BENCHMARK_PERSONA.POWER_USER`)
   - `run`: Async function that returns `Promise<BenchmarkRunResult>`
3. Use the `TimerResult` type to record timing data
4. Handle errors gracefully and return `{ success: false, error }` on failure
5. Register your benchmark in the entry point file
