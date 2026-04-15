import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  ALL_BENCHMARK_COMBOS,
  BENCHMARK_ANNOUNCE_SECTIONS,
  BENCHMARK_BUILD_TYPES,
  BENCHMARK_PLATFORMS,
  DEFAULT_RELATIVE_THRESHOLDS,
  ENTRY_BENCHMARK_BUILD_TYPES,
  ENTRY_BENCHMARK_PLATFORMS,
  STAT_KEY,
  THRESHOLD_SEVERITY,
} from '../../shared/constants/benchmarks';
import type {
  BenchmarkAnnounceSamples,
  BenchmarkAnnounceSection,
  BenchmarkResults,
  ComparisonKey,
  StatisticalResult,
  WebVitalsSummary,
} from '../../shared/constants/benchmarks';
import {
  STARTUP_PRESETS,
  INTERACTION_PRESETS,
  USER_JOURNEY_PRESETS,
  DAPP_PAGE_LOAD_PRESETS,
} from '../../test/e2e/benchmarks/utils/constants';
import { THRESHOLD_REGISTRY } from '../../test/e2e/benchmarks/utils/thresholds';
import { validateResultThresholds } from '../../test/e2e/benchmarks/utils/statistics';
import {
  compareMetric,
  formatDeltaPercent,
  COMPARISON_SEVERITY,
} from './comparison-utils';
import type { ComparisonSeverity } from './comparison-utils';
import type {
  HistoricalBaselineReference,
  HistoricalBaselineResult,
} from './historical-comparison';
import { fetchHistoricalPerformanceDataFromMain } from './historical-comparison';
import {
  EXTENSION_BENCHMARK_STATS_MAIN_PERFORMANCE_DATA_URL,
  resolveBaseline,
  buildEntryKey,
  buildCombo,
  buildArtifactFilename,
  buildArtifactUrl,
} from './utils';

export type BenchmarkEntry = {
  benchmarkName: string;
  presetName: string;
  platform: string;
  buildType: string;
  mean: StatisticalResult;
  stdDev: StatisticalResult;
  p75: StatisticalResult;
  p95: StatisticalResult;
  webVitals?: WebVitalsSummary;
  artifactUrl?: string;
};

export const EntryHealth = {
  Pass: 'pass',
  Warn: 'warn',
  Fail: 'fail',
} as const;

export type EntryHealth = (typeof EntryHealth)[keyof typeof EntryHealth];

type MetricStat = { icon: string; delta: string; severity: ComparisonSeverity };

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

const USER_JOURNEY_BENCHMARK_PLATFORMS = [BENCHMARK_PLATFORMS.CHROME] as const;

/**
 * Build types to fetch for user-journey presets in this workflow run.
 * Mirrors whether webpack user-journey matrix rows run (push to main/release only;
 */
export function getUserJourneyBenchmarkBuildTypesForCurrentRun(): readonly string[] {
  const eventName = process.env.GITHUB_EVENT_NAME;
  const ref = process.env.GITHUB_REF ?? '';
  const webpackUserJourneyArtifactsExist =
    eventName === 'push' &&
    (ref === 'refs/heads/main' || ref.startsWith('refs/heads/release/'));

  if (webpackUserJourneyArtifactsExist) {
    return [BENCHMARK_BUILD_TYPES.BROWSERIFY, BENCHMARK_BUILD_TYPES.WEBPACK];
  }

  return [BENCHMARK_BUILD_TYPES.BROWSERIFY];
}

const STARTUP_BENCHMARK_PLATFORMS = [
  BENCHMARK_PLATFORMS.CHROME,
  BENCHMARK_PLATFORMS.FIREFOX,
] as const;
const STARTUP_BENCHMARK_BUILD_TYPES = [
  BENCHMARK_BUILD_TYPES.BROWSERIFY,
  BENCHMARK_BUILD_TYPES.WEBPACK,
] as const;

