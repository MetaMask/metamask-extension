import type { ArtifactLinks, BundleSizeBundler } from './artifacts';

const bundleParts = ['background', 'ui', 'common', 'contentScripts'] as const;

type BundlePart = (typeof bundleParts)[number];

type BundlePartStats = {
  size: number;
};

type BundleSizeArtifactV2 = {
  schemaVersion: 2;
  bundler: BundleSizeBundler;
} & Record<BundlePart, BundlePartStats>;

type BundleSizeSummaryV2 = {
  schemaVersion: 2;
  bundler: BundleSizeBundler;
  timestamp: number;
} & Record<BundlePart, number>;

type StoredBundleSizeDataV2 = Record<
  string,
  Partial<Record<BundleSizeBundler, BundleSizeSummaryV2>>
>;

const bundlePartLabels: Record<BundlePart, string> = {
  background: 'background',
  ui: 'ui',
  common: 'common',
  contentScripts: 'content scripts',
};

const bundlerLabels: Record<BundleSizeBundler, string> = {
  browserify: 'Browserify',
  webpack: 'Webpack',
};

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

/** The threshold for whether to highlight a change in bundle size, in bytes. */
const BUNDLE_SIZE_THRESHOLD = 1_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isBundleSizeArtifact(
  value: unknown,
  bundler: BundleSizeBundler,
): value is BundleSizeArtifactV2 {
  if (!isRecord(value)) {
    return false;
  }

  if (value.schemaVersion !== 2 || value.bundler !== bundler) {
    return false;
  }

  return bundleParts.every((part) => {
    const partValue = value[part];
    return isRecord(partValue) && typeof partValue.size === 'number';
  });
}

function isBundleSizeSummary(
  value: unknown,
  bundler: BundleSizeBundler,
): value is BundleSizeSummaryV2 {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.schemaVersion !== 2 ||
    value.bundler !== bundler ||
    typeof value.timestamp !== 'number'
  ) {
    return false;
  }

  return bundleParts.every((part) => typeof value[part] === 'number');
}

async function fetchJson(url: string, label: string): Promise<unknown> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${label}, status ${response.statusText}`);
  }

  return await response.json();
}

function getCurrentSizes(
  artifact: BundleSizeArtifactV2,
): Record<BundlePart, number> {
  return {
    background: artifact.background.size,
    ui: artifact.ui.size,
    common: artifact.common.size,
    contentScripts: artifact.contentScripts.size,
  };
}

function getBaselineSummary(
  value: unknown,
  mergeBaseCommitHash: string,
  bundler: BundleSizeBundler,
): BundleSizeSummaryV2 | null {
  if (!isRecord(value)) {
    return null;
  }

  const mergeBaseStats = value[mergeBaseCommitHash];

  if (!isRecord(mergeBaseStats)) {
    return null;
  }

  const summary = mergeBaseStats[bundler];

  return isBundleSizeSummary(summary, bundler) ? summary : null;
}

function buildUnavailableComparisonContent(
  currentSizes: Record<BundlePart, number>,
): string {
  const currentSizeRows = bundleParts.map(
    (part) =>
      `${bundlePartLabels[part]}: ${getHumanReadableSize(currentSizes[part])}`,
  );

  return `<p>Comparison unavailable.</p><ul>${currentSizeRows
    .map((row) => `<li>${row}</li>`)
    .join('\n')}</ul>`;
}

function buildBundlerBundleSizeDiffSection({
  bundler,
  artifact,
  storedBundleSizeData,
  mergeBaseCommitHash,
}: {
  bundler: BundleSizeBundler;
  artifact: BundleSizeArtifactV2;
  storedBundleSizeData: StoredBundleSizeDataV2 | unknown;
  mergeBaseCommitHash: string;
}): string {
  const label = bundlerLabels[bundler];
  const currentSizes = getCurrentSizes(artifact);
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

  const baselineSizes: Record<BundlePart, number> = {
    background: baselineSummary.background,
    ui: baselineSummary.ui,
    common: baselineSummary.common,
    contentScripts: baselineSummary.contentScripts,
  };

  const diffs: Record<BundlePart, number> = {
    background: 0,
    ui: 0,
    common: 0,
    contentScripts: 0,
  };

  for (const part of bundleParts) {
    diffs[part] = currentSizes[part] - baselineSizes[part];
  }

  const sizeDiffRows = bundleParts.map(
    (part) =>
      `${bundlePartLabels[part]}: ${getHumanReadableSize(diffs[part])} (${getPercentageChange(
        baselineSizes[part],
        currentSizes[part],
      )}%)`,
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
    sizeDiffWarning = `🚨 Warning! Bundle size has increased!`;
  } else if (
    sizeDiffBackground < -BUNDLE_SIZE_THRESHOLD ||
    sizeDiffUi < -BUNDLE_SIZE_THRESHOLD
  ) {
    sizeDiffWarning = `🚀 Bundle size reduced!`;
  }

  const sizeDiffTitle = `${label} bundle size diffs${sizeDiffWarning ? ` [${sizeDiffWarning}]` : ''}`;

  return `<details><summary>${sizeDiffTitle}</summary>${sizeDiffHiddenContent}</details>\n\n`;
}

/**
 * Fetches bundle size stats and builds the bundle size diff collapsible section.
 *
 * @param artifacts - The artifact links object from getArtifactLinks.
 * @param mergeBaseCommitHash - The merge base commit hash for comparison.
 * @returns HTML string for the bundle size diff section, or empty string on error.
 */
export async function buildBundleSizeDiffSection(
  artifacts: ArtifactLinks,
  mergeBaseCommitHash: string,
): Promise<string> {
  const [
    browserifyBundleSizeStats,
    webpackBundleSizeStats,
    storedBundleSizeData,
  ] = await Promise.all([
    fetchJson(
      artifacts.bundleSizeStats.browserify.url,
      'browserifyBundleSizeStats',
    ),
    fetchJson(artifacts.bundleSizeStats.webpack.url, 'webpackBundleSizeStats'),
    fetchJson(artifacts.bundleSizeData.url, 'devBundleSizeStats'),
  ]);

  if (!isBundleSizeArtifact(browserifyBundleSizeStats, 'browserify')) {
    throw new Error('Invalid browserify bundle size artifact');
  }

  if (!isBundleSizeArtifact(webpackBundleSizeStats, 'webpack')) {
    throw new Error('Invalid webpack bundle size artifact');
  }

  return (
    buildBundlerBundleSizeDiffSection({
      bundler: 'browserify',
      artifact: browserifyBundleSizeStats,
      storedBundleSizeData,
      mergeBaseCommitHash,
    }) +
    buildBundlerBundleSizeDiffSection({
      bundler: 'webpack',
      artifact: webpackBundleSizeStats,
      storedBundleSizeData,
      mergeBaseCommitHash,
    })
  );
}
