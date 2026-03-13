import startCase from 'lodash/startCase';
import {
  ENTRY_BENCHMARK_PLATFORMS,
  ENTRY_BENCHMARK_BUILD_TYPES,
  STAT_KEY,
} from '../../shared/constants/benchmarks';
import type {
  BenchmarkResults,
  ComparisonKey,
  StatisticalResult,
} from '../../shared/constants/benchmarks';
import {
  BENCHMARK_PERSONA,
  STARTUP_PRESETS,
  INTERACTION_PRESETS,
  USER_JOURNEY_PRESETS,
} from '../../test/e2e/benchmarks/utils/constants';
import type { HistoricalBaselineReference } from './historical-comparison';
import { fetchHistoricalPerformanceData } from './historical-comparison';
import {
  compareBenchmarkEntries,
  getTrafficLightIndication,
  formatDeltaPercent,
  COMPARISON_SEVERITY,
} from './comparison-utils';

/** A parsed benchmark entry with its name, preset, and the stats we render. */
export type BenchmarkEntry = {
  benchmarkName: string;
  /** The preset name this entry was fetched under (e.g. 'interactionUserActions'). */
  presetName: string;
  mean: StatisticalResult;
  min: StatisticalResult;
  max: StatisticalResult;
  stdDev: StatisticalResult;
  p75: StatisticalResult;
  p95: StatisticalResult;
};

/**
 * Fetches benchmark JSON artifact for a given preset/platform/buildType.
 * Returns null if the artifact doesn't exist (preset not run or failed).
 *
 * @param hostUrl - Base URL for CI artifacts.
 * @param platform - Browser platform (e.g. 'chrome', 'firefox').
 * @param buildType - Build type (e.g. 'browserify', 'webpack').
 * @param preset - Benchmark preset name.
 * @returns Parsed JSON or null.
 */
export async function fetchBenchmarkJson<
  Result = Record<string, BenchmarkResults>,
>(
  hostUrl: string,
  platform: string,
  buildType: string,
  preset: string,
): Promise<Result | null> {
  try {
    const url = `${hostUrl}/benchmarks/benchmark-${platform}-${buildType}-${preset}.json`;
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const data: Result = await response.json();
    return data;
  } catch {
    return null;
  }
}

/**
 * Extracts benchmark entries from a fetched JSON artifact.
 *
 * @param data - Raw parsed JSON from a benchmark artifact.
 * @param presetName - The preset name these entries were fetched under.
 * @returns Flat BenchmarkEntry array with only the fields we render.
 */
export function extractEntries(
  data: Record<string, BenchmarkResults>,
  presetName = '',
): BenchmarkEntry[] {
  return Object.entries(data)
    .filter(
      ([, raw]) =>
        raw?.mean !== undefined &&
        raw.mean !== null &&
        typeof raw.mean === 'object',
    )
    .map(([name, raw]) => ({
      benchmarkName: name,
      presetName,
      mean: raw.mean,
      min: raw.min,
      max: raw.max,
      stdDev: raw.stdDev,
      p75: raw.p75,
      p95: raw.p95,
    }));
}

export type FetchBenchmarkResult = {
  entries: BenchmarkEntry[];
  missingPresets: string[];
};

/**
 * Fetches and aggregates benchmark entries for a given set of presets.
 * Iterates all platform/buildType combos defined in ENTRY_BENCHMARK_PLATFORMS
 * and ENTRY_BENCHMARK_BUILD_TYPES (shared/constants/benchmarks.ts), so adding
 * a new target only requires updating those constants.
 *
 * Reports any preset/platform/buildType combos that returned no data.
 * @param hostUrl - Base URL for CI artifacts.
 * @param presets - Preset names to fetch (e.g. INTERACTION_PRESETS values).
 * @returns Entries and a list of missing preset descriptions.
 */
export async function fetchBenchmarkEntries(
  hostUrl: string,
  presets: string[],
): Promise<FetchBenchmarkResult> {
  const fetches = ENTRY_BENCHMARK_PLATFORMS.flatMap((platform) =>
    ENTRY_BENCHMARK_BUILD_TYPES.flatMap((buildType) =>
      presets.map(async (preset) => {
        const data = await fetchBenchmarkJson(
          hostUrl,
          platform,
          buildType,
          preset,
        );
        return { platform, buildType, preset, data };
      }),
    ),
  );

  const results = await Promise.all(fetches);

  const allEntries: BenchmarkEntry[] = [];
  const missingPresets: string[] = [];

  for (const { platform, buildType, preset, data } of results) {
    if (data) {
      allEntries.push(...extractEntries(data, preset));
    } else {
      missingPresets.push(`${platform}/${buildType}/${preset}`);
    }
  }

  return { entries: allEntries, missingPresets };
}