const DAPP_PAGE_LOAD_BENCHMARK_PLATFORMS = [
  BENCHMARK_PLATFORMS.CHROME,
] as const;
const DAPP_PAGE_LOAD_BENCHMARK_BUILD_TYPES = [
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
  const fileName = buildArtifactFilename(platform, buildType, preset);
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
      ...(raw.webVitals ? { webVitals: raw.webVitals } : {}),
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
        : buildArtifactUrl(hostUrl, platform, buildType, preset);
      allEntries.push(
        ...extractEntries(data, preset, platform, buildType, artifactUrl),
      );
    } else {
      missingPresets.push(`${platform}/${buildType}/${preset}`);
    }
  }

  return { entries: allEntries, missingPresets };
}

const CWV_METRICS: {
  key: 'inp' | 'fcp' | 'lcp' | 'cls';
  label: string;
  unit: string;
  good: number;
  poor: number;
}[] = [
  { key: 'inp', label: 'INP', unit: 'ms', good: 200, poor: 500 },
  { key: 'fcp', label: 'FCP', unit: 'ms', good: 1800, poor: 3000 },
  { key: 'lcp', label: 'LCP', unit: 'ms', good: 2500, poor: 4000 },
  { key: 'cls', label: 'CLS', unit: '', good: 0.1, poor: 0.25 },
];

function getCwvIcon(value: number, good: number, poor: number): string {
  if (value <= good) {
    return HEALTH_ICON[EntryHealth.Pass];
  }
  if (value <= poor) {
    return HEALTH_ICON[EntryHealth.Warn];
  }
  return HEALTH_ICON[EntryHealth.Fail];
}

function formatCwvValue(value: number, unit: string): string {
  if (unit === 'ms') {
    return value >= 1000
      ? `${(value / 1000).toFixed(1)}s`
      : `${Math.round(value)}ms`;
  }
  return value.toFixed(3);
}

/**
 * Validates P75/P95 against THRESHOLD_REGISTRY limits.
 * Fail violation → EntryHealth.Fail; Warn violation → EntryHealth.Warn.
 * Returns Pass when no threshold is registered or all values are within limits.
 *
 * Relative context is shown separately as informational deltas below each table,
 * and does not affect the health badge.
 *
 * @param entry - The benchmark entry.
 * @param _baselineMetrics - Unused; kept for call-site compatibility.
 * @returns `EntryHealth.Fail` | `EntryHealth.Warn` | `EntryHealth.Pass`.
 */
export function computeEntryHealth(
  entry: BenchmarkEntry,
  _baselineMetrics: HistoricalBaselineReference[string] | undefined,
): EntryHealth {
  let health: EntryHealth = EntryHealth.Pass;

  // Timer threshold checks
  const thresholdConfig = THRESHOLD_REGISTRY[entry.benchmarkName];
  if (thresholdConfig) {
    const { violations } = validateResultThresholds(
      { p75: entry.p75, p95: entry.p95 } as BenchmarkResults,
      thresholdConfig,
    );
    if (violations.some((v) => v.severity === THRESHOLD_SEVERITY.Fail)) {
      return EntryHealth.Fail;
    }
    if (violations.some((v) => v.severity === THRESHOLD_SEVERITY.Warn)) {
      health = EntryHealth.Warn;
    }
  }

  // CWV checks: warn on "needs-improvement" or worse (p75 > good threshold).
  // Does not fail — informational only until team calibrates expectations.
  const agg = entry.webVitals?.aggregated;
  if (agg) {
    for (const { key, good } of CWV_METRICS) {
      const s = agg[key];
      if (s && s.max > 0 && s.p75 > good) {
        health = EntryHealth.Warn;
        break;
      }
    }
  }

  return health;
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
      ? resolveBaseline(baseline, entry.presetName, entry.benchmarkName)
      : undefined;
    const health = computeEntryHealth(entry, baselineMetrics);
    const key = buildEntryKey(
      entry.benchmarkName,
      entry.platform,
      entry.buildType,
    );
    const existing = map.get(key);
    if (!existing || HEALTH_ORDER[health] > HEALTH_ORDER[existing]) {
      map.set(key, health);
    }
  }
  return map;
}

/**
 * Extracts the display name from a benchmark name.
 * For startup benchmarks with platform prefix (e.g., 'chrome-browserify-startupStandardHome'),
 * returns just the metric name (e.g., 'startupStandardHome').
 * For other benchmarks, returns the name as-is.
 * @param benchmarkName
 */
