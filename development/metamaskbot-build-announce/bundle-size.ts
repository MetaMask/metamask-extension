import type { ArtifactLinks } from './artifacts';

const bundlePartLabels = {
  background: 'background',
  ui: 'ui',
  common: 'common',
  other: 'other',
  contentScripts: 'content scripts',
} as const;

type BundlePart = keyof typeof bundlePartLabels;
type BundleSizeSummary = Partial<Record<string, number>>;
type StoredBundleSizeData = Record<string, BundleSizeSummary>;

const bundleParts = Object.keys(bundlePartLabels) as BundlePart[];

const zipLabel = 'zip';

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
  return Object.fromEntries(
    bundleParts.map((part) => [part, summary[part] ?? 0]),
  ) as Record<BundlePart, number>;
}

function getBaselineSizes(
  storedBundleSizeData: StoredBundleSizeData | null,
  mergeBaseCommitHash: string,
): Partial<Record<BundlePart | 'zip', number>> | null {
  return storedBundleSizeData?.[mergeBaseCommitHash] ?? null;
}

function getHumanReadableDiffSize(bytes: number): string {
  const size = getHumanReadableSize(bytes);

  return bytes > 0 ? `+${size}` : size;
}

function buildSizeDiffLine({
  label,
  currentSize,
  baselineSize,
}: {
  label: string;
  currentSize: number;
  baselineSize?: number;
}): string {
  if (baselineSize === undefined) {
    return `${label}: total ${getHumanReadableSize(currentSize)}, diff n/a`;
  }

  return `${label}: total ${getHumanReadableSize(currentSize)}, diff ${getHumanReadableDiffSize(
    currentSize - baselineSize,
  )} (${getPercentageChange(baselineSize, currentSize)}%)`;
}

function buildSectionBody(lines: string[], prefix?: string): string {
  const content = lines.map((line) => `<li>${line}</li>`).join('\n');
  const lead = prefix ? `${prefix}` : '';

  return `${lead}<ul>${content}</ul>`;
}

function buildDetails(summary: string, body: string): string {
  return `<details><summary>${summary}</summary>${body}</details>\n\n`;
}

async function fetchOptionalBundleSizeSummary(
  url: string,
): Promise<BundleSizeSummary | null> {
  try {
    return (await fetchJson(url, 'bundleSizeStats')) as BundleSizeSummary;
  } catch {
    return null;
  }
}

async function fetchOptionalStoredBundleSizeData(
  url: string,
): Promise<StoredBundleSizeData | null> {
  try {
    return (await fetchJson(url, 'bundleSizeData')) as StoredBundleSizeData;
  } catch {
    return null;
  }
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
    fetchOptionalBundleSizeSummary(artifacts.bundleSizeStats.url),
    fetchOptionalStoredBundleSizeData(artifacts.bundleSizeData.url),
  ]);

  if (!currentSummary) {
    return buildDetails('Bundle size diffs', 'Bundle size data unavailable.');
  }

  const currentSizes = getBundlePartSizes(currentSummary);
  const currentZipSize = currentSummary.zip ?? 0;
  const baselineSizes = getBaselineSizes(
    storedBundleSizeData,
    mergeBaseCommitHash,
  );

  if (!baselineSizes) {
    const unavailableLines = bundleParts.map((part) =>
      buildSizeDiffLine({
        label: bundlePartLabels[part],
        currentSize: currentSizes[part],
      }),
    );
    unavailableLines.push(
      buildSizeDiffLine({
        label: zipLabel,
        currentSize: currentZipSize,
      }),
    );

    return buildDetails(
      'Bundle size diffs',
      buildSectionBody(unavailableLines, 'Comparison unavailable.'),
    );
  }

  const sizeDiffRows = bundleParts.map((part) =>
    buildSizeDiffLine({
      label: bundlePartLabels[part],
      currentSize: currentSizes[part],
      baselineSize: baselineSizes[part],
    }),
  );
  sizeDiffRows.push(
    buildSizeDiffLine({
      label: zipLabel,
      currentSize: currentZipSize,
      baselineSize: baselineSizes.zip,
    }),
  );

  const sizeDiffBackground =
    currentSizes.background -
    (baselineSizes.background ?? 0) +
    currentSizes.common -
    (baselineSizes.common ?? 0);
  const sizeDiffUi =
    currentSizes.ui -
    (baselineSizes.ui ?? 0) +
    currentSizes.common -
    (baselineSizes.common ?? 0);

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

  const sizeDiffTitle = `Bundle size diffs${sizeDiffWarning ? ` [${sizeDiffWarning}]` : ''}`;

  return buildDetails(sizeDiffTitle, buildSectionBody(sizeDiffRows));
}
