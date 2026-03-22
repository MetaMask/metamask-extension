import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  ENTRY_BENCHMARK_PLATFORMS,
  ENTRY_BENCHMARK_BUILD_TYPES,
  BENCHMARK_PLATFORMS,
  BENCHMARK_BUILD_TYPES,
  ALL_BENCHMARK_COMBOS,
  STAT_KEY,
  DEFAULT_RELATIVE_THRESHOLDS,
} from '../../shared/constants/benchmarks';
import type {
  BenchmarkResults,
  ComparisonKey,
  StatisticalResult,
} from '../../shared/constants/benchmarks';
import {
  STARTUP_PRESETS,
  INTERACTION_PRESETS,
  USER_JOURNEY_PRESETS,
} from '../../test/e2e/benchmarks/utils/constants';
import {
  compareMetric,
  formatDeltaPercent,
  COMPARISON_SEVERITY,
} from './comparison-utils';
import type { ComparisonSeverity } from './comparison-utils';
import type { HistoricalBaselineReference } from './historical-comparison';
import { fetchHistoricalPerformanceDataFromMain } from './historical-comparison';

/** A parsed benchmark entry with its name, preset, platform, buildType, and stats. */
export type BenchmarkEntry = {
  benchmarkName: string;
  presetName: string;
  platform: string;
  buildType: string;
  mean: StatisticalResult;
  stdDev: StatisticalResult;
  p75: StatisticalResult;
  p95: StatisticalResult;
  /** Direct URL to the S3/CloudFront artifact JSON for this entry's preset. */
  artifactUrl?: string;
};

export const EntryHealth = {
  Pass: 'pass',
  Warn: 'warn',
  Fail: 'fail',
} as const;

export type EntryHealth = (typeof EntryHealth)[keyof typeof EntryHealth];

type MetricStat = { icon: string; delta: string; severity: ComparisonSeverity };

/** One entry per metric that has at least one p75/p95 regression or warn. */
type RegressionInfo = {
  metric: string;
  mean: MetricStat | null;
  p75: MetricStat | null;
  p95: MetricStat | null;
  worstSeverity: ComparisonSeverity;
};

export type FetchBenchmarkResult = {
  entries: BenchmarkEntry[];
  missingPresets: string[];
};

const HEALTH_ORDER: Record<EntryHealth, number> = {
  [EntryHealth.Pass]: 0,
  [EntryHealth.Warn]: 1,
  [EntryHealth.Fail]: 2,
};

const HEALTH_ICON: Record<EntryHealth, string> = {
  [EntryHealth.Fail]: COMPARISON_SEVERITY.Regression.icon,
  [EntryHealth.Warn]: COMPARISON_SEVERITY.Warn.icon,
  [EntryHealth.Pass]: COMPARISON_SEVERITY.Pass.icon,
};

/**
 * Platform/buildType sets for startup benchmarks (all 4 combos in CI).
 * Interaction uses ENTRY_BENCHMARK_PLATFORMS/BUILD_TYPES (chrome-browserify).
 * User journey uses chrome × browserify+webpack.
 */
const STARTUP_BENCHMARK_PLATFORMS = [
  BENCHMARK_PLATFORMS.CHROME,
  BENCHMARK_PLATFORMS.FIREFOX,
] as const;
const STARTUP_BENCHMARK_BUILD_TYPES = [
  BENCHMARK_BUILD_TYPES.BROWSERIFY,
  BENCHMARK_BUILD_TYPES.WEBPACK,
] as const;

const USER_JOURNEY_BENCHMARK_PLATFORMS = [BENCHMARK_PLATFORMS.CHROME] as const;
const USER_JOURNEY_BENCHMARK_BUILD_TYPES = [
  BENCHMARK_BUILD_TYPES.BROWSERIFY,
] as const;