function extractDisplayName(benchmarkName: string): string {
  const match = benchmarkName.match(
    /^(?:chrome|firefox)-(?:browserify|webpack)-(.+)$/u,
  );
  return match ? match[1] : benchmarkName;
}

/**
 * Counts the number of failing and warning benchmark entries.
 *
 * @param allEntries - All benchmark entries to count.
 * @param baseline - Historical baseline (optional).
 * @returns Object with failure and warning counts.
 */
function countHealthEntries(
  allEntries: BenchmarkEntry[],
  baseline?: HistoricalBaselineReference,
): { passes: number; failures: number; warnings: number } {
  const presetComboMap = buildHealthMap(allEntries, baseline);

  let passes = 0;
  let failures = 0;
  let warnings = 0;
  for (const health of presetComboMap.values()) {
    if (health === EntryHealth.Fail) {
      failures += 1;
    } else if (health === EntryHealth.Warn) {
      warnings += 1;
    } else if (health === EntryHealth.Pass) {
      passes += 1;
    }
  }
  return { passes, failures, warnings };
}

/**
 * Formats timer details from StatisticalResult into a readable HTML list with traffic lights.
 * Only returns timer breakdown if entry has multiple timers (user journey benchmarks).
 *
 * @param entry - Benchmark entry with all stats (mean, p75, p95)
 * @param baselineMetrics - Historical baseline for comparison (optional)
 * @param logHref
 * @returns HTML string with timer breakdown, or empty string if single timer
 */
function formatTimerDetails(
  entry: BenchmarkEntry,
  baselineMetrics: HistoricalBaselineReference[string] | undefined,
  logHref?: string,
): string {
  const timerCount = Object.keys(entry.mean).length;

  if (timerCount <= 1) {
    return '';
  }

  const thresholdConfig = THRESHOLD_REGISTRY[entry.benchmarkName];

  const entries = Object.entries(entry.mean)
    .map(([metricName]) => {
      let icon = HEALTH_ICON[EntryHealth.Pass];
      let hasIssue = false;

      if (thresholdConfig?.[metricName]) {
        const metricResult = {
          p75: { [metricName]: entry.p75[metricName] },
          p95: { [metricName]: entry.p95[metricName] },
        } as BenchmarkResults;

        const { violations } = validateResultThresholds(metricResult, {
          [metricName]: thresholdConfig[metricName],
        });

        const hasFail = violations.some(
          (v) => v.severity === THRESHOLD_SEVERITY.Fail,
        );
        const hasWarn = violations.some(
          (v) => v.severity === THRESHOLD_SEVERITY.Warn,
        );

        if (hasFail) {
          icon = HEALTH_ICON[EntryHealth.Fail];
          hasIssue = true;
        } else if (hasWarn) {
          icon = HEALTH_ICON[EntryHealth.Warn];
          hasIssue = true;
        }
      }

      if (!hasIssue) {
        return null;
      }

      const logsLine = logHref
        ? `<br><a href="${logHref}">[Show logs]</a>`
        : '';
      return `<div>${icon} <code>${metricName}</code>${logsLine}</div>`;
    })
    .filter((item) => item !== null)
    .join('');

  return entries
    ? `<div style="text-align: left; margin: 4px 0 8px 0; padding-left: 8px;">${entries}</div>`
    : '';
}

/**
 * Builds an outer collapsible benchmark subsection.
 *
 * @param result - Fetched entries and missing preset descriptions.
 * @param section - `BENCHMARK_ANNOUNCE_SECTIONS.*` or a plain title string (no announced samples).
 * @param baseline - Historical baseline for relative delta annotations.
 * @param runUrl - GitHub Actions run URL for "Show logs" links (optional).
 * @returns HTML string or empty string if no data.
 */

/** Minimum absolute delta (%) to include a metric in the relative summary. */
const RELATIVE_DELTA_MIN_PCT = 0.1;

export type {
  BenchmarkAnnounceSamples,
  BenchmarkAnnounceSection,
} from '../../shared/constants/benchmarks';
export { BENCHMARK_ANNOUNCE_SECTIONS };

/**
 * User journey benchmarks use the real API on `main` and `release/*` branches; other
 * branches use a mock API. Aligns with `BRANCH` / `GITHUB_HEAD_REF` in prerelease publish.
 */
