/**
 * Historical data fetch and aggregation for UI startup benchmarks.
 *
 * Retrieves benchmark data from MetaMask/extension_benchmark_stats
 * and aggregates it into a mean-of-means reference for PR comment comparisons.
 */
import type { BenchmarkResults } from '../../test/e2e/benchmarks/utils/types';

const STATS_REPO_BASE =
  'https://raw.githubusercontent.com/MetaMask/extension_benchmark_stats/main/stats';

/**
 * All presets in ui_startup_data.json share the same nested shape:
 * preset name → benchmark name → benchmark result.
 *
 * - pageLoad:         { "standardHome": { "mean": {...} }, "powerUserHome": { "mean": {...} } }
 * - userActions:      { "loadNewAccount": { "mean": {...} }, "confirmTx": { "mean": {...} } }
 * - performance*:     { "signTypedData": { "mean": {...} }, ... }
 */
type NestedPresetEntry = Record<string, Partial<BenchmarkResults>>;

type HistoricalCommitEntry = {
  timestamp: number;
  presets: Record<string, NestedPresetEntry>;
};

export type HistoricalUiStartupFile = Record<string, HistoricalCommitEntry>;

export type HistoricalMeanReference = Record<string, Record<string, number>>;

// Must specify ?ref=main explicitly — the stats repo's default branch is gh-pages,
// so an unqualified API call would list gh-pages content instead of main.
const STATS_REPO_API =
  'https://api.github.com/repos/MetaMask/extension_benchmark_stats/contents/stats?ref=main';

// --- Fetch & Aggregate ---

/**
 * Sanitizes a branch name for use as a URL path segment.
 * Mirrors the sed transform in benchmark-stats-commit.sh:
 *   "release/12.x" → "release-12.x", "main" → "main"
 *
 * @param branch - Raw branch name.
 * @returns URL-safe branch slug.
 */