/**
 * Fetches benchmark JSON artifact for a given preset/platform/buildType.
 * Reads from local filesystem (BENCHMARK_RESULTS_DIR env) when set,
 * otherwise falls back to fetching from hostUrl (S3/CloudFront).
 *
 * @param hostUrl - Base URL for CI artifacts.
 * @param platform - Browser platform (e.g. 'chrome').
 * @param buildType - Build type (e.g. 'browserify').
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
  const fileName = `benchmark-${platform}-${buildType}-${preset}.json`;
  const localDir = process.env.BENCHMARK_RESULTS_DIR;

  if (localDir) {
    try {
      const raw = await readFile(join(localDir, fileName), 'utf8');
      return JSON.parse(raw) as Result;
    } catch {
      return null;
    }
  }

  try {
    const url = `${hostUrl}/benchmarks/${fileName}`;
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as Result;
  } catch {
    return null;
  }
}

/**
 * Extracts benchmark entries from a fetched JSON artifact.
 *
 * @param data - Raw parsed JSON from a benchmark artifact.
 * @param presetName - The preset name these entries were fetched under.
 * @param platform - Browser platform (e.g. 'chrome').
 * @param buildType - Build type (e.g. 'browserify').
 * @param artifactUrl
 * @returns Flat BenchmarkEntry array with only the fields we render.
 */
export function extractEntries(
  data: Record<string, BenchmarkResults | null>,
  presetName = '',
  platform = '',
  buildType = '',
  artifactUrl?: string,
): BenchmarkEntry[] {
  const hasValidMean = (
    entry: [string, BenchmarkResults | null],
  ): entry is [string, BenchmarkResults] => {
    const [, raw] = entry;
    return raw?.mean !== null && typeof raw?.mean === 'object';
  };

  return Object.entries(data)
    .filter(hasValidMean)
    .map(([name, raw]) => ({
      benchmarkName: name,
      presetName,
      platform,
      buildType,
      mean: raw.mean,
      stdDev: raw.stdDev,
      p75: raw.p75,
      p95: raw.p95,
      artifactUrl,
    }));
}

/**
 * Fetches and aggregates benchmark entries for a given set of presets,
 * platforms, and build types.
 *
 * @param hostUrl - Base URL for CI artifacts.
 * @param presets - Preset names to fetch.
 * @param platforms - Platforms to fetch (defaults to ENTRY_BENCHMARK_PLATFORMS).
 * @param buildTypes - Build types to fetch (defaults to ENTRY_BENCHMARK_BUILD_TYPES).
 * @returns Entries and a list of missing preset descriptions.
 */
export async function fetchBenchmarkEntries(
  hostUrl: string,
  presets: string[],
  platforms: readonly string[] = ENTRY_BENCHMARK_PLATFORMS,
  buildTypes: readonly string[] = ENTRY_BENCHMARK_BUILD_TYPES,
): Promise<FetchBenchmarkResult> {
  const fetches = platforms.flatMap((platform) =>
    buildTypes.flatMap((buildType) =>
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
      const artifactUrl = process.env.BENCHMARK_RESULTS_DIR
        ? undefined
        : `${hostUrl}/benchmarks/benchmark-${platform}-${buildType}-${preset}.json`;
      allEntries.push(
        ...extractEntries(data, preset, platform, buildType, artifactUrl),
      );
    } else {
      missingPresets.push(`${platform}/${buildType}/${preset}`);
    }
  }

  return { entries: allEntries, missingPresets };
}

/**
 * Resolves the historical baseline for a benchmark entry.
 *
 * Two key formats exist depending on preset type:
 * - Interaction / User Journey: stored as "{presetName}/{benchmarkName}"
 * - Startup (page-load): stored as "pageLoad/{platform}-{buildType}-{presetName}",
 * matched via a substring scan that requires all three parts to match so that
 * each platform/buildType variant resolves to its own baseline.
 *
 * @param baseline - Full historical reference map.
 * @param presetName - Preset name (e.g. 'startupStandardHome').
 * @param benchmarkName - Benchmark name (e.g. 'standardHome').
 * @param platform - Browser platform (e.g. 'chrome').
 * @param buildType - Build type (e.g. 'browserify').
 * @returns Baseline metrics or undefined if not found.
 */