export function getUserJourneyBenchmarkApiModeFromBranch(): 'mock' | 'real' {
  const branch = (
    process.env.BRANCH ??
    process.env.GITHUB_HEAD_REF ??
    process.env.GITHUB_REF_NAME ??
    ''
  ).trim();
  if (branch === 'main' || branch.startsWith('release/')) {
    return 'real';
  }
  return 'mock';
}

type SectionSamplesLabelOptions = {
  /** When set (User Journey section only), appends ` · mock API` or ` · real API`. */
  userJourneyApi?: 'mock' | 'real';
};

/**
 * Collapsible section title suffix: ` · Samples: N` (and User Journey API mode when applicable).
 *
 * @param announceSamples - When set (named announce sections), appends the Samples line.
 * @param options - User Journey subsection only: mock vs real API from branch env.
 */
function formatSectionSamplesLabel(
  announceSamples?: BenchmarkAnnounceSamples,
  options?: SectionSamplesLabelOptions,
): string {
  if (!announceSamples) {
    return '';
  }
  let label = ` · Samples: ${announceSamples.sampleQuantity}`;
  if (options?.userJourneyApi === 'real') {
    label += ' · real API';
  } else if (options?.userJourneyApi === 'mock') {
    label += ' · mock API';
  }
  return label;
}

/**
 * Builds a bullet-point summary of notable relative deltas vs the 5-commit baseline.
 * Only metrics that changed by ≥10% (either direction) are shown.
 * This is purely informational and does not affect any health badge.
 *
 * @param entries - All benchmark entries in this section.
 * @param baseline - Historical baseline reference.
 * @returns HTML string, or empty string if nothing notable.
 */
function buildRelativeDeltaSection(
  entries: BenchmarkEntry[],
  baseline: HistoricalBaselineReference | undefined,
): string {
  if (!baseline) {
    return '';
  }

  const lines: string[] = [];

  for (const entry of entries) {
    const baselineMetrics =
      resolveBaseline(baseline, entry.presetName, entry.benchmarkName) ??
      (entry.presetName.startsWith('startup')
        ? resolveBaseline(
            baseline,
            entry.presetName,
            `${entry.platform}-${entry.buildType}-${entry.benchmarkName}`,
          )
        : undefined);
    if (!baselineMetrics) {
      continue;
    }

    for (const metric of Object.keys(entry.p75)) {
      const baselineMetric = baselineMetrics[metric];
      if (!baselineMetric) {
        continue;
      }
      const cur = entry.p75[metric];
      const base = baselineMetric.p75;
      if (cur === undefined || !base) {
        continue;
      }
      const deltaPercent = (cur - base) / base;
      if (Math.abs(deltaPercent) < RELATIVE_DELTA_MIN_PCT) {
        continue;
      }
      const sign = deltaPercent > 0 ? '+' : '';
      const pct = `${sign}${(deltaPercent * 100).toFixed(0)}%`;
      const arrow = deltaPercent > 0 ? '↑' : '↓';
      lines.push(
        `<li>${arrow} <code>${entry.benchmarkName}/${metric}</code>: ${pct}</li>`,
      );
    }
  }

  if (lines.length === 0) {
    return '';
  }

  return `<p><b>📈 Results compared to the previous 5 runs on main</b></p><ul>${lines.join('')}</ul>\n`;
}

/**
 * Builds a separate CWV subsection showing P75 values and rating distributions.
 * Shown independently of baseline — absolute values are meaningful for CWV
 * due to universal thresholds (INP <200ms, LCP <2500ms, etc.).
 * TODO: transition to delta-only format once CWV baseline data accumulates.
 * @param entries
 */
