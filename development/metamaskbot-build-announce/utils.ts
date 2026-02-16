/**
 * Shared types, rendering functions, and helpers for the PR announcement comment.
 */
import startCase from 'lodash/startCase';
import {
  BENCHMARK_PLATFORMS,
  BENCHMARK_BUILD_TYPES,
} from '../../test/e2e/benchmarks/utils/constants';
import type {
  BenchmarkType,
  Persona,
} from '../../test/e2e/benchmarks/utils/types';

/**
 * A single benchmark entry from a JSON artifact.
 * Shared across user action and performance benchmark results.
 */
export type BenchmarkEntryResult = {
  testTitle: string;
  persona: Persona;
  benchmarkType?: BenchmarkType;
  mean: Record<string, number>;
  min: Record<string, number>;
  max: Record<string, number>;
  stdDev: Record<string, number>;
  p75: Record<string, number>;
  p95: Record<string, number>;
};

/**
 * A parsed benchmark entry with its name and result data.
 * Only `mean` is guaranteed after filtering; statistical fields may be absent.
 */
export type BenchmarkEntry = {
  benchmarkName: string;
  entry: Pick<BenchmarkEntryResult, 'mean'> &
    Partial<Omit<BenchmarkEntryResult, 'mean'>>;
};

/**
 * Page load benchmark data indexed by [platform][buildType][page].
 * Each page entry contains statistical measures (mean, stdDev, etc.)
 * keyed by metric name with string-encoded numeric values.
 */
export type PageLoadEntry = Record<string, Record<string, string>>;

export type BenchmarkResults = Record<
  (typeof BENCHMARK_PLATFORMS)[number],
  Record<(typeof BENCHMARK_BUILD_TYPES)[number], Record<string, PageLoadEntry>>
>;

/**
 * The threshold for whether to highlight a change in bundle size, in bytes.
 */
export const BUNDLE_SIZE_THRESHOLD = 1_000;

/**
 * Converts a byte count to a human-readable string (e.g. "1.5 KiB").
 *
 * @param bytes - The size in bytes.
 * @returns Formatted string.
 */
export function getHumanReadableSize(bytes: number): string {
  if (!bytes) {
    return '0 Bytes';
  }

  const absBytes = Math.abs(bytes);
  const kibibyteSize = 1024;
  const magnitudes = ['Bytes', 'KiB', 'MiB'];
  let magnitudeIndex = 0;
  if (absBytes > Math.pow(kibibyteSize, 2)) {
    magnitudeIndex = 2;
  } else if (absBytes > kibibyteSize) {
    magnitudeIndex = 1;
  }
  return `${parseFloat(
    (bytes / Math.pow(kibibyteSize, magnitudeIndex)).toFixed(2),
  )} ${magnitudes[magnitudeIndex]}`;
}

/**
 * Calculates the percentage change between two values.
 *
 * @param from - The original value.
 * @param to - The new value.
 * @returns Percentage change rounded to 2 decimal places.
 */
export function getPercentageChange(from: number, to: number): number {
  return parseFloat((((to - from) / Math.abs(from)) * 100).toFixed(2));
}

/**
 * Check whether an artifact exists.
 *
 * @param url - The URL of the artifact to check.
 * @returns True if the artifact exists, false if it doesn't.
 */
export async function artifactExists(url: string): Promise<boolean> {
  const response = await fetch(url, { method: 'HEAD' });
  return response.ok;
}

/**
 * Builds a map of CI artifact URLs and a helper to render HTML links.
 *
 * @param hostUrl - Base URL for hosted artifacts.
 * @param owner - GitHub repo owner.
 * @param repository - GitHub repo name.
 * @param runId - GitHub Actions run ID.
 * @returns Object with artifact URLs and a `link()` helper.
 */