function resolveEntryBaseline(
  baseline: HistoricalBaselineReference,
  presetName: string,
  benchmarkName: string,
  platform: string,
  buildType: string,
): HistoricalBaselineReference[string] | undefined {
  // TODO: Clean up can be done to only take 1 format in https://github.com/MetaMask/MetaMask-planning/issues/7106
  const qualified = `${presetName}/${benchmarkName}`;
  if (baseline[qualified]) {
    return baseline[qualified];
  }

  if (presetName) {
    const presetKey = Object.keys(baseline).find(
      (k) =>
        k.includes(presetName) && k.includes(platform) && k.includes(buildType),
    );
    if (presetKey) {
      return baseline[presetKey];
    }
  }

  return undefined;
}

/**
 * Checks P75 and P95 for a single metric against its baseline and returns the worst health.
 *
 * @param entry - The benchmark entry.
 * @param metric - Metric key to check.
 * @param baselineMetric - Baseline values for this metric.
 * @returns `EntryHealth.Fail`, `EntryHealth.Warn`, or `EntryHealth.Pass`.
 */
function checkMetricPercentiles(
  entry: BenchmarkEntry,
  metric: string,
  baselineMetric: HistoricalBaselineReference[string][string],
): EntryHealth {
  let metricWorst: EntryHealth = EntryHealth.Pass;
  for (const key of [STAT_KEY.P95, STAT_KEY.P75] as ComparisonKey[]) {
    const statsMap = key === STAT_KEY.P95 ? entry.p95 : entry.p75;
    const val = statsMap[metric];
    const baselineVal = baselineMetric[key];
    if (val === undefined || baselineVal === undefined) {
      continue;
    }
    const cmp = compareMetric(
      metric,
      key,
      val,
      baselineVal,
      DEFAULT_RELATIVE_THRESHOLDS,
    );
    if (cmp.severity === COMPARISON_SEVERITY.Regression.value) {
      return EntryHealth.Fail;
    }
    if (cmp.severity === COMPARISON_SEVERITY.Warn.value) {
      metricWorst = EntryHealth.Warn;
    }
  }
  return metricWorst;
}

/**
 * Computes the worst EntryHealth for a benchmark entry vs its baseline,
 * checking P75 and P95 across all non-total metrics.
 *
 * Currently uses Layer 2 (relative context) only.
 * Layer 1 (absolute gate via THRESHOLD_REGISTRY) is on hold until
 * the quality-gate benchmarks are agreed.
 *
 * @param entry - The benchmark entry.
 * @param baselineMetrics - Resolved baseline metrics for this entry.
 * @returns `EntryHealth.Fail` | `EntryHealth.Warn` | `EntryHealth.Pass`.
 */
export function computeEntryHealth(
  entry: BenchmarkEntry,
  baselineMetrics: HistoricalBaselineReference[string] | undefined,
): EntryHealth {
  if (!baselineMetrics) {
    return EntryHealth.Pass;
  }

  const metrics = Object.keys(entry.p95).filter((m) => m !== 'total');
  let worst: EntryHealth = EntryHealth.Pass;

  for (const metric of metrics) {
    const baselineMetric = baselineMetrics[metric];
    if (!baselineMetric) {
      continue;
    }
    const health = checkMetricPercentiles(entry, metric, baselineMetric);
    if (health === EntryHealth.Fail) {
      return EntryHealth.Fail;
    }
    if (health === EntryHealth.Warn) {
      worst = EntryHealth.Warn;
    }
  }
  return worst;
}