function buildCwvSection(entries: BenchmarkEntry[]): string {
  const lines: string[] = [];

  for (const entry of entries) {
    const agg = entry.webVitals?.aggregated;
    if (!agg) {
      continue;
    }
    for (const { key, label, unit, good, poor } of CWV_METRICS) {
      const s = agg[key];
      if (!s || s.max === 0) {
        continue;
      }
      if (s.p75 <= good) {
        continue;
      }
      const icon = getCwvIcon(s.p75, good, poor);
      lines.push(
        `<li>${icon} <code>${entry.benchmarkName}/${label}</code>: p75 ${formatCwvValue(s.p75, unit)}</li>`,
      );
    }
  }

  if (lines.length === 0) {
    return '';
  }

  const legend = `${HEALTH_ICON[EntryHealth.Pass]} good · ${HEALTH_ICON[EntryHealth.Warn]} needs improvement · ${HEALTH_ICON[EntryHealth.Fail]} poor (<a href="https://web.dev/articles/vitals">web.dev thresholds</a>)`;
  return `<p><b>🌐 Core Web Vitals</b> — ${legend}</p><ul>${lines.join('')}</ul>\n`;
}

export function buildBenchmarkSection(
  result: FetchBenchmarkResult,
  section: string | BenchmarkAnnounceSection,
  baseline?: HistoricalBaselineReference,
  runUrl?: string,
): string {
  const summary = typeof section === 'string' ? section : section.title;
  const announceSamples =
    typeof section === 'string' ? undefined : section.announceSamples;

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
    const isUserJourneySection =
      summary === BENCHMARK_ANNOUNCE_SECTIONS.userJourney.title;
    const samplesLabel = formatSectionSamplesLabel(announceSamples, {
      userJourneyApi: isUserJourneySection
        ? getUserJourneyBenchmarkApiModeFromBranch()
        : undefined,
    });
    const sectionBadge =
      sectionCounts.failures > 0
        ? ` ${HEALTH_ICON[EntryHealth.Fail]} ${sectionCounts.failures}`
        : '';

    const entryLookup = new Map<string, BenchmarkEntry>();
    for (const entry of entries) {
      entryLookup.set(
        buildEntryKey(entry.benchmarkName, entry.platform, entry.buildType),
        entry,
      );
    }

    const benchmarkNames = [...new Set(entries.map((e) => e.benchmarkName))];
    const usedCombos = new Set(
      entries.map((e) => buildCombo(e.platform, e.buildType)),
    );
    const orderedCombos = ALL_BENCHMARK_COMBOS.filter((c) => usedCombos.has(c));

    let sectionBody = '';
    if (benchmarkNames.length > 0 && orderedCombos.length > 0) {
      const headerRow = `<tr><th>Benchmark</th>${orderedCombos
        .map((c) => `<th>${c}</th>`)
        .join('')}</tr>`;

      const dataRows = benchmarkNames
        .map((benchmarkName: string) => {
          const cells = orderedCombos
            .map((combo: string) => {
              const entry = entryLookup.get(`${benchmarkName}|${combo}`);
              if (!entry) {
                return `<td align="left">–</td>`;
              }
              const baselineMetrics = baseline
                ? resolveBaseline(baseline, entry.presetName, benchmarkName)
                : undefined;
              const health = computeEntryHealth(entry, baselineMetrics);
              const icon = HEALTH_ICON[health];
              const logHref = entry.artifactUrl ?? runUrl;

              const timerDetails = formatTimerDetails(
                entry,
                baselineMetrics,
                logHref,
              );

              const logsLink = logHref
                ? `<a href="${logHref}">[Show logs]</a>`
                : '';

              let cell: string;
              switch (true) {
                case Boolean(timerDetails):
                  cell = timerDetails;
                  break;
                case Boolean(logHref):
                  cell = `${icon} ${logsLink}`;
                  break;
                default:
                  cell = icon;
              }
              return `<td align="left">${cell}</td>`;
            })
            .join('');
          const displayName = extractDisplayName(benchmarkName);
          return `<tr><td>${displayName}</td>${cells}</tr>`;
        })
        .join('');

      sectionBody = `<div style="overflow-x:auto;width:100%"><table style="width:100%;min-width:900px;table-layout:auto;border-collapse:collapse"><thead>${headerRow}</thead><tbody>${dataRows}</tbody></table></div>\n`;
    } else if (baseline) {
      sectionBody = `<p>✅ No regressions detected</p>\n`;
    }

    const deltaSection = buildRelativeDeltaSection(entries, baseline);
    const cwvSection = buildCwvSection(entries);
    const sectionContent =
      warningHtml + sectionBody + deltaSection + cwvSection;
    return sectionContent
      ? `<details><summary><b>${summary}${samplesLabel}${sectionBadge}</b></summary>\n${sectionContent}</details>\n`
      : '';
  } catch (error: unknown) {
    console.log(`Failed to build ${summary}: ${String(error)}`);
    return '';
  }
}