function sanitizeBranch(branch: string): string {
  return branch.replace(/\//g, '-');
}

/**
 * Fetches and parses ui_startup_data.json for a given sanitized branch slug.
 * Returns null if the file does not exist or cannot be parsed.
 *
 * @param safeBranch - Sanitized branch name (e.g. "release-12.5.0").
 * @returns Parsed file contents or null.
 */
async function fetchUiStartupFile(
  safeBranch: string,
): Promise<HistoricalUiStartupFile | null> {
  try {
    const response = await fetch(
      `${STATS_REPO_BASE}/${safeBranch}/ui_startup_data.json`,
    );
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as HistoricalUiStartupFile;
  } catch {
    return null;
  }
}

/**
 * Lists all release branch slugs stored in extension_benchmark_stats,
 * sorted descending by semantic version (latest first).
 * Returns slugs in their sanitized form (e.g. "release-12.5.0").
 */
async function listReleaseBranchesByVersion(): Promise<string[]> {
  try {
    const response = await fetch(STATS_REPO_API, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (!response.ok) {
      return [];
    }
    const items = (await response.json()) as { name: string; type: string }[];

    const releaseDirs = items
      .filter((item) => item.type === 'dir' && item.name.startsWith('release-'))
      .map((item) => item.name);

    releaseDirs.sort((a, b) => {
      const parse = (s: string) =>
        s.replace(/^release-/, '').split('.').map(Number);
      const av = parse(a);
      const bv = parse(b);
      for (let i = 0; i < Math.max(av.length, bv.length); i++) {
        const diff = (bv[i] ?? 0) - (av[i] ?? 0);
        if (diff !== 0) {
          return diff;
        }
      }
      return 0;
    });

    return releaseDirs;
  } catch {
    return [];
  }
}

/**
 * Fetches historical UI startup data from extension_benchmark_stats,
 * always resolving to the latest release branch that has data.
 *
 * Strategy (in order):
 *  1. Try the current PR target branch (GITHUB_BASE_REF).
 *  2. If no data yet (e.g. newly cut release branch), walk release branches
 *     in descending semver order and use the first one that has data.
 *  3. Return null if nothing is found.
 *
 * This ensures every PR compares against the most recently released baseline,
 * even on a brand-new release branch with no history yet.
 *
 * @param baseBranch - PR target branch (e.g. "release/12.6.0").
 *                     Defaults to GITHUB_BASE_REF, falling back to "main".
 * @returns Reference map (benchmarkName → metric → mean), or null if unavailable.
 */
export async function fetchHistoricalUiStartupData(
  baseBranch: string = process.env.GITHUB_BASE_REF ?? 'main',
): Promise<HistoricalMeanReference | null> {
  const safeBranch = sanitizeBranch(baseBranch);

  // 1. Try the target branch first
  const currentData = await fetchUiStartupFile(safeBranch);
  if (currentData && Object.keys(currentData).length > 0) {
    console.log(`Using historical data from branch "${baseBranch}"`);
    console.log(`[DEBUG] Fetched commits: ${Object.keys(currentData).join(', ')}`);
    console.log(`[DEBUG] Raw data: ${JSON.stringify(currentData, null, 2)}`);
    return aggregateHistoricalData(currentData);
  }

  // 2. No data on this branch yet — find the latest release branch with data
  console.log(
    `No historical data for "${baseBranch}", searching for latest release branch...`,
  );
  const releaseBranches = await listReleaseBranchesByVersion();

  for (const branch of releaseBranches) {
    if (branch === safeBranch) {
      continue; // already tried
    }
    const data = await fetchUiStartupFile(branch);
    if (data && Object.keys(data).length > 0) {
      console.log(`Falling back to historical data from "${branch}"`);
      console.log(`[DEBUG] Fetched commits: ${Object.keys(data).join(', ')}`);
      console.log(`[DEBUG] Raw data: ${JSON.stringify(data, null, 2)}`);
      return aggregateHistoricalData(data);
    }
  }

  console.warn('No historical UI startup data found in any release branch.');
  return null;
}

/**
 * Collects metric values from a single benchmark result into the accumulator.
 *
 * @param benchmarkName - Key to accumulate under.
 * @param result - The benchmark entry to read from.
 * @param collected - Mutable accumulator map.
 */
function collectMetrics(
  benchmarkName: string,
  result: Partial<BenchmarkResults>,
  collected: Record<string, Record<string, number[]>>,
): void {
  if (!result.mean || typeof result.mean !== 'object') {
    return;
  }

  if (!collected[benchmarkName]) {
    collected[benchmarkName] = {};
  }

  for (const [metricName, metricValue] of Object.entries(result.mean)) {
    const numValue =
      typeof metricValue === 'number'
        ? metricValue
        : parseFloat(String(metricValue));

    if (isNaN(numValue)) {
      continue;
    }

    if (!collected[benchmarkName][metricName]) {
      collected[benchmarkName][metricName] = [];
    }
    collected[benchmarkName][metricName].push(numValue);
    console.log(`[DEBUG] Collected ${benchmarkName}.${metricName} = ${numValue}`);
  }
}

/**
 * Aggregates historical benchmark data from the last N commits
 * into a single mean-of-means reference keyed by benchmark name and metric.
 *
 * All presets share the same nested shape (preset → benchmarkName → result),
 * so each child benchmark is collected directly by its name regardless of
 * which preset group it belongs to.
 *
 * Also handles both numeric and string-encoded metric values.
 *
 * @param data - Full historical data file contents.
 * @returns Aggregated reference map.
 */
export function aggregateHistoricalData(
  data: HistoricalUiStartupFile,
): HistoricalMeanReference {
  // Each benchmark run already samples 5–100 times and computes its own mean/stdDev,
  // so a single commit's data is statistically sufficient as a baseline.
  const commitHashes = Object.keys(data).reverse();
  const latestCommits = commitHashes.slice(0, 1);

  console.log(
    `Aggregating UI startup data from ${latestCommits.length} commits: ${latestCommits.join(', ')}`,
  );

  const collected: Record<string, Record<string, number[]>> = {};

  for (const hash of latestCommits) {
    const commitData = data[hash];
    if (!commitData?.presets) {
      continue;
    }

    for (const presetEntry of Object.values(commitData.presets)) {
      for (const [benchmarkName, result] of Object.entries(presetEntry)) {
        collectMetrics(benchmarkName, result, collected);
      }
    }
  }

  // Average collected values into the reference map
  const reference: HistoricalMeanReference = {};

  for (const [name, metrics] of Object.entries(collected)) {
    reference[name] = {};
    for (const [metric, values] of Object.entries(metrics)) {
      reference[name][metric] =
        values.reduce((sum, v) => sum + v, 0) / values.length;
    }
  }

  return reference;
}