/**
 * Returns regression/warn items for a benchmark entry vs its baseline.
 * Checks P75 and P95 only (Mean is excluded — it is noisier and already
 * omitted from the health badge in computeEntryHealth).
 *
 * @param entry - The benchmark entry.
 * @param baselineMetrics - Resolved baseline metrics for this entry.
 * @returns Array of RegressionInfo (may be empty).
 */
function getEntryRegressions(
  entry: BenchmarkEntry,
  baselineMetrics: HistoricalBaselineReference[string] | undefined,
): RegressionInfo[] {
  if (!baselineMetrics) {
    return [];
  }

  const result: RegressionInfo[] = [];
  const metrics = Object.keys(entry.p95).filter((m) => m !== 'total');

  for (const metric of metrics) {
    if (!baselineMetrics[metric]) {
      continue;
    }

    const getStat = (
      statsMap: StatisticalResult | undefined,
      key: ComparisonKey,
    ): MetricStat | null => {
      const val = statsMap?.[metric];
      const baselineVal = baselineMetrics[metric]?.[key];
      if (val === undefined || baselineVal === undefined) {
        return null;
      }
      const cmp = compareMetric(
        metric,
        key,
        val,
        baselineVal,
        DEFAULT_RELATIVE_THRESHOLDS,
      );
      const sev = Object.values(COMPARISON_SEVERITY).find(
        (s) => s.value === cmp.severity,
      );
      return {
        icon: sev?.icon ?? COMPARISON_SEVERITY.Pass.icon,
        delta: formatDeltaPercent(cmp.deltaPercent),
        severity: cmp.severity,
      };
    };

    const meanStat = getStat(entry.mean, STAT_KEY.Mean as ComparisonKey);
    const p75Stat = getStat(entry.p75, STAT_KEY.P75 as ComparisonKey);
    const p95Stat = getStat(entry.p95, STAT_KEY.P95 as ComparisonKey);

    // Only include this metric if p75 or p95 has a regression or warn.
    const hasIssue = (s: MetricStat | null) =>
      s?.severity === COMPARISON_SEVERITY.Regression.value ||
      s?.severity === COMPARISON_SEVERITY.Warn.value;

    if (![p75Stat, p95Stat].some(hasIssue)) {
      continue;
    }

    let worstSeverity: ComparisonSeverity = COMPARISON_SEVERITY.Pass.value;
    for (const s of [p75Stat, p95Stat]) {
      if (s?.severity === COMPARISON_SEVERITY.Regression.value) {
        worstSeverity = COMPARISON_SEVERITY.Regression.value;
        break;
      }
      if (s?.severity === COMPARISON_SEVERITY.Warn.value) {
        worstSeverity = COMPARISON_SEVERITY.Warn.value;
      }
    }

    result.push({
      metric,
      mean: meanStat,
      p75: p75Stat,
      p95: p95Stat,
      worstSeverity,
    });
  }
  return result;
}

/**
 * Aggregates the worst EntryHealth per "presetName|platform-buildType" key
 * across all provided entries.
 *
 * @param entries - Benchmark entries to aggregate.
 * @param baseline - Historical baseline (optional).
 * @returns Map from "preset|platform-buildType" to worst EntryHealth.
 */
function buildHealthMap(
  entries: BenchmarkEntry[],
  baseline?: HistoricalBaselineReference,
): Map<string, EntryHealth> {
  const map = new Map<string, EntryHealth>();
  for (const entry of entries) {
    const baselineMetrics = baseline
      ? resolveEntryBaseline(
          baseline,
          entry.presetName,
          entry.benchmarkName,
          entry.platform,
          entry.buildType,
        )
      : undefined;
    const health = computeEntryHealth(entry, baselineMetrics);
    const key = `${entry.benchmarkName}|${entry.platform}-${entry.buildType}`;
    const existing = map.get(key);
    if (!existing || HEALTH_ORDER[health] > HEALTH_ORDER[existing]) {
      map.set(key, health);
    }
  }
  return map;
}

