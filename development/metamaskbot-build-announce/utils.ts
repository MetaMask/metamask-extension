/**
 * Shared types, rendering functions, and helpers for the PR announcement comment.
 */
import startCase from 'lodash/startCase';
import {
  BENCHMARK_PLATFORMS,
  BENCHMARK_BUILD_TYPES,
  STARTUP_PRESETS,
} from '../../test/e2e/benchmarks/utils/constants';
import type { BenchmarkResults } from '../../test/e2e/benchmarks/utils/types';

/**
 * Wraps a section builder so that any missing-data error is caught,
 * logged, and returns a fallback string instead of crashing the comment.
 *
 * Pass a non-empty `fallback` only for top-level sections where a visible
 * "data not available" message is acceptable. For subsections whose parent
 * uses an empty-content guard (e.g. buildUiStartupSection), omit `fallback`
 * (defaults to '') so the guard can fire correctly when all subsections fail.
 *
 * @param sectionName - Human-readable name for the log message.
 * @param fn - The builder function to execute.
 * @param fallback - String to return on error. Defaults to ''.
 * @returns The section HTML, the fallback string on error, or '' if the builder returns null.
 */
export async function safeBuildSection(
  sectionName: string,
  fn: () => Promise<string | null> | string | null,
  fallback: string = '',
): Promise<string> {
  try {
    return (await fn()) ?? '';
  } catch (error) {
    console.log(
      `No data available for ${sectionName}; skipping (${String(error)})`,
    );
    return fallback;
  }
}

/**
 * A parsed benchmark entry with its name and result data.
 * Only `mean` is guaranteed after filtering; statistical fields may be absent.
 */
export type BenchmarkEntry = {
  benchmarkName: string;
  entry: Pick<BenchmarkResults, 'mean'> &
    Partial<Omit<BenchmarkResults, 'mean'>>;
};

/**
 * Page load benchmark data indexed by [platform][buildType][page].
 * Each page entry contains statistical measures (mean, stdDev, etc.)
 * keyed by metric name with string-encoded numeric values.
 */
export type PageLoadEntry = Record<string, Record<string, string>>;

export type PageLoadBenchmarkResults = Record<
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
  if (from === 0) {
    return to === 0 ? 0 : 100;
  }
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

type ArtifactLink = { url: string; label: string };

type ArtifactLinkMap = {
  bundleSizeData: ArtifactLink;
  bundleSizeStats: ArtifactLink;
  interactionStats: ArtifactLink;
  storybook: ArtifactLink;
  tsMigrationDashboard: ArtifactLink;
  depViz: ArtifactLink;
  allArtifacts: ArtifactLink;
};

