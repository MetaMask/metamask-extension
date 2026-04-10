import {
  bundleParts,
  isBundleSizeSummary,
  mapBundleParts,
  type BundlePart,
  type BundleSizeBundler,
  type BundleSizeSummary,
  type StoredBundleSizeData,
} from '../lib/bundle-size';
import type { ArtifactLinks } from './artifacts';

const bundlePartLabels: Record<BundlePart, string> = {
  background: 'background',
  ui: 'ui',
  common: 'common',
  auxiliaryPages: 'auxiliary pages',
  contentScripts: 'content scripts',
};

const bundlerLabels: Record<BundleSizeBundler, string> = {
  browserify: 'Browserify',
  webpack: 'Webpack',
};

/** The threshold for whether to highlight a change in bundle size, in bytes. */
const BUNDLE_SIZE_THRESHOLD = 1_000;

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
  if (absBytes > kibibyteSize ** 2) {
    magnitudeIndex = 2;
  } else if (absBytes > kibibyteSize) {
    magnitudeIndex = 1;
  }
  return `${parseFloat(
    (bytes / kibibyteSize ** magnitudeIndex).toFixed(2),
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function fetchJson(url: string, label: string): Promise<unknown> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${label}, status ${response.statusText}`);
  }

  return await response.json();
}

function getBundlePartSizes(
  summary: BundleSizeSummary,
): Record<BundlePart, number> {
  return mapBundleParts((part) => summary[part]);
}

function getCurrentSummary(
  value: unknown,
  bundler: BundleSizeBundler,
): BundleSizeSummary | null {
  return isBundleSizeSummary(value) && value.bundler === bundler ? value : null;
}

function getBaselineSummary(
  value: unknown,
  mergeBaseCommitHash: string,
  bundler: BundleSizeBundler,
): BundleSizeSummary | null {
  if (!isRecord(value)) {
    return null;
  }

  const mergeBaseStats = value[mergeBaseCommitHash];

  if (!isRecord(mergeBaseStats)) {
    return null;
  }

  const summary = mergeBaseStats[bundler];

  return getCurrentSummary(summary, bundler);
}

function getHumanReadableDiffSize(bytes: number): string {
  const size = getHumanReadableSize(bytes);

  return bytes > 0 ? `+${size}` : size;
}

function buildBundlePartRow({
  part,
  currentSize,
  baselineSize,
}: {
  part: BundlePart;
  currentSize: number;
  baselineSize?: number;
}): string {
  const totalSize = getHumanReadableSize(currentSize);
  const diff =
    baselineSize === undefined
      ? 'n/a'
      : `${getHumanReadableDiffSize(currentSize - baselineSize)} (${getPercentageChange(
          baselineSize,
          currentSize,
        )}%)`;

  return `${bundlePartLabels[part]}: total ${totalSize}, diff ${diff}`;
}

function buildUnavailableComparisonContent(
  currentSizes: Record<BundlePart, number>,
): string {
  const currentSizeRows = bundleParts.map((part) =>
    buildBundlePartRow({
      part,
      currentSize: currentSizes[part],
    }),
  );

  return `<p>Comparison unavailable.</p><ul>${currentSizeRows
    .map((row) => `<li>${row}</li>`)
    .join('\n')}</ul>`;
}

function buildUnavailableBundleSizeContent(): string {
  return '<p>Bundle size data unavailable.</p>';
}

async function fetchOptionalBundleSizeSummary(
  url: string,
  label: string,
  bundler: BundleSizeBundler,
): Promise<BundleSizeSummary | null> {
  try {
    return getCurrentSummary(await fetchJson(url, label), bundler);
  } catch (error) {
    console.log(`Skipping ${label}: ${String(error)}`);
    return null;
  }
}

async function fetchOptionalStoredBundleSizeData(
  url: string,
): Promise<StoredBundleSizeData | null> {
  try {
    const value = await fetchJson(url, 'devBundleSizeStats');
    if (!isRecord(value)) {
      console.log('Skipping devBundleSizeStats: invalid payload');
      return null;
    }

    return value as StoredBundleSizeData;
  } catch (error) {
    console.log(`Skipping devBundleSizeStats: ${String(error)}`);
    return null;
  }
}