/**
 * Counts fail/warn preset × combo combinations across all entries.
 *
 * @param allEntries - Benchmark entries to aggregate.
 * @param baseline - Historical baseline (optional).
 * @returns Count of failing and warning preset × combo combinations.
 */
function countHealthEntries(
  allEntries: BenchmarkEntry[],
  baseline?: HistoricalBaselineReference,
): { failures: number; warnings: number } {
  const presetComboMap = buildHealthMap(allEntries, baseline);

  let failures = 0;
  let warnings = 0;
  for (const health of presetComboMap.values()) {
    if (health === EntryHealth.Fail) {
      failures += 1;
    } else if (health === EntryHealth.Warn) {
      warnings += 1;
    }
  }
  return { failures, warnings };
}

/**
 * Builds an outer collapsible section (e.g. 'Interaction Benchmarks').
 *
 * @param result - Fetched entries and missing preset descriptions.
 * @param summary - The collapsible header text.
 * @param baseline - Historical baseline for traffic-light annotations.
 * @param runUrl - GitHub Actions run URL for "Show logs" links (optional).
 * @returns HTML string or empty string if no data.
 */
export function buildBenchmarkSection(
  result: FetchBenchmarkResult,
  summary: string,
  baseline?: HistoricalBaselineReference,
  runUrl?: string,
): string {
  try {
    const { entries, missingPresets } = result;
    if (entries.length === 0 && missingPresets.length === 0) {
      return '';
    }

    const warningHtml =
      missingPresets.length > 0
        ? `<p>⚠️ <b>Missing data:</b> ${missingPresets.join(', ')}</p>\n`
        : '';

    const sectionCounts = countHealthEntries(entries, baseline);
    const sectionBadge =
      sectionCounts.failures > 0
        ? ` ${HEALTH_ICON[EntryHealth.Fail]} ${sectionCounts.failures}`
        : '';

    // Build entry lookup: benchmarkName|platform-buildType → entry
    const entryLookup = new Map<string, BenchmarkEntry>();
    for (const entry of entries) {
      entryLookup.set(
        `${entry.benchmarkName}|${entry.platform}-${entry.buildType}`,
        entry,
      );
    }

    const benchmarkNames = [...new Set(entries.map((e) => e.benchmarkName))];
    const usedCombos = new Set(
      entries.map((e) => `${e.platform}-${e.buildType}`),
    );
    const orderedCombos = ALL_BENCHMARK_COMBOS.filter((c) => usedCombos.has(c));

    let sectionBody = '';
    if (benchmarkNames.length > 0 && orderedCombos.length > 0) {
      const headerRow = `<tr><th>Metrics</th>${orderedCombos
        .map((c) => `<th>${c}</th>`)
        .join('')}</tr>`;

      const dataRows = benchmarkNames
        .map((benchmarkName) => {
          const cells = orderedCombos
            .map((combo) => {
              const entry = entryLookup.get(`${benchmarkName}|${combo}`);
              if (!entry) {
                return `<td align="center">–</td>`;
              }
              const baselineMetrics = baseline
                ? resolveEntryBaseline(
                    baseline,
                    entry.presetName,
                    benchmarkName,
                    entry.platform,
                    entry.buildType,
                  )
                : undefined;
              const health = computeEntryHealth(entry, baselineMetrics);
              const icon = HEALTH_ICON[health];
              const logHref = entry.artifactUrl ?? runUrl;
              const cell = logHref
                ? `${icon} <a href="${logHref}">[Show logs]</a>`
                : icon;
              return `<td align="center">${cell}</td>`;
            })
            .join('');
          return `<tr><td>${benchmarkName}</td>${cells}</tr>`;
        })
        .join('');

      sectionBody = `<table><thead>${headerRow}</thead><tbody>${dataRows}</tbody></table>\n`;
    } else if (baseline) {
      sectionBody = `<p>✅ No regressions detected</p>\n`;
    }

    const sectionContent = warningHtml + sectionBody;
    return sectionContent
      ? `<details><summary><b>${summary}${sectionBadge}</b></summary>\n${sectionContent}</details>\n`
      : '';
  } catch (error: unknown) {
    console.log(`Failed to build ${summary}: ${String(error)}`);
    return '';
  }
}

