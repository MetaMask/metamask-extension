import type { ArtifactLinks } from './artifacts';

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
const bundleParts = ['background', 'ui', 'common'] as const;
type BundlePart = (typeof bundleParts)[number];

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
  const prBundleSizeStatsResponse = await fetch(artifacts.bundleSizeStats.url);
  if (!prBundleSizeStatsResponse.ok) {
    throw new Error(
      `Failed to fetch prBundleSizeStats, status ${prBundleSizeStatsResponse.statusText}`,
    );
  }

  // This annotation narrows the untyped json() result to the known schema of the bundle size stats artifact.
  const prBundleSizeStats: Record<string, { size: number }> =
    await prBundleSizeStatsResponse.json();

  const prSizes: Record<BundlePart, number> = {
    background: prBundleSizeStats.background.size,
    ui: prBundleSizeStats.ui.size,
    common: prBundleSizeStats.common.size,
  };

  const baselineCommitHashes = bundleSizeBaselineCommitHashes
    .split(/\s+/u)
    .filter(Boolean);

  let sizeRows: string[] | undefined;
  let sizeDiffWarning: string | undefined;
  let noDiffReason: string | undefined;

  if (baselineCommitHashes.length === 0) {
    noDiffReason =
      'No bundle-size baseline commit was available for this build, so diff values are omitted.';
  } else {
    try {
      const devBundleSizeStatsResponse = await fetch(
        artifacts.bundleSizeData.url,
      );
      if (!devBundleSizeStatsResponse.ok) {
        throw new Error(
          `Failed to fetch devBundleSizeStats, status ${devBundleSizeStatsResponse.statusText}`,
        );
      }

      // This annotation narrows the untyped json() result to the known schema of the dev bundle size data.
      const devBundleSizeStats: Record<
        string,
        Record<string, number>
      > = await devBundleSizeStatsResponse.json();

      const baselineCommitHash = baselineCommitHashes.find(
        (commitHash) => devBundleSizeStats[commitHash],
      );

      if (baselineCommitHash) {
        const baselineStats = devBundleSizeStats[baselineCommitHash];

        const devSizes: Record<BundlePart, number> = {
          background: baselineStats.background ?? 0,
          ui: baselineStats.ui ?? 0,
          common: baselineStats.common ?? 0,
        };

        const diffs: Record<BundlePart, number> = {
          background: 0,
          ui: 0,
          common: 0,
        };

        for (const part of bundleParts) {
          diffs[part] = prSizes[part] - devSizes[part];
        }

        sizeRows = bundleParts.map(
          (part) =>
            `${part}: ${getHumanReadableSize(diffs[part])} (${getPercentageChange(
              devSizes[part],
              prSizes[part],
            )}%)`,
        );

        const sizeDiffBackground = diffs.background + diffs.common;
        const sizeDiffUi = diffs.ui + diffs.common;

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
      } else {
        noDiffReason =
          'No matching bundle-size baseline was found in the history data, so diff values are omitted.';
      }
    } catch (error) {
      console.warn('Could not build bundle size diff section.', error);
      noDiffReason =
        'Bundle-size history data could not be loaded, so diff values are omitted.';
    }
  }

  const bundleSizeContent = `<ul>${(
    sizeRows ??
    bundleParts.map((part) => `${part}: ${getHumanReadableSize(prSizes[part])}`)
  )
    .map((row) => `<li>${row}</li>`)
    .join('\n')}</ul>`;

  const noDiffContent = noDiffReason ? `<small>${noDiffReason}</small>` : '';
  const bundleSizeTitle = sizeRows
    ? `Bundle size diffs${sizeDiffWarning ? ` [${sizeDiffWarning}]` : ''}`
    : 'Bundle sizes';

  return `<details><summary>${bundleSizeTitle}</summary>${bundleSizeContent}${noDiffContent}</details>\n\n`;
}
