/**
 * Historical data fetch and aggregation for performance benchmarks.
 *
 * Retrieves benchmark data from MetaMask/extension_benchmark_stats
 * and aggregates it into a mean-of-means reference for PR comment comparisons.
 */
import type {
  BenchmarkResults,
  HistoricalBaselineMetrics,
} from '../../shared/constants/benchmarks';

const STATS_REPO_BASE =
  'https://raw.githubusercontent.com/MetaMask/extension_benchmark_stats/main/stats';

/**
 * All presets in performance_data.json share the same nested shape:
 * preset name → benchmark name → benchmark result.
 *
 * - startupStandardHome:        { "uiStartup": { "mean": {...} }, ... }
 * - startupPowerUserHome:       { "uiStartup": { "mean": {...} }, ... }
 * - interactionUserActions:     { "loadNewAccount": { "mean": {...} }, "confirmTx": { "mean": {...} } }
 * - userJourneyAssets:          { "assetClickToPriceChart": { "mean": {...} }, ... }
 * - pageLoad (legacy group):    { "chrome-browserify-standardHome": { "mean": {...} }, ... }
 */
type NestedPresetEntry = Record<string, Partial<BenchmarkResults>>;

type HistoricalCommitEntry = {
  timestamp: number;
  presets: Record<string, NestedPresetEntry>;
};

export type HistoricalPerformanceFile = Record<string, HistoricalCommitEntry>;

export type HistoricalBaselineReference = Record<
  string,
  Record<string, HistoricalBaselineMetrics>
>;

// Must specify ?ref=main explicitly — the stats repo's default branch is gh-pages,
// so an unqualified API call would list gh-pages content instead of main.
const STATS_REPO_API =
  'https://api.github.com/repos/MetaMask/extension_benchmark_stats/contents/stats?ref=main';

/**
 * Sanitizes a branch name for use as a URL path segment.
 * Mirrors the sed transform in benchmark-stats-commit.sh:
 * "release/12.x" → "release-12.x", "main" → "main"
 *
 * @param branch - Raw branch name.
 * @returns URL-safe branch slug.
 */