type MatrixCellData = {
  health: EntryHealth;
  /** Worst offending metric and percentile, e.g. "uiStartup(p95)". Empty for Pass. */
  label: string;
};

/**
 * Builds a summary health matrix table: benchmarkName rows × platform-buildType columns.
 * Each cell shows the health icon and the worst metric(percentile) that triggered it.
 * Only rows with at least one 🔴 Fail are included.
 *
 * @param allEntries - All benchmark entries across all sections.
 * @param baseline - Historical baseline (optional).
 * @returns HTML table string, or empty string if nothing to show.
 */
function buildHealthMatrixHtml(
  allEntries: BenchmarkEntry[],
  baseline: HistoricalBaselineReference | undefined,
): string {
  // Build per-cell data in a single pass (health + worst label + artifact URL).
  const cellMap = new Map<string, MatrixCellData>();
  for (const entry of allEntries) {
    const baselineMetrics = baseline
      ? resolveEntryBaseline(
          baseline,
          entry.presetName,
          entry.benchmarkName,
          entry.platform,
          entry.buildType,
        )
      : undefined;
    const health = computeEntryHealth(entry, baselineMetrics);
    const key = `${entry.benchmarkName}|${entry.platform}-${entry.buildType}`;
    const existing = cellMap.get(key);
    if (existing && HEALTH_ORDER[health] <= HEALTH_ORDER[existing.health]) {
      continue;
    }
    const regs =
      health === EntryHealth.Pass
        ? []
        : getEntryRegressions(entry, baselineMetrics);
    const topReg =
      regs.find(
        (r) => r.worstSeverity === COMPARISON_SEVERITY.Regression.value,
      ) ?? regs[0];
    let label = '';
    if (topReg) {
      const p95IsTrigger =
        topReg.p95?.severity === COMPARISON_SEVERITY.Regression.value ||
        topReg.p95?.severity === COMPARISON_SEVERITY.Warn.value;
      const percentile = p95IsTrigger ? 'p95' : 'p75';
      label = `${topReg.metric}(${percentile})`;
    }
    cellMap.set(key, { health, label });
  }

  const usedCombos = new Set(
    allEntries.map((e) => `${e.platform}-${e.buildType}`),
  );
  const orderedCombos = ALL_BENCHMARK_COMBOS.filter((c) => usedCombos.has(c));

  // Only include benchmark rows that have at least one Fail.
  const allBenchmarks = [...new Set(allEntries.map((e) => e.benchmarkName))];
  const affectedBenchmarks = allBenchmarks.filter((benchmark) =>
    orderedCombos.some(
      (combo) =>
        cellMap.get(`${benchmark}|${combo}`)?.health === EntryHealth.Fail,
    ),
  );

  if (affectedBenchmarks.length === 0 || orderedCombos.length === 0) {
    return '';
  }

  const headerRow = `<tr><th>Metrics</th>${orderedCombos
    .map((c) => `<th>${c}</th>`)
    .join('')}</tr>`;

  const dataRows = affectedBenchmarks
    .map((benchmark) => {
      const cells = orderedCombos
        .map((combo) => {
          const data = cellMap.get(`${benchmark}|${combo}`);
          if (!data) {
            return `<td align="center">–</td>`;
          }
          const icon = HEALTH_ICON[data.health];
          const cell = data.label ? `${icon} ${data.label}` : icon;
          return `<td align="center">${cell}</td>`;
        })
        .join('');
      return `<tr><td>${benchmark}</td>${cells}</tr>`;
    })
    .join('');

  return `<table><thead>${headerRow}</thead><tbody>${dataRows}</tbody></table>\n`;
}