export function getArtifactLinks(
  hostUrl: string,
  owner: string,
  repository: string,
  runId: string,
) {
  const ARTIFACT_LINK_MAP = {
    bundleSizeData: {
      url: 'https://raw.githubusercontent.com/MetaMask/extension_bundlesize_stats/main/stats/bundle_size_data.json',
      label: 'Bundle Size Data',
    },
    bundleSizeStats: {
      url: `${hostUrl}/bundle-size/bundle_size.json`,
      label: 'Bundle Size Stats',
    },
    userActionsStats: {
      url: `${hostUrl}/benchmarks/benchmark-chrome-browserify-userActions.json`,
      label: 'User Actions Stats',
    },
    storybook: {
      url: `${hostUrl}/storybook-build/index.html`,
      label: 'Storybook',
    },
    tsMigrationDashboard: {
      url: `${hostUrl}/ts-migration-dashboard/index.html`,
      label: 'Dashboard',
    },
    depViz: {
      url: `${hostUrl}/lavamoat-viz/index.html`,
      label: 'Build System',
    },
    allArtifacts: {
      url: `https://github.com/${owner}/${repository}/actions/runs/${runId}#artifacts`,
      label: 'all artifacts',
    },
  };

  const link = (key: keyof typeof ARTIFACT_LINK_MAP) =>
    `<a href="${ARTIFACT_LINK_MAP[key].url}">${ARTIFACT_LINK_MAP[key].label}</a>`;

  return { ...ARTIFACT_LINK_MAP, link };
}

type BuildType = {
  chrome?: string;
  firefox?: string;
};

/**
 * Returns a map of extension build download links keyed by build variant.
 *
 * @param hostUrl - Base URL for hosted artifacts.
 * @param version - The extension version string (from package.json).
 * @returns Map of label → { chrome?, firefox? } URLs.
 */
export function getBuildLinks(
  hostUrl: string,
  version: string,
): Record<string, BuildType> {
  return {
    builds: {
      chrome: `${hostUrl}/build-dist-browserify/builds/metamask-chrome-${version}.zip`,
      firefox: `${hostUrl}/build-dist-mv2-browserify/builds/metamask-firefox-${version}.zip`,
    },
    'builds (beta)': {
      chrome: `${hostUrl}/build-beta-browserify/builds/metamask-beta-chrome-${version}-beta.0.zip`,
      firefox: `${hostUrl}/build-beta-mv2-browserify/builds/metamask-beta-firefox-${version}-beta.0.zip`,
    },
    'builds (flask)': {
      chrome: `${hostUrl}/build-flask-browserify/builds/metamask-flask-chrome-${version}-flask.0.zip`,
      firefox: `${hostUrl}/build-flask-mv2-browserify/builds/metamask-flask-firefox-${version}-flask.0.zip`,
    },
    'builds (test)': {
      chrome: `${hostUrl}/build-test-browserify/builds/metamask-chrome-${version}.zip`,
      firefox: `${hostUrl}/build-test-mv2-browserify/builds/metamask-firefox-${version}.zip`,
    },
    'builds (test-flask)': {
      chrome: `${hostUrl}/build-test-flask-browserify/builds/metamask-flask-chrome-${version}-flask.0.zip`,
      firefox: `${hostUrl}/build-test-flask-mv2-browserify/builds/metamask-flask-firefox-${version}-flask.0.zip`,
    },
  };
}

/**
 * Renders build links as HTML content rows (e.g. "builds: chrome, firefox").
 *
 * @param buildLinks - Map from getBuildLinks.
 * @returns Array of HTML strings, one per build variant.
 */
export function formatBuildLinks(
  buildLinks: Record<string, BuildType>,
): string[] {
  return Object.entries(buildLinks).map(([label, builds]) => {
    const links = Object.entries(builds).map(
      ([platform, url]) => `<a href="${url}">${platform}</a>`,
    );
    return `${label}: ${links.join(', ')}`;
  });
}

/** Bundle file roots used for source-map-explorer artifact discovery. */
const FILE_ROOTS = [
  'background',
  'common',
  'ui',
  'content-script',
  'offscreen',
] as const;

