import startCase from 'lodash/startCase';
import {
  ENTRY_BENCHMARK_PLATFORMS,
  ENTRY_BENCHMARK_BUILD_TYPES,
} from '../../shared/constants/benchmarks';
import {
  STARTUP_PRESETS,
  INTERACTION_PRESETS,
  USER_JOURNEY_PRESETS,
} from '../../test/e2e/benchmarks/utils/constants';
import type {
  BenchmarkResults,
  StatisticalResult,
} from '../../test/e2e/benchmarks/utils/types';

/** A parsed benchmark entry with its name and the stats we render. */
export type BenchmarkEntry = {
  benchmarkName: string;
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
 * @returns Flat BenchmarkEntry array with only the fields we render.
 */
export function extractEntries(
  data: Record<string, BenchmarkResults>,
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
      allEntries.push(...extractEntries(data));
    } else {
      missingPresets.push(`${platform}/${buildType}/${preset}`);
    }
  }

  return { entries: allEntries, missingPresets };
}

/**
 * Renders a single HTML table row cell value, rounding numbers or returning '-'.
 *
 * @param stats - The stats record (e.g. entry.stdDev).
 * @param metric - The metric key.
 * @returns Rounded string or '-'.
 */
function formatCellValue(stats: StatisticalResult, metric: string): string {
  const value = stats[metric];
  return typeof value === 'number' ? Math.round(value).toString() : '-';
}

/**
 * Builds table rows from benchmark entries.
 *
 * @param entries - Array of benchmark entries with names.
 * @returns Array of HTML table row strings.
 */
export function buildTableRows(entries: BenchmarkEntry[]): string[] {
  const tableRows: string[] = [];

  for (const { benchmarkName, mean, min, max, stdDev, p75, p95 } of entries) {
    const metrics = Object.keys(mean);
    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];
      let row = '';
      if (i === 0) {
        row += `<td rowspan="${metrics.length}">${startCase(benchmarkName)}</td>`;
      }
      row += `<td>${metric}</td>`;
      row += `<td align="right">${Math.round(mean[metric])}</td>`;
      row += `<td align="right">${formatCellValue(min, metric)}</td>`;
      row += `<td align="right">${formatCellValue(max, metric)}</td>`;
      row += `<td align="right">${formatCellValue(stdDev, metric)}</td>`;
      row += `<td align="right">${formatCellValue(p75, metric)}</td>`;
      row += `<td align="right">${formatCellValue(p95, metric)}</td>`;
      tableRows.push(`<tr>${row}</tr>`);
    }
  }

  return tableRows;
}

/**
 * Builds a benchmark HTML section with a collapsible table.
 * Surfaces a warning for any missing presets so reviewers can see
 * exactly which data is absent (prevents silent bypass).
 *
 * @param result - Fetched entries and missing preset descriptions.
 * @param summary - The collapsible header text (e.g. '👆 Interaction Benchmarks').
 * @returns HTML string or empty string if no data at all.
 */
export function buildBenchmarkSection(
  result: FetchBenchmarkResult,
  summary: string,
): string {
  try {
    const { entries, missingPresets } = result;
    if (entries.length === 0 && missingPresets.length === 0) {
      return '';
    }
    const rows = buildTableRows(entries);
    let warningHtml = '';
    if (missingPresets.length > 0) {
      warningHtml = `<p>⚠️ <b>Missing data:</b> ${missingPresets.join(', ')}</p>\n`;
    }
    const columns = [
      'Benchmark',
      'Metric',
      'Mean (ms)',
      'Min (ms)',
      'Max (ms)',
      'Std Dev (ms)',
      'P75 (ms)',
      'P95 (ms)',
    ];
    const header = `<thead><tr>${columns.map((c) => `<th>${c}</th>`).join('')}</tr></thead>`;
    let content = warningHtml;
    if (rows.length > 0) {
      content += `<table>${header}<tbody>${rows.join('')}</tbody></table>\n`;
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
 * @param hostUrl - Base URL for CI artifacts.
 * @returns HTML string for the collapsible section, or empty string.
 */
export async function buildPerformanceBenchmarksSection(
  hostUrl: string,
): Promise<string> {
  const sectionTitle = '⚡ Performance Benchmarks';

  const [interactionResult, startupResult, userJourneyResult] =
    await Promise.all([
      fetchBenchmarkEntries(hostUrl, Object.values(INTERACTION_PRESETS)),
      fetchBenchmarkEntries(hostUrl, Object.values(STARTUP_PRESETS)),
      fetchBenchmarkEntries(hostUrl, Object.values(USER_JOURNEY_PRESETS)),
    ]);

  const interactionHtml = buildBenchmarkSection(
    interactionResult,
    '👆 Interaction Benchmarks',
  );
  const startupHtml = buildBenchmarkSection(
    startupResult,
    '🔌 Startup Benchmarks',
  );
  const userJourneyHtml = buildBenchmarkSection(
    userJourneyResult,
    '🧭 User Journey Benchmarks',
  );

  // TODO: Introduce a Traffic Light System for Regression Detection
  // https://github.com/MetaMask/MetaMask-planning/issues/6993

  if (!interactionHtml && !startupHtml && !userJourneyHtml) {
    return '';
  }

  const content = `${interactionHtml}${startupHtml}${userJourneyHtml}`;
  return `<details><summary>${sectionTitle}</summary>\n<blockquote>\n${content}</blockquote>\n</details>\n\n`;
}
