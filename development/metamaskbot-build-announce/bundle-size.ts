import {
  bundleParts,
  mapBundleParts,
  type BundlePart,
  type BundleSizeSummary,
  type StoredBundleSizeData,
} from '../webpack/utils/plugins/ManifestPlugin/stats';
import type { ArtifactLinks } from './artifacts';

const bundlePartLabels: Record<BundlePart, string> = {
  background: 'background',
  ui: 'ui',
  common: 'common',
  other: 'other',
  contentScripts: 'content scripts',
};

const bundleSizeTableHeader = [
  '| Status | Bundle | Total | Diff | Change |',
  '|:--:|---|---:|---:|---:|',
].join('\n');

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
  return mapBundleParts((part) => summary[part] ?? 0);
}

function getBaselineSummary(
  storedBundleSizeData: StoredBundleSizeData,
  baselineCommitHashes: string[],
): BundleSizeSummary | null {
  const baselineCommitHash = baselineCommitHashes.find(
    (commitHash) => storedBundleSizeData[commitHash],
  );

  return baselineCommitHash ? storedBundleSizeData[baselineCommitHash] : null;
}

function getHumanReadableDiffSize(bytes: number): string {
  const size = getHumanReadableSize(bytes);

  return bytes > 0 ? `+${size}` : size;
}

function getHumanReadablePercentageChange(change: number): string {
  return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
}

function buildBundlePartRow({
  part,
  currentSize,
  baselineSize,
  status,
}: {
  part: BundlePart;
  currentSize: number;
  baselineSize?: number;
  status?: string;
}): string {
  return buildSizeRow({
    label: bundlePartLabels[part],
    currentSize,
    baselineSize,
    status,
  });
}

function buildSizeRow({
  label,
  currentSize,
  baselineSize,
  status,
}: {
  label: string;
  currentSize: number;
  baselineSize?: number;
  status?: string;
}): string {
  const totalSize = getHumanReadableSize(currentSize);
  const diff =
    baselineSize === undefined
      ? 'n/a'
      : getHumanReadableDiffSize(currentSize - baselineSize);
  const change =
    baselineSize === undefined
      ? 'n/a'
      : getHumanReadablePercentageChange(
          getPercentageChange(baselineSize, currentSize),
        );

  return `| ${status ?? ''} | ${label} | ${totalSize} | ${diff} | ${change} |`;
}

function getRowStatus({
  currentSize,
  baselineSize,
}: {
  currentSize: number;
  baselineSize?: number;
}): string | undefined {
  if (baselineSize === undefined) {
    return undefined;
  }

  return currentSize - baselineSize > BUNDLE_SIZE_THRESHOLD ? '🚨' : '✅';
}

function buildUnavailableComparisonContent(
  currentSizes: Record<BundlePart, number>,
  currentZipSize: number,
  reason: string,
): string {
  const currentSizeRows = bundleParts.map((part) =>
    buildBundlePartRow({
      part,
      currentSize: currentSizes[part],
    }),
  );
  currentSizeRows.push(
    buildSizeRow({
      label: 'zip',
      currentSize: currentZipSize,
    }),
  );

  return [
    `<small>${reason}</small>`,
    '',
    bundleSizeTableHeader,
    ...currentSizeRows,
  ].join('\n');
}

function buildCollapsibleSection(summary: string, body: string): string {
  return [
    '<details>',
    `<summary><strong>${summary}</strong></summary>`,
    '',
    '<br>',
    '',
    body,
    '',
    '</details>',
    '',
  ].join('\n');
}

async function fetchOptionalBundleSizeSummary(
  url: string,
  label: string,
): Promise<BundleSizeSummary | null> {
  try {
    return (await fetchJson(url, label)) as BundleSizeSummary;
  } catch (error) {
    console.log(`Skipping ${label}: ${String(error)}`);
    return null;
  }
}

async function fetchOptionalStoredBundleSizeData(
  url: string,
): Promise<StoredBundleSizeData | null> {
  try {
    return (await fetchJson(url, 'devBundleSizeStats')) as StoredBundleSizeData;
  } catch (error) {
    console.log(`Skipping devBundleSizeStats: ${String(error)}`);
    return null;
  }
}