/**
 * Discovers source-map-explorer bundle artifacts and returns an HTML markup list.
 *
 * @param hostUrl - Base URL for hosted artifacts.
 * @returns HTML `<ul>` string of discovered bundle links.
 */
export async function discoverBundleArtifacts(
  hostUrl: string,
): Promise<string> {
  const bundles: Record<string, string[]> = {};

  for (const fileRoot of FILE_ROOTS) {
    bundles[fileRoot] = [];
    let fileIndex = 0;
    let url = `${hostUrl}/source-map-explorer/${fileRoot}-${fileIndex}.html`;
    console.log(`Verifying ${url}`);
    while (await artifactExists(url)) {
      bundles[fileRoot].push(`<a href="${url}">${fileIndex}</a>`);
      fileIndex += 1;
      url = `${hostUrl}/source-map-explorer/${fileRoot}-${fileIndex}.html`;
      console.log(`Verifying ${url}`);
    }
    console.log(`Not found: ${url}`);
  }

  return `<ul>${Object.keys(bundles)
    .map((key) => `<li>${key}: ${bundles[key].join(', ')}</li>`)
    .join('')}</ul>`;
}

/**
 * Renders a single HTML table row cell value, rounding numbers or returning '-'.
 *
 * @param stats - The stats record (e.g. entry.stdDev).
 * @param metric - The metric key.
 * @returns Rounded string or '-'.
 */
function formatCellValue(
  stats: Record<string, number> | undefined,
  metric: string,
): string {
  const value = stats?.[metric];
  return typeof value === 'number' ? Math.round(value).toString() : '-';
}

/**
 * Builds table rows from benchmark entries.
 * Shared between user actions and performance tables.
 *
 * @param entries - Array of benchmark entries with names.
 * @returns Array of HTML table row strings.
 */
export function buildTableRows(entries: BenchmarkEntry[]): string[] {
  const tableRows: string[] = [];

  for (const { benchmarkName, entry } of entries) {
    const metrics = Object.keys(entry.mean);
    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];
      let row = '';
      if (i === 0) {
        row += `<td rowspan="${metrics.length}">${startCase(benchmarkName)}</td>`;
      }
      row += `<td>${metric}</td>`;
      row += `<td align="right">${Math.round(entry.mean[metric])}</td>`;
      row += `<td align="right">${formatCellValue(entry.stdDev, metric)}</td>`;
      row += `<td align="right">${formatCellValue(entry.p75, metric)}</td>`;
      row += `<td align="right">${formatCellValue(entry.p95, metric)}</td>`;
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
 * @param summary - The collapsible header text (e.g. '🏃 User Actions Benchmark').
 * @param firstColumn - Label for the first column (e.g. 'Action', 'Benchmark').
 * @returns HTML string or empty string if no data.
 */
export function buildBenchmarkSection(
  entries: BenchmarkEntry[],
  summary: string,
  firstColumn: string,
): string {
  if (entries.length === 0) {
    return '';
  }
  const rows = buildTableRows(entries);
  return wrapInDetailsTable(
    summary,
    [
      firstColumn,
      'Metric',
      'Mean (ms)',
      'Std Dev (ms)',
      'P75 (ms)',
      'P95 (ms)',
    ],
    rows,
  );
}

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
export async function fetchBenchmarkJson(
  hostUrl: string,
  platform: string,
  buildType: string,
  preset: string,
): Promise<Record<string, BenchmarkEntryResult> | null> {
  const url = `${hostUrl}/benchmarks/benchmark-${platform}-${buildType}-${preset}.json`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    console.log(
      `No benchmark data found for ${platform}-${buildType}-${preset}`,
    );
    return null;
  }
}

/**
 * Extracts valid benchmark entries from a fetched JSON artifact.
 * Filters out entries that don't have a `mean` object.
 *
 * @param data - Raw parsed JSON from a benchmark artifact.
 * @returns Array of name/entry pairs.
 */