function sanitizeBranch(branch: string): string {
  return branch.replace(/\//gu, '-');
}

/**
 * Fetches and parses performance_data.json for a given sanitized branch slug.
 * Returns null if the file does not exist or cannot be parsed.
 *
 * @param safeBranch - Sanitized branch name (e.g. "release-12.5.0").
 * @returns Parsed file contents or null.
 */
async function fetchPerformanceFile(
  safeBranch: string,
): Promise<HistoricalPerformanceFile | null> {
  try {
    const response = await fetch(
      `${STATS_REPO_BASE}/${safeBranch}/performance_data.json`,
    );
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as HistoricalPerformanceFile;
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
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }
    const response = await fetch(STATS_REPO_API, { headers });
    if (!response.ok) {
      return [];
    }
    const items = (await response.json()) as { name: string; type: string }[];

    const releaseDirs = items
      .filter((item) => item.type === 'dir' && item.name.startsWith('release-'))
      .map((item) => item.name);

    releaseDirs.sort((a, b) => {
      const parse = (s: string) =>
        s
          .replace(/^release-/u, '')
          .split('.')
          .map(Number);
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
 * Fetches historical performance data from extension_benchmark_stats,
 * always resolving to the latest release branch that has data.
 *
 * Strategy (in order):
 * 1. Try the current PR target branch (GITHUB_BASE_REF).
 * 2. If no data yet (e.g. newly cut release branch), walk release branches
 * in descending semver order and use the first one that has data.
 * 3. Return null if nothing is found.
 *
 * This ensures every PR compares against the most recently released baseline,
 * even on a brand-new release branch with no history yet.
 *
 * @param baseBranch - PR target branch (e.g. "release/12.6.0").
 * Defaults to GITHUB_BASE_REF, falling back to "main".
 * @returns Reference map (benchmarkName → metric → mean), or null if unavailable.
 */
export async function fetchHistoricalPerformanceData(
  baseBranch: string = process.env.GITHUB_BASE_REF || 'main',
): Promise<HistoricalBaselineReference | null> {
  const safeBranch = sanitizeBranch(baseBranch);

  // 1. Try the target branch first
  const currentData = await fetchPerformanceFile(safeBranch);
  if (currentData && Object.keys(currentData).length > 0) {
    const result = aggregateHistoricalData(currentData);
    if (Object.keys(result).length > 0) {
      return result;
    }
  }

  // 2. No data on this branch yet — find the latest release branch with data
  const releaseBranches = await listReleaseBranchesByVersion();

  for (const branch of releaseBranches) {
    if (branch === safeBranch) {
      continue;
    }
    const data = await fetchPerformanceFile(branch);
    if (data && Object.keys(data).length > 0) {
      const result = aggregateHistoricalData(data);
      if (Object.keys(result).length > 0) {
        return result;
      }
    }
  }

  return null;
}

/**
 * Collects metric values from a single benchmark result into the accumulator.
 *
 * @param benchmarkName - Key to accumulate under.
 * @param result - The benchmark entry to read from.
 * @param collected - Mutable accumulator map.
 */
type CollectedMetricValues = {
  [K in keyof HistoricalBaselineMetrics]: number[];
};

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value;
  }
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? undefined : parsed;
}

function collectMetrics(
  benchmarkName: string,
  result: Partial<BenchmarkResults>,
  collected: Record<string, Record<string, CollectedMetricValues>>,
): void {
  if (!result.mean || typeof result.mean !== 'object') {
    return;
  }

  if (!collected[benchmarkName]) {
    collected[benchmarkName] = {};
  }

  for (const metricName of Object.keys(result.mean)) {
    if (!collected[benchmarkName][metricName]) {
      collected[benchmarkName][metricName] = { mean: [], p75: [], p95: [] };
    }
    const bucket = collected[benchmarkName][metricName];

    const meanVal = toNumber(result.mean[metricName]);
    if (meanVal !== undefined) {
      bucket.mean.push(meanVal);
    }

    const p75Val = toNumber(result.p75?.[metricName]);
    if (p75Val !== undefined) {
      bucket.p75.push(p75Val);
    }

    const p95Val = toNumber(result.p95?.[metricName]);
    if (p95Val !== undefined) {
      bucket.p95.push(p95Val);
    }
  }
}

function average(values: number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Aggregates historical benchmark data from the most recent commit
 * into a baseline reference keyed by benchmark name and metric,
 * with mean, p75, and p95 values.
 *
 * @param data - Full historical data file contents.
 * @returns Aggregated reference map.
 */
export function aggregateHistoricalData(
  data: HistoricalPerformanceFile,
): HistoricalBaselineReference {
  const latestCommits = Object.keys(data)
    .filter((hash) => data[hash]?.timestamp)
    .sort((a, b) => data[b].timestamp - data[a].timestamp)
    .slice(0, 1);

  const collected: Record<string, Record<string, CollectedMetricValues>> = {};

  for (const hash of latestCommits) {
    const commitData = data[hash];
    if (!commitData?.presets) {
      continue;
    }

    for (const [presetName, presetEntry] of Object.entries(
      commitData.presets,
    )) {
      if (!presetEntry || typeof presetEntry !== 'object') {
        continue;
      }
      for (const [benchmarkName, result] of Object.entries(presetEntry)) {
        const key = `${presetName}/${benchmarkName}`;
        collectMetrics(key, result, collected);
      }
    }
  }

  const reference: HistoricalBaselineReference = {};

  for (const [name, metrics] of Object.entries(collected)) {
    reference[name] = {};
    for (const [metric, values] of Object.entries(metrics)) {
      // Skip metrics where we have no valid data (all NaN)
      if (values.mean.length === 0) {
        continue;
      }

      const meanVal = average(values.mean);
      // Skip if mean itself is NaN
      if (Number.isNaN(meanVal)) {
        continue;
      }

      if (values.p75.length === 0) {
        console.warn(
          `No p75 data for ${name}/${metric}, using mean as fallback`,
        );
      }
      if (values.p95.length === 0) {
        console.warn(
          `No p95 data for ${name}/${metric}, using mean as fallback`,
        );
      }

      reference[name][metric] = {
        mean: meanVal,
        p75: values.p75.length > 0 ? average(values.p75) : meanVal,
        p95: values.p95.length > 0 ? average(values.p95) : meanVal,
      };
    }
  }

  return reference;
}