/**
 * Builds the "View regression details" collapsible with one list item per failing entry.
 * Baseline is resolved once per entry (single pass, no duplication with caller).
 * Returns empty string when failures === 0.
 *
 * @param allEntries - All benchmark entries across all sections.
 * @param baseline - Historical baseline (optional).
 * @param failures - Pre-computed failure count (from countHealthEntries).
 * @param runUrl - Fallback log URL when an entry has no artifactUrl.
 */
function buildFailingItemsHtml(
  allEntries: BenchmarkEntry[],
  baseline: HistoricalBaselineReference | undefined,
  failures: number,
  runUrl: string | undefined,
): string {
  if (failures === 0) {
    return '';
  }

  const failureSuffix = failures === 1 ? 'failure' : 'failures';
  const failureLabel = `${HEALTH_ICON[EntryHealth.Fail]} ${failures} ${failureSuffix}`;

  const listItems = allEntries
    .flatMap((entry) => {
      const baselineMetrics = baseline
        ? resolveEntryBaseline(
            baseline,
            entry.presetName,
            entry.benchmarkName,
            entry.platform,
            entry.buildType,
          )
        : undefined;
      if (computeEntryHealth(entry, baselineMetrics) !== EntryHealth.Fail) {
        return [];
      }
      const regs = getEntryRegressions(entry, baselineMetrics);
      const logHref = entry.artifactUrl ?? runUrl;
      const logAnchor = logHref ? ` <a href="${logHref}">[Show logs]</a>` : '';
      const metricBullets = regs
        .map((r) => {
          const parts = [
            r.mean ? `mean ${r.mean.icon}${r.mean.delta}` : null,
            r.p75 ? `p75 ${r.p75.icon}${r.p75.delta}` : null,
            r.p95 ? `p95 ${r.p95.icon}${r.p95.delta}` : null,
          ]
            .filter(Boolean)
            .join(', ');
          return `&nbsp;&nbsp;• ${r.metric}: ${parts}`;
        })
        .join('<br>');
      return [
        `<li><b>${entry.benchmarkName}</b> · ${entry.platform}-${entry.buildType}${logAnchor}` +
          `<br>${metricBullets}</li>`,
      ];
    })
    .join('');

  if (!listItems) {
    return `<p>${failureLabel}</p>\n`;
  }

  return (
    `<details><summary>View regression details - ${failureLabel}</summary>\n` +
    `<ul>${listItems}</ul></details>\n`
  );
}

/**
 * Builds the full ⚡ Performance Benchmarks collapsible section.
 *
 * @param hostUrl - Base URL for CI artifacts.
 * @returns HTML string for the collapsible section, or empty string.
 */