function buildBundleSizeSection({
  currentSummary,
  storedBundleSizeData,
  baselineCommitHashes,
}: {
  currentSummary: BundleSizeSummary | null;
  storedBundleSizeData: StoredBundleSizeData | null;
  baselineCommitHashes: string[];
}): string {
  if (!currentSummary) {
    return buildCollapsibleSection(
      'Bundle Size Diffs',
      'Bundle size data unavailable.',
    );
  }

  const currentSizes = getBundlePartSizes(currentSummary);
  const currentZipSize = currentSummary.zip ?? 0;

  if (baselineCommitHashes.length === 0) {
    return buildCollapsibleSection(
      'Bundle Size Diffs',
      buildUnavailableComparisonContent(
        currentSizes,
        currentZipSize,
        'No bundle-size baseline commit was available for this build, so diff values are omitted.',
      ),
    );
  }

  if (!storedBundleSizeData) {
    return buildCollapsibleSection(
      'Bundle Size Diffs',
      buildUnavailableComparisonContent(
        currentSizes,
        currentZipSize,
        'Bundle-size history data could not be loaded, so diff values are omitted.',
      ),
    );
  }

  const baselineSummary = getBaselineSummary(
    storedBundleSizeData,
    baselineCommitHashes,
  );

  if (!baselineSummary) {
    return buildCollapsibleSection(
      'Bundle Size Diffs',
      buildUnavailableComparisonContent(
        currentSizes,
        currentZipSize,
        'No matching bundle-size baseline was found in the history data, so diff values are omitted.',
      ),
    );
  }

  const sizeDiffRows = bundleParts.map((part) =>
    buildBundlePartRow({
      part,
      currentSize: currentSizes[part],
      baselineSize: baselineSummary[part],
      status: getRowStatus({
        currentSize: currentSizes[part],
        baselineSize: baselineSummary[part],
      }),
    }),
  );
  sizeDiffRows.push(
    buildSizeRow({
      label: 'zip',
      currentSize: currentZipSize,
      baselineSize: baselineSummary.zip,
      status: getRowStatus({
        currentSize: currentZipSize,
        baselineSize: baselineSummary.zip,
      }),
    }),
  );

  const getDiff = (part: BundlePart) =>
    baselineSummary[part] === undefined
      ? undefined
      : currentSizes[part] - baselineSummary[part];
  const commonDiff = getDiff('common');
  const backgroundDiff = getDiff('background');
  const uiDiff = getDiff('ui');
  const sizeDiffsForWarning = [
    backgroundDiff === undefined || commonDiff === undefined
      ? undefined
      : backgroundDiff + commonDiff,
    uiDiff === undefined || commonDiff === undefined
      ? undefined
      : uiDiff + commonDiff,
    getDiff('contentScripts'),
  ].filter((diff): diff is number => diff !== undefined);

  let sizeDiffWarning: string | undefined;
  if (sizeDiffsForWarning.some((diff) => diff > BUNDLE_SIZE_THRESHOLD)) {
    sizeDiffWarning = '[🚨 Warning! Bundle size has increased!]';
  } else if (
    sizeDiffsForWarning.some((diff) => diff < -BUNDLE_SIZE_THRESHOLD)
  ) {
    sizeDiffWarning = '[🚀 Bundle size reduced!]';
  }

  const sizeDiffTitle = `Bundle Size Diffs${sizeDiffWarning ? ` ${sizeDiffWarning}` : ''}`;

  return buildCollapsibleSection(
    sizeDiffTitle,
    [bundleSizeTableHeader, ...sizeDiffRows].join('\n'),
  );
}

/**
 * Fetches bundle size stats and builds the bundle size diff collapsible section.
 *
 * @param artifacts - The artifact links object from getArtifactLinks.
 * @param bundleSizeBaselineCommitHashes - Whitespace-separated baseline commit hash candidates, newest first.
 * @returns HTML string for the bundle size section.
 */
export async function buildBundleSizeDiffSection(
  artifacts: ArtifactLinks,
  bundleSizeBaselineCommitHashes = '',
): Promise<string> {
  const baselineCommitHashes = bundleSizeBaselineCommitHashes
    .split(/\s+/u)
    .filter(Boolean);
  const currentSummary = await fetchOptionalBundleSizeSummary(
    artifacts.bundleSizeStats.url,
    'bundleSizeStats',
  );
  const storedBundleSizeData =
    baselineCommitHashes.length === 0
      ? null
      : await fetchOptionalStoredBundleSizeData(artifacts.bundleSizeData.url);

  return buildBundleSizeSection({
    currentSummary,
    storedBundleSizeData,
    baselineCommitHashes,
  });
}