function buildBundlerBundleSizeDiffSection({
  bundler,
  currentSummary,
  storedBundleSizeData,
  mergeBaseCommitHash,
}: {
  bundler: BundleSizeBundler;
  currentSummary: BundleSizeSummary | null;
  storedBundleSizeData: StoredBundleSizeData | null;
  mergeBaseCommitHash: string;
}): string {
  const label = bundlerLabels[bundler];

  if (!currentSummary) {
    return `<details><summary>${label} bundle size diffs</summary>${buildUnavailableBundleSizeContent()}</details>\n\n`;
  }

  const currentSizes = getBundlePartSizes(currentSummary);
  const baselineSummary = getBaselineSummary(
    storedBundleSizeData,
    mergeBaseCommitHash,
    bundler,
  );

  if (!baselineSummary) {
    return `<details><summary>${label} bundle size diffs</summary>${buildUnavailableComparisonContent(
      currentSizes,
    )}</details>\n\n`;
  }

  const baselineSizes = getBundlePartSizes(baselineSummary);
  const diffs = mapBundleParts(
    (part) => currentSizes[part] - baselineSizes[part],
  );

  const sizeDiffRows = bundleParts.map((part) =>
    buildBundlePartRow({
      part,
      currentSize: currentSizes[part],
      baselineSize: baselineSizes[part],
    }),
  );

  const sizeDiffHiddenContent = `<ul>${sizeDiffRows
    .map((row) => `<li>${row}</li>`)
    .join('\n')}</ul>`;

  const sizeDiffBackground = diffs.background + diffs.common;
  const sizeDiffUi = diffs.ui + diffs.common;

  let sizeDiffWarning: string | undefined;
  if (
    sizeDiffBackground > BUNDLE_SIZE_THRESHOLD ||
    sizeDiffUi > BUNDLE_SIZE_THRESHOLD
  ) {
    sizeDiffWarning = '🚨 Warning! Bundle size has increased!';
  } else if (
    sizeDiffBackground < -BUNDLE_SIZE_THRESHOLD ||
    sizeDiffUi < -BUNDLE_SIZE_THRESHOLD
  ) {
    sizeDiffWarning = '🚀 Bundle size reduced!';
  }

  const sizeDiffTitle = `${label} bundle size diffs${sizeDiffWarning ? ` [${sizeDiffWarning}]` : ''}`;

  return `<details><summary>${sizeDiffTitle}</summary>${sizeDiffHiddenContent}</details>\n\n`;
}

/**
 * Fetches bundle size stats and builds the bundle size diff collapsible section.
 *
 * @param artifacts - The artifact links object from getArtifactLinks.
 * @param mergeBaseCommitHash - The merge base commit hash for comparison.
 * @returns HTML string for the bundle size diff section.
 */
export async function buildBundleSizeDiffSection(
  artifacts: ArtifactLinks,
  mergeBaseCommitHash: string,
): Promise<string> {
  const [browserifySummary, webpackSummary, storedBundleSizeData] =
    await Promise.all([
      fetchOptionalBundleSizeSummary(
        artifacts.bundleSizeStats.browserify.url,
        'browserifyBundleSizeStats',
        'browserify',
      ),
      fetchOptionalBundleSizeSummary(
        artifacts.bundleSizeStats.webpack.url,
        'webpackBundleSizeStats',
        'webpack',
      ),
      fetchOptionalStoredBundleSizeData(artifacts.bundleSizeData.url),
    ]);

  return (
    buildBundlerBundleSizeDiffSection({
      bundler: 'browserify',
      currentSummary: browserifySummary,
      storedBundleSizeData,
      mergeBaseCommitHash,
    }) +
    buildBundlerBundleSizeDiffSection({
      bundler: 'webpack',
      currentSummary: webpackSummary,
      storedBundleSizeData,
      mergeBaseCommitHash,
    })
  );
}