export async function buildPerformanceBenchmarksSection(
  hostUrl: string,
): Promise<string> {
  const sectionTitle = '⚡ Performance Benchmarks';

  const benchmarkRunId =
    process.env.BENCHMARK_WORKFLOW_RUN_ID ?? process.env.GITHUB_RUN_ID;
  const runUrl =
    process.env.GITHUB_SERVER_URL &&
    process.env.GITHUB_REPOSITORY &&
    benchmarkRunId
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${benchmarkRunId}`
      : undefined;

  const [interactionResult, startupResult, userJourneyResult, baseline] =
    await Promise.all([
      fetchBenchmarkEntries(
        hostUrl,
        Object.values(INTERACTION_PRESETS),
        ENTRY_BENCHMARK_PLATFORMS,
        ENTRY_BENCHMARK_BUILD_TYPES,
      ),
      fetchBenchmarkEntries(
        hostUrl,
        Object.values(STARTUP_PRESETS),
        STARTUP_BENCHMARK_PLATFORMS,
        STARTUP_BENCHMARK_BUILD_TYPES,
      ),
      fetchBenchmarkEntries(
        hostUrl,
        Object.values(USER_JOURNEY_PRESETS),
        USER_JOURNEY_BENCHMARK_PLATFORMS,
        USER_JOURNEY_BENCHMARK_BUILD_TYPES,
      ),
      fetchHistoricalPerformanceDataFromMain(),
    ]);

  const resolvedBaseline = baseline ?? undefined;

  const allEntries = [
    ...startupResult.entries,
    ...interactionResult.entries,
    ...userJourneyResult.entries,
  ];

  if (
    allEntries.length === 0 &&
    interactionResult.missingPresets.length === 0 &&
    startupResult.missingPresets.length === 0 &&
    userJourneyResult.missingPresets.length === 0
  ) {
    return '';
  }

  const interactionHtml = buildBenchmarkSection(
    interactionResult,
    'Interaction Benchmarks',
    resolvedBaseline,
    runUrl,
  );
  const startupHtml = buildBenchmarkSection(
    startupResult,
    'Startup Benchmarks',
    resolvedBaseline,
    runUrl,
  );
  const userJourneyHtml = buildBenchmarkSection(
    userJourneyResult,
    'User Journey Benchmarks',
    resolvedBaseline,
    runUrl,
  );

  const healthBadge = `(${HEALTH_ICON[EntryHealth.Pass]} pass · ${HEALTH_ICON[EntryHealth.Warn]} warn · ${HEALTH_ICON[EntryHealth.Fail]} fail)`;
  const summaryText = `${sectionTitle} ${healthBadge}`;

  // Health matrix: preset × combo grid, only rows with at least one failure.
  const matrixHtml = buildHealthMatrixHtml(allEntries, resolvedBaseline);

  const { failures } = countHealthEntries(allEntries, resolvedBaseline);

  const failingItems = allEntries
    .flatMap((entry) => {
      const baselineMetrics = resolvedBaseline
        ? resolveEntryBaseline(
            resolvedBaseline,
            entry.presetName,
            entry.benchmarkName,
            entry.platform,
            entry.buildType,
          )
        : undefined;
      if (computeEntryHealth(entry, baselineMetrics) !== EntryHealth.Fail) {
        return [];
      }
      const regs = getEntryRegressions(entry, baselineMetrics);
      const logHref = entry.artifactUrl ?? runUrl;
      const logAnchor = logHref ? ` <a href="${logHref}">[Show logs]</a>` : '';
      // [Show logs] on the header line; each metric on its own bullet below
      const metricBullets = regs
        .map((r) => {
          const parts = [
            r.mean ? `mean ${r.mean.icon}${r.mean.delta}` : null,
            r.p75 ? `p75 ${r.p75.icon}${r.p75.delta}` : null,
            r.p95 ? `p95 ${r.p95.icon}${r.p95.delta}` : null,
          ]
            .filter(Boolean)
            .join(', ');
          return `&nbsp;&nbsp;• ${r.metric}: ${parts}`;
        })
        .join('<br>');
      return [
        `<li><b>${entry.benchmarkName}</b> · ${entry.platform}-${entry.buildType}${logAnchor}` +
          `<br>${metricBullets}</li>`,
      ];
    })
    .join('');

  const failureSuffix = failures === 1 ? 'failure' : 'failures';
  const failureLabel =
    failures > 0
      ? `${HEALTH_ICON[EntryHealth.Fail]} ${failures} ${failureSuffix}`
      : '';
  let regressionDetailsHtml = '';
  if (failingItems) {
    regressionDetailsHtml = `<details><summary>${failureLabel} [View regression details]</summary>\n<ul>${failingItems}</ul></details>\n`;
  } else if (failureLabel) {
    regressionDetailsHtml = `<p>${failureLabel}</p>\n`;
  }

  const subsectionsHtml = interactionHtml + startupHtml + userJourneyHtml;
  const content = matrixHtml + regressionDetailsHtml + subsectionsHtml;

  return `<details><summary>${summaryText}</summary>\n<blockquote>\n${content}</blockquote>\n</details>\n\n`;
}