/**
 * Rounds a stat value for a given metric key, returning '-' if absent.
 *
 * @param stats - The stats record (e.g. entry.min).
 * @param metric - The metric key.
 * @returns Rounded string or '-'.
 */
function formatCellValue(stats: StatisticalResult, metric: string): string {
  const value = stats[metric];
  return typeof value === 'number' ? Math.round(value).toString() : '-';
}

/**
 * Resolves the historical baseline for a benchmark entry.
 *
 * Two key formats exist depending on preset type:
 * - Interaction / User Journey: stored as "{presetName}/{benchmarkName}"
 * e.g. "interactionUserActions/loadNewAccount"
 * - Startup (page-load): stored as "pageLoad/chrome-browserify-{presetName}"
 * e.g. "pageLoad/chrome-browserify-startupStandardHome"
 * → matched via a substring scan on presetName.
 *
 * @param baseline - Full historical reference map.
 * @param presetName - Preset name (e.g. 'startupStandardHome').
 * @param benchmarkName - Benchmark name (e.g. 'standardHome').
 * @returns Baseline metrics or undefined if not found.
 */
function resolveEntryBaseline(
  baseline: HistoricalBaselineReference,
  presetName: string,
  benchmarkName: string,
): HistoricalBaselineReference[string] | undefined {
  // TODO: Clean up can be done to only take 1 format in https://github.com/MetaMask/MetaMask-planning/issues/7106
  // Interaction / User Journey: direct qualified match.
  const qualified = `${presetName}/${benchmarkName}`;
  if (baseline[qualified]) {
    return baseline[qualified];
  }

  // Startup: stored as "pageLoad/chrome-browserify-{presetName}".
  // Guard against empty presetName — includes('') is always true.
  if (presetName) {
    const presetKey = Object.keys(baseline).find((k) => k.includes(presetName));
    if (presetKey) {
      return baseline[presetKey];
    }
  }

  return undefined;
}

/**
 * Builds a traffic-light indicator for a specific percentile comparison of a metric.
 * Returns '' when no baseline is available.
 * Neutral returns just the icon; non-neutral returns icon + delta %.
 * Regressions are downgraded to Warn (regression is reserved for the CI gate).
 *
 * @param entry - The benchmark entry.
 * @param metric - The metric key being rendered.
 * @param percentile - Which percentile to compare: 'mean' | 'p75' | 'p95'.
 * @param baselineMetrics - Resolved baseline for this entry (optional).
 * @returns Indicator string e.g. '🟢⬇️ -42%', '➡️', or '' if no baseline.
 */
function percentileCellIndicator(
  entry: BenchmarkEntry,
  metric: string,
  percentile: ComparisonKey,
  baselineMetrics: HistoricalBaselineReference[string] | undefined,
): string {
  if (!baselineMetrics?.[metric]) {
    return '';
  }

  const comparison = compareBenchmarkEntries(
    entry.benchmarkName,
    {
      testTitle: entry.benchmarkName,
      persona: BENCHMARK_PERSONA.STANDARD,
      mean: entry.mean,
      min: entry.min,
      max: entry.max,
      stdDev: entry.stdDev,
      p75: entry.p75,
      p95: entry.p95,
    },
    {}, // no absolute thresholds — informational only
    { [metric]: baselineMetrics[metric] },
  );

  const match = comparison.relativeMetrics.find(
    (m) => m.metric === metric && m.percentile === percentile,
  );
  if (!match) {
    return '';
  }

  // Downgrade Regression → Warn in the PR table.
  const severity =
    match.severity === COMPARISON_SEVERITY.Regression
      ? COMPARISON_SEVERITY.Warn
      : match.severity;

  const icon = getTrafficLightIndication(severity, match.direction);
  if (severity === COMPARISON_SEVERITY.Neutral) {
    return icon;
  }
  return `${icon} ${formatDeltaPercent(match.deltaPercent, match.direction)}`;
}

/**
 * Formats a stat cell by combining a value with a traffic-light indicator.
 * e.g. '🟢⬇️ -90% · 648 ms', '➡️ · 218 ms', or '218 ms' when no baseline.
 *
 * @param value - Rounded value string (e.g. '648') or '-'.
 * @param indicator - Indicator from percentileCellIndicator, or ''.
 * @returns Combined cell string.
 */
