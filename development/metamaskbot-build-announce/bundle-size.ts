import {
  bundleParts,
  isBundleSizeSummary,
  mapBundleParts,
  type BundlePart,
  type BundleSizeSummary,
  type StoredBundleSizeData,
} from '../webpack/utils/bundle-size';
import type { ArtifactLinks } from './artifacts';

const bundlePartLabels: Record<BundlePart, string> = {
  background: 'background',
  ui: 'ui',
  common: 'common',
  other: 'other',
  contentScripts: 'content scripts',
};

const zipLabel = 'zip';
const bundleSizeTableHeader = [
  '| Status | Bundle | Total | Diff | Change |',
  '|:--:|---|---:|---:|---:|',
].join('\n');

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
  return mapBundleParts((part) => summary[part] ?? 0);
}

function getBaselineSummary(
  value: unknown,
  mergeBaseCommitHash: string,
): BundleSizeSummary | null {
  if (!isRecord(value)) {
    return null;
  }

  const mergeBaseStats = value[mergeBaseCommitHash];

  if (!isRecord(mergeBaseStats)) {
    return null;
  }

  return isBundleSizeSummary(mergeBaseStats) ? mergeBaseStats : null;
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

function buildZipRow({
  currentSize,
  baselineSize,
  status,
}: {
  currentSize: number;
  baselineSize?: number;
  status?: string;
}): string {
  return buildSizeRow({
    label: zipLabel,
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
      ? '-'
      : getHumanReadableDiffSize(currentSize - baselineSize);
  const change =
    baselineSize === undefined
      ? '-'
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
): string {
  const currentSizeRows = bundleParts.map((part) =>
    buildBundlePartRow({
      part,
      currentSize: currentSizes[part],
    }),
  );
  currentSizeRows.push(
    buildZipRow({
      currentSize: currentZipSize,
    }),
  );

  return [
    'Comparison unavailable.',
    '',
    bundleSizeTableHeader,
    ...currentSizeRows,
  ].join('\n');
}

function buildUnavailableBundleSizeContent(): string {
  return 'Bundle size data unavailable.';
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
    const value = await fetchJson(url, label);

    return isBundleSizeSummary(value) ? value : null;
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

function buildBundleSizeSection({
  currentSummary,
  storedBundleSizeData,
  mergeBaseCommitHash,
}: {
  currentSummary: BundleSizeSummary | null;
  storedBundleSizeData: StoredBundleSizeData | null;
  mergeBaseCommitHash: string;
}): string {
  if (!currentSummary) {
    return buildCollapsibleSection(
      'Bundle Size Diffs',
      buildUnavailableBundleSizeContent(),
    );
  }

  const currentSizes = getBundlePartSizes(currentSummary);
  const currentZipSize = currentSummary.zip ?? 0;
  const baselineSummary = getBaselineSummary(
    storedBundleSizeData,
    mergeBaseCommitHash,
  );

  if (!baselineSummary) {
    return buildCollapsibleSection(
      'Bundle Size Diffs',
      buildUnavailableComparisonContent(currentSizes, currentZipSize),
    );
  }

  const baselineSizes = getBundlePartSizes(baselineSummary);
  const baselineZipSize = baselineSummary.zip ?? 0;
  const diffs = mapBundleParts(
    (part) => currentSizes[part] - baselineSizes[part],
  );

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
    buildZipRow({
      currentSize: currentZipSize,
      baselineSize: baselineSummary.zip,
      status: getRowStatus({
        currentSize: currentZipSize,
        baselineSize: baselineSummary.zip,
      }),
    }),
  );

  const sizeDiffBackground = diffs.background + diffs.common;
  const sizeDiffUi = diffs.ui + diffs.common;

  let sizeDiffWarning: string | undefined;
  if (
    sizeDiffBackground > BUNDLE_SIZE_THRESHOLD ||
    sizeDiffUi > BUNDLE_SIZE_THRESHOLD
  ) {
    sizeDiffWarning = '[🚨 Warning! Bundle size has increased!]';
  } else if (
    sizeDiffBackground < -BUNDLE_SIZE_THRESHOLD ||
    sizeDiffUi < -BUNDLE_SIZE_THRESHOLD
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
 * @param mergeBaseCommitHash - The merge base commit hash for comparison.
 * @returns HTML string for the bundle size diff section.
 */
export async function buildBundleSizeDiffSection(
  artifacts: ArtifactLinks,
  mergeBaseCommitHash: string,
): Promise<string> {
  const [currentSummary, storedBundleSizeData] = await Promise.all([
    fetchOptionalBundleSizeSummary(
      artifacts.bundleSizeStats.url,
      'bundleSizeStats',
    ),
    fetchOptionalStoredBundleSizeData(artifacts.bundleSizeData.url),
  ]);

  return buildBundleSizeSection({
    currentSummary,
    storedBundleSizeData,
    mergeBaseCommitHash,
  });
}