export function extractEntries(
  data: Record<string, Partial<BenchmarkEntryResult>>,
): BenchmarkEntry[] {
  return Object.entries(data)
    .filter(
      (pair): pair is [string, BenchmarkEntry['entry']] =>
        pair[1].mean !== undefined && typeof pair[1].mean === 'object',
    )
    .map(([name, entry]) => ({ benchmarkName: name, entry }));
}

/**
 * Fetches benchmark data for given presets and renders a collapsible HTML section.
 *
 * @param hostUrl - Base URL for CI artifacts.
 * @param presets - Preset names to fetch (e.g. USER_ACTION_PRESETS, PERFORMANCE_PRESETS).
 * @param summary - Collapsible header text (e.g. '🏃 User Actions Benchmark').
 * @param firstColumn - Label for the first table column (e.g. 'Action', 'Benchmark').
 * @returns HTML string for the collapsible section, or empty string if no data.
 */
export async function buildBenchmarkSectionComment(
  hostUrl: string,
  presets: string[],
  summary: string,
  firstColumn: string,
): Promise<string> {
  const allEntries: BenchmarkEntry[] = [];

  for (const preset of presets) {
    const data = await fetchBenchmarkJson(
      hostUrl,
      'chrome',
      'browserify',
      preset,
    );
    if (data) {
      allEntries.push(...extractEntries(data));
    }
  }

  return buildBenchmarkSection(allEntries, summary, firstColumn);
}

/**
 * Discovers all unique dimensions (platforms, buildTypes, pages, measures, metrics)
 * from the benchmark results data.
 *
 * @param benchmarkResults - The page load benchmark results.
 * @returns Sets of all discovered dimension values.
 */
function discoverDimensions(benchmarkResults: BenchmarkResults) {
  const platforms = new Set<string>();
  const buildTypes = new Set<string>();
  const pages = new Set<string>();
  const metrics = new Set<string>();
  const measures = new Set<string>();

  for (const platform of Object.keys(benchmarkResults)) {
    platforms.add(platform);
    for (const buildType of Object.keys(benchmarkResults[platform])) {
      buildTypes.add(buildType);
      for (const page of Object.keys(benchmarkResults[platform][buildType])) {
        pages.add(page);
        const pageBenchmark = benchmarkResults[platform][buildType][page];
        const pageLoadMeasures = Object.keys(pageBenchmark).filter(
          (key) =>
            typeof pageBenchmark[key] === 'object' &&
            pageBenchmark[key] !== null,
        );
        for (const measure of pageLoadMeasures) {
          measures.add(measure);
          for (const metric of Object.keys(pageBenchmark[measure])) {
            metrics.add(metric);
          }
        }
      }
    }
  }

  return { platforms, buildTypes, pages, metrics, measures };
}

/**
 * Builds the page load HTML table from benchmark results.
 *
 * @param benchmarkResults - The page load benchmark results.
 * @returns HTML table string.
 */