function statCellContent(value: string, indicator: string): string {
  if (value === '-') {
    return '-';
  }
  if (!indicator) {
    return `${value} ms`;
  }
  return `${indicator} · ${value} ms`;
}

/**
 * Returns true when the indicator string represents a noteworthy regression
 * (value increased, non-neutral). Used to populate the per-benchmark summary.
 * @param indicator
 */
function isRegressionIndicator(indicator: string): boolean {
  return indicator.startsWith('🟡⬆️') || indicator.startsWith('🔺');
}

/**
 * Returns true when the indicator string represents a significant improvement
 * (green downward). Used to populate the per-benchmark summary.
 * @param indicator
 */
function isSignificantImprovementIndicator(indicator: string): boolean {
  return indicator.startsWith('🟢⬇️') || indicator.startsWith('🔻');
}

/**
 * Builds table rows for a single benchmark entry in the 7-column format:
 * Metric | Mean (ms) | Min (ms) | Max (ms) | Std Dev (ms) | P75 (ms) | P95 (ms).
 *
 * Mean, Std Dev, P75, and P95 cells each show their own traffic-light indicator
 * when a baseline is available. Min and Max are raw extremes without comparison.
 * The 'total' metric row, when present, is ordered last and bolded.
 *
 * @param entry - A single benchmark entry.
 * @param baselineMetrics - Resolved baseline metrics for this entry (optional).
 * @returns Array of HTML table row strings.
 */
export function buildTableRows(
  entry: BenchmarkEntry,
  baselineMetrics?: HistoricalBaselineReference[string],
): string[] {
  const { mean, min, max, stdDev, p75, p95 } = entry;
  const metrics = Object.keys(mean);
  const nonTotalMetrics = metrics.filter((m) => m !== 'total');
  const orderedMetrics = [
    ...nonTotalMetrics,
    ...(metrics.includes('total') ? ['total'] : []),
  ];

  return orderedMetrics.map((metric) => {
    const isTotal = metric === 'total';
    const stepCell = isTotal ? `<b>total</b>` : metric;

    const meanInd = percentileCellIndicator(
      entry,
      metric,
      STAT_KEY.Mean,
      baselineMetrics,
    );
    const stdDevInd = percentileCellIndicator(
      entry,
      metric,
      STAT_KEY.StdDev,
      baselineMetrics,
    );
    const p75Ind = percentileCellIndicator(
      entry,
      metric,
      STAT_KEY.P75,
      baselineMetrics,
    );
    const p95Ind = percentileCellIndicator(
      entry,
      metric,
      STAT_KEY.P95,
      baselineMetrics,
    );

    const row =
      `<td>${stepCell}</td>` +
      `<td align="right">${statCellContent(formatCellValue(mean, metric), meanInd)}</td>` +
      `<td align="right">${formatCellValue(min, metric)}</td>` +
      `<td align="right">${formatCellValue(max, metric)}</td>` +
      `<td align="right">${statCellContent(formatCellValue(stdDev, metric), stdDevInd)}</td>` +
      `<td align="right">${statCellContent(formatCellValue(p75, metric), p75Ind)}</td>` +
      `<td align="right">${statCellContent(formatCellValue(p95, metric), p95Ind)}</td>`;
    return `<tr>${row}</tr>`;
  });
}

/**
 * Builds an h4-headed sub-section for a single benchmark entry.
 *
 * Structure: h4 header, optional regression/improvement summary paragraphs,
 * then a 7-column table (Metric | Mean | Min | Max | Std Dev | P75 | P95 ms)
 * where Mean, Std Dev, P75, and P95 each carry their own traffic-light indicator.
 *
 * @param entry - A single benchmark entry.
 * @param baseline - Optional historical baseline for traffic-light annotations.
 * @returns HTML string for this benchmark sub-section.
 */