type MatrixCellData = {
  health: EntryHealth;
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
  const cellMap = new Map<string, MatrixCellData>();
  for (const entry of allEntries) {
    const baselineMetrics = baseline
      ? resolveBaseline(baseline, entry.presetName, entry.benchmarkName)
      : undefined;
    const health = computeEntryHealth(entry, baselineMetrics);
    const key = buildEntryKey(
      entry.benchmarkName,
      entry.platform,
      entry.buildType,
    );
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
          const entry = allEntries.find(
            (e) =>
              e.benchmarkName === benchmark &&
              `${e.platform}-${e.buildType}` === combo,
          );
          const logHref = entry?.artifactUrl;
          const label = data.label ? `${icon} ${data.label}` : icon;
          const cell = logHref
            ? `${label} <a href="${logHref}">[logs]</a>`
            : label;
          return `<td align="center">${cell}</td>`;
        })
        .join('');
      return `<tr><td>${benchmark}</td>${cells}</tr>`;
    })
    .join('');

  return `<table><thead>${headerRow}</thead><tbody>${dataRows}</tbody></table>\n`;
}

/**
 * Returns the worst offending metric label for a failing entry, for use in the
 * "View regression details" list.
 *
 * @param entry - The failing benchmark entry.
 * @param baselineMetrics - Resolved baseline metrics (for Layer 2 fallback).
 * @returns Label such as "initialActions(p95)", or empty string if none found.
 */
function getWorstViolationLabel(
  entry: BenchmarkEntry,
  baselineMetrics: HistoricalBaselineReference[string] | undefined,
): string {
  // Layer 1: find the threshold violation with the largest excess over the limit.
  const thresholdConfig = THRESHOLD_REGISTRY[entry.benchmarkName];
  if (thresholdConfig) {
    const { violations } = validateResultThresholds(
      { p75: entry.p75, p95: entry.p95 } as BenchmarkResults,
      thresholdConfig,
    );
    const worst = violations
      .filter((v) => v.severity === THRESHOLD_SEVERITY.Fail)
      .sort((a, b) => b.value / b.threshold - a.value / a.threshold)[0];
    if (worst) {
      return `${worst.metricId}(${worst.percentile})`;
    }
  }

  // Layer 2: fall back to the worst relative regression metric.
  const regs = getEntryRegressions(entry, baselineMetrics);
  const topReg =
    regs.find(
      (r) => r.worstSeverity === COMPARISON_SEVERITY.Regression.value,
    ) ?? regs[0];
  if (!topReg) {
    return '';
  }
  const p95Worst =
    topReg.p95?.severity === COMPARISON_SEVERITY.Regression.value ||
    topReg.p95?.severity === COMPARISON_SEVERITY.Warn.value;
  return `${topReg.metric}(${p95Worst ? 'p95' : 'p75'})`;
}

