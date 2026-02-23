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
  const url = `${hostUrl}/benchmarks/benchmark-${platform}-${buildType}-${preset}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  const data: Result = await response.json();
  return data;
}

/**
 * Extracts benchmark entries from a fetched JSON artifact.
 *
 * @param data - Raw parsed JSON from a benchmark artifact.
 * @returns Flat BenchmarkEntry array with only the fields we render.
 */
export function extractEntries(
  data: Record<string, Partial<BenchmarkResults>>,
): BenchmarkEntry[] {
  return Object.entries(data)
    .filter(([, raw]) => raw.mean != null)
    .map(([name, raw]) => ({
      benchmarkName: name,
      mean: raw.mean as StatisticalResult,
      min: raw.min as StatisticalResult,
      max: raw.max as StatisticalResult,
      stdDev: raw.stdDev as StatisticalResult,
      p75: raw.p75 as StatisticalResult,
      p95: raw.p95 as StatisticalResult,
    }));
}

/**
 * Fetches and aggregates benchmark entries for a given set of presets.
 * Iterates all platform/buildType combos defined in ENTRY_BENCHMARK_PLATFORMS
 * and ENTRY_BENCHMARK_BUILD_TYPES (shared/constants/benchmarks.ts), so adding
 * a new target only requires updating those constants.
 *
 * @param hostUrl - Base URL for CI artifacts.
 * @param presets - Preset names to fetch (e.g. INTERACTION_PRESETS values).
 * @returns Array of parsed benchmark entries across all presets.
 */
export async function fetchBenchmarkEntries(
  hostUrl: string,
  presets: string[],
): Promise<BenchmarkEntry[]> {
  const allEntries: BenchmarkEntry[] = [];
  for (const platform of ENTRY_BENCHMARK_PLATFORMS) {
    for (const buildType of ENTRY_BENCHMARK_BUILD_TYPES) {
      for (const preset of presets) {
        const data = await fetchBenchmarkJson(
          hostUrl,
          platform,
          buildType,
          preset,
        );
        if (data) {
          allEntries.push(...extractEntries(data));
        }
      }
    }
  }
  return allEntries;
}

/**
 * Renders a single HTML table row cell value, rounding numbers or returning '-'.
 *
 * @param stats - The stats record (e.g. entry.stdDev).
 * @param metric - The metric key.
 * @returns Rounded string or '-'.
 */
function formatCellValue(
  stats: StatisticalResult,
  metric: string,
): string {
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
 * Wraps table rows in a collapsible `<details>` section.
 *
 * @param summary - The summary text for the collapsible header.
 * @param columns - Column headers for the table.
 * @param rows - Pre-built HTML row strings.
 * @returns Full HTML string.
 */
function wrapInDetailsTable(
  summary: string,
  columns: string[],
  rows: string[],
): string {
  const header = `<thead><tr>${columns.map((c) => `<th>${c}</th>`).join('')}</tr></thead>`;
  const table = `<table>${header}<tbody>${rows.join('')}</tbody></table>`;
  return `<details><summary>${summary}</summary>${table}</details>\n\n`;
}

/**
 * Builds a benchmark HTML section with a collapsible table.
 *
 * @param entries - Parsed benchmark entries.
 * @param summary - The collapsible header text (e.g. '👆 Interaction Benchmarks').
 * @returns HTML string or empty string if no data.
 */
export function buildBenchmarkSection(
  entries: BenchmarkEntry[],
  summary: string,
): string {
  if (entries.length === 0) {
    return '';
  }
  const rows = buildTableRows(entries);
  return wrapInDetailsTable(
    summary,
    [
      'Benchmark',
      'Metric',
      'Mean (ms)',
      'Min (ms)',
      'Max (ms)',
      'Std Dev (ms)',
      'P75 (ms)',
      'P95 (ms)',
    ],
    rows,
  );
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

  const [interactionEntries, startupEntries, userJourneyEntries] =
    await Promise.all([
      fetchBenchmarkEntries(hostUrl, Object.values(INTERACTION_PRESETS)),
      fetchBenchmarkEntries(hostUrl, Object.values(STARTUP_PRESETS)),
      fetchBenchmarkEntries(hostUrl, Object.values(USER_JOURNEY_PRESETS)),
    ]);

  const interactionHtml = buildBenchmarkSection(
    interactionEntries,
    '👆 Interaction Benchmarks',
  );
  const startupHtml = buildBenchmarkSection(
    startupEntries,
    '🔌 Startup Benchmarks',
  );
  const userJourneyHtml = buildBenchmarkSection(
    userJourneyEntries,
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
