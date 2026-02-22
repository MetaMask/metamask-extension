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