export type ArtifactLinks = ArtifactLinkMap & {
  link: (key: keyof ArtifactLinkMap) => string;
};

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
): ArtifactLinks {
  const ARTIFACT_LINK_MAP: ArtifactLinkMap = {
    bundleSizeData: {
      url: 'https://raw.githubusercontent.com/MetaMask/extension_bundlesize_stats/main/stats/bundle_size_data.json',
      label: 'Bundle Size Data',
    },
    bundleSizeStats: {
      url: `${hostUrl}/bundle-size/bundle_size.json`,
      label: 'Bundle Size Stats',
    },
    interactionStats: {
      url: `${hostUrl}/benchmarks/benchmark-chrome-browserify-interactionUserActions.json`,
      label: 'Interaction Stats',
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

  const link = (key: keyof ArtifactLinkMap) =>
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
 * @param summary - The collapsible header text (e.g. '👆 Interaction Benchmarks').
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
 * Extracts valid benchmark entries from a fetched JSON artifact.
 * Filters out entries that don't have a `mean` object.
 *
 * @param data - Raw parsed JSON from a benchmark artifact.
 * @returns Array of name/entry pairs.
 */
export function extractEntries(
  data: Record<string, Partial<BenchmarkResults>>,
): BenchmarkEntry[] {
  return Object.entries(data)
    .filter(
      (pair): pair is [string, BenchmarkEntry['entry']] =>
        pair[1].mean !== null &&
        pair[1].mean !== undefined &&
        typeof pair[1].mean === 'object',
    )
    .map(([name, entry]) => ({ benchmarkName: name, entry }));
}

/**
 * Fetches benchmark data for given presets and renders a collapsible HTML section.
 *
 * @param hostUrl - Base URL for CI artifacts.
 * @param presets - Preset names to fetch (e.g. INTERACTION_PRESETS, USER_JOURNEY_PRESETS).
 * @param summary - Collapsible header text (e.g. '👆 Interaction Benchmarks').
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
    try {
      const data = await fetchBenchmarkJson(
        hostUrl,
        BENCHMARK_PLATFORMS[0],
        BENCHMARK_BUILD_TYPES[0],
        preset,
      );
      if (data) {
        allEntries.push(...extractEntries(data));
      }
    } catch (error) {
      console.error(
        `Failed to fetch benchmark preset "${preset}": ${String(error)}`,
      );
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
type BenchmarkDimensions = {
  platforms: Set<string>;
  buildTypes: Set<string>;
  pages: Set<string>;
  metrics: Set<string>;
  measures: Set<string>;
};

function discoverDimensions(
  benchmarkResults: PageLoadBenchmarkResults,
): BenchmarkDimensions {
  const platforms = new Set<string>();
  const buildTypes = new Set<string>();
  const pages = new Set<string>();
  const metrics = new Set<string>();
  const measures = new Set<string>();

  const data = benchmarkResults as Record<
    string,
    Record<string, Record<string, PageLoadEntry>>
  >;
  for (const platform of Object.keys(data)) {
    platforms.add(platform);
    for (const buildType of Object.keys(data[platform])) {
      buildTypes.add(buildType);
      for (const page of Object.keys(data[platform][buildType])) {
        pages.add(page);
        const pageBenchmark = data[platform][buildType][page];
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
export function buildPageLoadTable(
  benchmarkResults: PageLoadBenchmarkResults,
): string {
  const { platforms, pages, metrics, measures } =
    discoverDimensions(benchmarkResults);

  if (platforms.size === 0 || metrics.size === 0) {
    return '';
  }

  const data = benchmarkResults as Record<
    string,
    Record<string, Record<string, PageLoadEntry>>
  >;
  const tableRows: string[] = [];
  for (const platform of platforms) {
    const buildTypesInPlatform = Object.keys(data[platform]);
    for (const buildType of buildTypesInPlatform) {
      for (const page of pages) {
        const buildLabel = `${startCase(platform)} ${startCase(buildType)} ${startCase(page)}`;
        const metricRows: string[] = [];
        for (const metric of metrics) {
          let metricData = `<td>${metric}</td>`;
          for (const measure of measures) {
            let output = '-';

            if (data[platform][buildType][page]?.[measure]) {
              const individualMetricString =
                data[platform][buildType][page][measure][metric];

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
        if (metricRows.length > 0) {
          metricRows[0] = `<td rowspan="${metrics.size}">${buildLabel}</td>${metricRows[0]}`;
          for (const row of metricRows) {
            tableRows.push(`<tr>${row}</tr>`);
          }
        }
      }
    }
  }

  if (tableRows.length === 0) {
    return '';
  }

  const headers = ['Build', 'Metric'];
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
 * Maps legacy benchmark-gate.json page keys (pre-rename) to their current
 * STARTUP_PRESETS values. Used to stay compatible with the hosted
 * benchmark-gate.json on CloudFront until it is updated to use the new names.
 */
const LEGACY_PAGE_KEY_MAP: Record<string, string> = {
  standardHome: STARTUP_PRESETS.STANDARD_HOME,
  powerUserHome: STARTUP_PRESETS.POWER_USER_HOME,
};

/** Shape of the benchmark-gate.json configuration. */
type BenchmarkGateConfig = {
  gates: Record<
    string,
    Record<string, Record<string, Record<string, Record<string, number>>>>
  >;
};

/**
 * Compares benchmark results against gate thresholds and returns
 * an HTML warning string for any exceeded gates.
 *
 * @param benchmarkResults - The page load benchmark results.
 * @param benchmarkGateUrl - URL of the benchmark-gate.json file.
 * @returns HTML string with warnings, or empty string if all gates pass.
 */
export async function runBenchmarkGate(
  benchmarkResults: PageLoadBenchmarkResults,
  benchmarkGateUrl: string,
): Promise<string> {
  console.log(`Fetching benchmark gate from ${benchmarkGateUrl}`);

  const benchmarkResponse = await fetch(benchmarkGateUrl);
  if (!benchmarkResponse.ok) {
    throw new Error(
      `Failed to fetch benchmark gate data, status ${benchmarkResponse.statusText}`,
    );
  }

  // This annotation narrows the untyped json() result to the known schema of the benchmark-gate.json config.
  const { gates }: BenchmarkGateConfig = await benchmarkResponse.json();

  const exceededSums = { mean: 0, p95: 0 };
  let benchmarkGateBody = '';

  const data = benchmarkResults as Record<
    string,
    Record<string, Record<string, PageLoadEntry>>
  >;
  for (const platform of Object.keys(gates)) {
    for (const buildType of Object.keys(gates[platform])) {
      for (const page of Object.keys(gates[platform][buildType])) {
        const resolvedPage = LEGACY_PAGE_KEY_MAP[page] ?? page;
        const pageData = data[platform]?.[buildType]?.[resolvedPage];
        if (!pageData) {
          continue;
        }
        for (const measure of Object.keys(gates[platform][buildType][page])) {
          const measureData = pageData[measure];
          if (!measureData) {
            continue;
          }
          for (const metric of Object.keys(
            gates[platform][buildType][page][measure],
          )) {
            const raw = measureData[metric];
            if (raw === undefined || raw === null) {
              continue;
            }
            const benchmarkValue = parseFloat(raw);
            const gateValue = gates[platform][buildType][page][measure][metric];

            if (benchmarkValue > gateValue) {
              const ceiledValue = Math.ceil(benchmarkValue);

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

    // TODO: Send exceeded benchmark gate results to Slack instead of pinging in PR comments
    // https://github.com/MetaMask/MetaMask-planning/issues/6842
  }

  return benchmarkGateBody;
}