function buildEntrySection(
  entry: BenchmarkEntry,
  baseline?: HistoricalBaselineReference,
): string {
  const { benchmarkName, presetName, mean } = entry;
  const baselineMetrics = baseline
    ? resolveEntryBaseline(baseline, presetName, benchmarkName)
    : undefined;

  const header = `<h4>${startCase(benchmarkName)}</h4>\n`;

  // Collect regressions/improvements from non-total metrics only.
  const nonTotalMetrics = Object.keys(mean).filter((m) => m !== 'total');
  const regressions: string[] = [];
  const improvements: string[] = [];
  // Summary uses P95 as the primary signal for regressions/improvements.
  for (const metric of nonTotalMetrics) {
    const ind = percentileCellIndicator(
      entry,
      metric,
      STAT_KEY.P95,
      baselineMetrics,
    );
    if (isRegressionIndicator(ind)) {
      regressions.push(`<code>${metric}</code> ${ind}`);
    } else if (isSignificantImprovementIndicator(ind)) {
      improvements.push(`<code>${metric}</code> ${ind}`);
    }
  }

  let summaryHtml = '';
  if (regressions.length > 0) {
    summaryHtml += `<p>⚠️ <b>Regressions:</b> ${regressions.join(', ')}</p>\n`;
  }
  if (improvements.length > 0) {
    summaryHtml += `<p>🚀 <b>Improvements:</b> ${improvements.join(', ')}</p>\n`;
  }

  const rows = buildTableRows(entry, baselineMetrics);
  const columns = [
    'Metric',
    'Mean (ms)',
    'Min (ms)',
    'Max (ms)',
    'Std Dev (ms)',
    'P75 (ms)',
    'P95 (ms)',
  ];
  const tableHeader = `<thead><tr>${columns.map((c) => `<th>${c}</th>`).join('')}</tr></thead>`;
  const table = `<table>${tableHeader}<tbody>${rows.join('')}</tbody></table>\n`;

  return header + summaryHtml + table;
}

/**
 * Builds a benchmark HTML section with per-benchmark sub-sections.
 *
 * Each entry becomes an h4-headed block with an optional regression/improvement.
 * Missing-preset warnings are surfaced at the top so reviewers can see exactly what data is absent.
 *
 * @param result - Fetched entries and missing preset descriptions.
 * @param summary - The collapsible header text (e.g. '👆 Interaction Benchmarks').
 * @param baseline - Optional historical baseline for traffic-light annotations.
 * @returns HTML string or empty string if no data at all.
 */
export function buildBenchmarkSection(
  result: FetchBenchmarkResult,
  summary: string,
  baseline?: HistoricalBaselineReference,
): string {
  try {
    const { entries, missingPresets } = result;
    if (entries.length === 0 && missingPresets.length === 0) {
      return '';
    }
    let warningHtml = '';
    if (missingPresets.length > 0) {
      warningHtml = `<p>⚠️ <b>Missing data:</b> ${missingPresets.join(', ')}</p>\n`;
    }
    let content = warningHtml;
    for (const entry of entries) {
      content += buildEntrySection(entry, baseline);
    }
    return `<details><summary>${summary}</summary>${content}</details>\n\n`;
  } catch (error: unknown) {
    console.log(`Failed to build ${summary}: ${String(error)}`);
    return '';
  }
}

/**
 * Builds the full ⚡ Performance Benchmarks collapsible section,
 * including 👆 Interaction, 🔌 Startup, and 🧭 User Journey sub-sections.
 *
 * Fetches the historical baseline (branch-aware, with release-branch fallback)
 * and annotates each Mean cell with traffic-light indicators so reviewers can
 * spot regressions and improvements at a glance.
 *
 * @param hostUrl - Base URL for CI artifacts.
 * @returns HTML string for the collapsible section, or empty string.
 */
export async function buildPerformanceBenchmarksSection(
  hostUrl: string,
): Promise<string> {
  const sectionTitle = '⚡ Performance Benchmarks';

  const [interactionResult, startupResult, userJourneyResult, baseline] =
    await Promise.all([
      fetchBenchmarkEntries(hostUrl, Object.values(INTERACTION_PRESETS)),
      fetchBenchmarkEntries(hostUrl, Object.values(STARTUP_PRESETS)),
      fetchBenchmarkEntries(hostUrl, Object.values(USER_JOURNEY_PRESETS)),
      fetchHistoricalPerformanceData(),
    ]);

  const resolvedBaseline = baseline ?? undefined;

  const interactionHtml = buildBenchmarkSection(
    interactionResult,
    '👆 Interaction Benchmarks',
    resolvedBaseline,
  );
  const startupHtml = buildBenchmarkSection(
    startupResult,
    '🔌 Startup Benchmarks',
    resolvedBaseline,
  );
  const userJourneyHtml = buildBenchmarkSection(
    userJourneyResult,
    '🧭 User Journey Benchmarks',
    resolvedBaseline,
  );

  if (!interactionHtml && !startupHtml && !userJourneyHtml) {
    return '';
  }

  const content = `${interactionHtml}${startupHtml}${userJourneyHtml}`;
  return `<details><summary>${sectionTitle}</summary>\n<blockquote>\n${content}</blockquote>\n</details>\n\n`;
}
