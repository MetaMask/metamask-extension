/**
 * Shared benchmark configuration constants.
 * These are the single source of truth consumed by:
 * - test/e2e/benchmarks/  (benchmark runner)
 * - development/metamaskbot-build-announce/  (PR comment builder)
 * - .github/workflows/run-benchmarks.yml  (CI matrix — must be updated manually)
 */
export const BENCHMARK_PLATFORMS = {
  CHROME: 'chrome',
  FIREFOX: 'firefox',
} as const;

export const BENCHMARK_BUILD_TYPES = {
  BROWSERIFY: 'browserify',
  WEBPACK: 'webpack',
} as const;

/**
 * Platform and build-type combinations for which entry benchmarks
 * (interaction & user journey) are currently collected.
 * Extend these arrays here to automatically include more combos in
 * both the PR comment builder and the benchmark gate checks.
 */
export const ENTRY_BENCHMARK_PLATFORMS: readonly (typeof BENCHMARK_PLATFORMS)[keyof typeof BENCHMARK_PLATFORMS][] =
  [BENCHMARK_PLATFORMS.CHROME];

export const ENTRY_BENCHMARK_BUILD_TYPES: readonly (typeof BENCHMARK_BUILD_TYPES)[keyof typeof BENCHMARK_BUILD_TYPES][] =
  [BENCHMARK_BUILD_TYPES.BROWSERIFY];