export function buildPageLoadTable(benchmarkResults: BenchmarkResults): string {
  const { platforms, buildTypes, pages, metrics, measures } =
    discoverDimensions(benchmarkResults);

  const tableRows: string[] = [];
  for (const platform of platforms) {
    const pageRows: string[] = [];

    const buildTypesInPlatform = Object.keys(benchmarkResults[platform]);
    for (const buildType of buildTypesInPlatform) {
      for (const page of pages) {
        const metricRows: string[] = [];
        for (const metric of metrics) {
          let metricData = `<td>${metric}</td>`;
          for (const measure of measures) {
            let output = '-';

            if (benchmarkResults[platform][buildType][page]) {
              const individualMetricString =
                benchmarkResults[platform][buildType][page][measure][metric];

              const individualMetricNumber = Math.round(
                parseFloat(individualMetricString),
              );

              if (!isNaN(individualMetricNumber)) {
                output = individualMetricNumber.toString();
              }
            }
            metricData += `<td align="right">${output}</td>`;
          }
          metricRows.push(metricData);
        }
        metricRows[0] = `<td rowspan="${metrics.size}">${startCase(
          buildType,
        )}</td><td rowspan="${metrics.size}">${startCase(page)}</td>${
          metricRows[0]
        }`;
        pageRows.push(...metricRows);
      }
    }
    pageRows[0] = `<td rowspan="${
      pages.size * buildTypes.size * metrics.size
    }">${startCase(platform)}</td>${pageRows[0]}`;
    for (const row of pageRows) {
      tableRows.push(`<tr>${row}</tr>`);
    }
  }

  const headers = ['Platform', 'BuildType', 'Page', 'Metric'];
  for (const measure of measures) {
    headers.push(`${startCase(measure)} (ms)`);
  }
  const tableHeader = `<thead><tr>${headers
    .map((h) => `<th>${h}</th>`)
    .join('')}</tr></thead>`;
  const tableBody = `<tbody>${tableRows.join('')}</tbody>`;
  return `<table>${tableHeader}${tableBody}</table>`;
}

/**
 * Compares benchmark results against gate thresholds and returns
 * an HTML warning string for any exceeded gates.
 *
 * @param benchmarkResults - The page load benchmark results.
 * @param benchmarkGateUrl - URL of the benchmark-gate.json file.
 * @returns HTML string with warnings, or empty string if all gates pass.
 */
export async function runBenchmarkGate(
  benchmarkResults: BenchmarkResults,
  benchmarkGateUrl: string,
): Promise<string> {
  const exceededSums = { mean: 0, p95: 0 };
  let benchmarkGateBody = '';

  console.log(`Fetching benchmark gate from ${benchmarkGateUrl}`);
  try {
    const benchmarkResponse = await fetch(benchmarkGateUrl);
    if (!benchmarkResponse.ok) {
      throw new Error(
        `Failed to fetch benchmark gate data, status ${benchmarkResponse.statusText}`,
      );
    }

    const { gates, pingThresholds } = await benchmarkResponse.json();

    for (const platform of Object.keys(gates)) {
      for (const buildType of Object.keys(gates[platform])) {
        for (const page of Object.keys(gates[platform][buildType])) {
          for (const measure of Object.keys(gates[platform][buildType][page])) {
            for (const metric of Object.keys(
              gates[platform][buildType][page][measure],
            )) {
              const benchmarkValue =
                benchmarkResults[platform][buildType][page][measure][metric];

              const gateValue =
                gates[platform][buildType][page][measure][metric];

              if (benchmarkValue > gateValue) {
                const ceiledValue = Math.ceil(parseFloat(benchmarkValue));

                if (measure === 'mean') {
                  exceededSums.mean += ceiledValue - gateValue;
                } else if (measure === 'p95') {
                  exceededSums.p95 += ceiledValue - gateValue;
                }

                benchmarkGateBody += `Benchmark value ${ceiledValue} exceeds gate value ${gateValue} for ${platform} ${buildType} ${page} ${measure} ${metric}<br>\n`;
              }
            }
          }
        }
      }
    }

    if (benchmarkGateBody) {
      benchmarkGateBody += `<b>Sum of mean exceeds: ${
        exceededSums.mean
      }ms | Sum of p95 exceeds: ${
        exceededSums.p95
      }ms<br>\nSum of all benchmark exceeds: ${
        exceededSums.mean + exceededSums.p95
      }ms</b><br>\n`;

      if (
        exceededSums.mean > pingThresholds.mean ||
        exceededSums.p95 > pingThresholds.p95 ||
        exceededSums.mean + exceededSums.p95 >
          pingThresholds.mean + pingThresholds.p95
      ) {
        benchmarkGateBody = `cc: @HowardBraham<br>\n${benchmarkGateBody}`;
      }
    }
  } catch (error) {
    console.error(
      `Error encountered fetching benchmark gate data: '${String(error)}'`,
    );
  }

  return benchmarkGateBody;
}