/**
 * Builds the "View regression details" collapsible.
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
        ? resolveBaseline(baseline, entry.presetName, entry.benchmarkName)
        : undefined;
      if (computeEntryHealth(entry, baselineMetrics) !== EntryHealth.Fail) {
        return [];
      }
      const worstLabel = getWorstViolationLabel(entry, baselineMetrics);
      const labelPart = worstLabel ? ` — ${worstLabel}` : '';
      const logHref = entry.artifactUrl ?? runUrl;
      const logAnchor = logHref ? ` <a href="${logHref}">[Show logs]</a>` : '';
      return [
        `<li><b>${entry.benchmarkName}</b> · ${entry.platform}-${entry.buildType}${labelPart}${logAnchor}</li>`,
      ];
    })
    .join('');

  if (!listItems) {
    return `<p>${failureLabel}</p>\n`;
  }

  return (
    `<p><strong>Regressions (${failureLabel})</strong></p>\n` +
    `<ul>${listItems}</ul>\n`
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

  const [
    interactionResult,
    startupResult,
    userJourneyResult,
    dappPageLoadResult,
    baselineResult,
  ] = await Promise.all([
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
      getUserJourneyBenchmarkBuildTypesForCurrentRun(),
    ),
    fetchBenchmarkEntries(
      hostUrl,
      Object.values(DAPP_PAGE_LOAD_PRESETS),
      DAPP_PAGE_LOAD_BENCHMARK_PLATFORMS,
      DAPP_PAGE_LOAD_BENCHMARK_BUILD_TYPES,
    ),
    fetchHistoricalPerformanceDataFromMain(),
  ]);

  const resolvedBaseline = baselineResult?.baseline ?? undefined;
  const baselineCommit = baselineResult?.latestCommit;
  const baselineTimestamp = baselineResult?.latestTimestamp;

  const allEntries = [
    ...startupResult.entries,
    ...interactionResult.entries,
    ...userJourneyResult.entries,
    ...dappPageLoadResult.entries,
  ];

  if (
    allEntries.length === 0 &&
    interactionResult.missingPresets.length === 0 &&
    startupResult.missingPresets.length === 0 &&
    userJourneyResult.missingPresets.length === 0 &&
    dappPageLoadResult.missingPresets.length === 0
  ) {
    return '';
  }

  const interactionHtml = buildBenchmarkSection(
    interactionResult,
    BENCHMARK_ANNOUNCE_SECTIONS.interaction,
    resolvedBaseline,
    runUrl,
  );
  const startupHtml = buildBenchmarkSection(
    startupResult,
    BENCHMARK_ANNOUNCE_SECTIONS.startup,
    resolvedBaseline,
    runUrl,
  );
  const userJourneyHtml = buildBenchmarkSection(
    userJourneyResult,
    BENCHMARK_ANNOUNCE_SECTIONS.userJourney,
    resolvedBaseline,
    runUrl,
  );
  const dappPageLoadHtml = buildBenchmarkSection(
    dappPageLoadResult,
    BENCHMARK_ANNOUNCE_SECTIONS.dappPageLoad,
    resolvedBaseline,
    runUrl,
  );

  const { passes, failures, warnings } = countHealthEntries(
    allEntries,
    resolvedBaseline,
  );
  const regressionDetailsHtml = buildFailingItemsHtml(
    allEntries,
    resolvedBaseline,
    failures,
    runUrl,
  );

  const matrixHtml = buildHealthMatrixHtml(allEntries, resolvedBaseline);

  const commitHash = baselineCommit?.slice(0, 7) ?? 'unknown';
  const commitDate = baselineTimestamp
    ? new Date(baselineTimestamp * 1000).toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      })
    : 'unknown';
  const commitUrl = baselineCommit
    ? `https://github.com/MetaMask/metamask-extension/commit/${baselineCommit}`
    : undefined;
  const commitLink = commitUrl
    ? `<a href="${commitUrl}">${commitHash}</a>`
    : commitHash;
  const pipelineLink = runUrl
    ? `<a href="${runUrl}">${benchmarkRunId}</a>`
    : (benchmarkRunId ?? '');
  const baselineLogsLink = `<a href="${EXTENSION_BENCHMARK_STATS_MAIN_PERFORMANCE_DATA_URL}">Baseline logs</a>`;
  const commitInfo = `\n\n<p><strong>Baseline (latest main)</strong>: ${commitLink} | <strong>Date</strong>: ${commitDate} | <strong>Pipeline</strong>: ${pipelineLink} | ${baselineLogsLink}</p>\n\n`;

  // Plain text only inside <summary> (no block elements like <p>).
  const summaryLine = `${sectionTitle} (Total: ${HEALTH_ICON[EntryHealth.Pass]} ${passes} pass · ${HEALTH_ICON[EntryHealth.Warn]} ${warnings} warn · ${HEALTH_ICON[EntryHealth.Fail]} ${failures} fail)`;
  const subsectionsHtml =
    interactionHtml + startupHtml + userJourneyHtml + dappPageLoadHtml;
  const content =
    commitInfo + matrixHtml + regressionDetailsHtml + subsectionsHtml;

  return `<details><summary>${summaryLine}</summary>\n<blockquote>\n${content}</blockquote>\n</details>\n\n`;
}
