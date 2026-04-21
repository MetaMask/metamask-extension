import type { BundleSizeCategory } from './types';

export const BUNDLE_SIZE_SUMMARY_FILE = 'bundle_size_stats.json';

export const bundleParts = [
  'background',
  'ui',
  'common',
  'other',
  'contentScripts',
] as const;

export type BundlePart = (typeof bundleParts)[number];

export type BundleSizeSummary = {
  background: number;
  ui: number;
  common: number;
  other?: number;
  contentScripts?: number;
  zip?: number;
  timestamp: number;
};

export type StoredBundleSizeData = Record<string, BundleSizeSummary>;

export type BundleSizeAssetStat = {
  name: string;
  size: number;
};

export type BundleSizeDebugEntrypoint = {
  category: BundleSizeCategory;
  initialFiles: BundleSizeAssetStat[];
  asyncFiles: BundleSizeAssetStat[];
};

export type BundleSizeDebugArtifact = {
  entrypoints: Record<string, BundleSizeDebugEntrypoint>;
};

export function mapBundleParts<TResult>(
  mapPart: (part: BundlePart) => TResult,
): Record<BundlePart, TResult> {
  return Object.fromEntries(
    bundleParts.map((part) => [part, mapPart(part)]),
  ) as Record<BundlePart, TResult>;
}

export function createBundleSizeSummary(
  partSizes: Record<BundlePart, number>,
  {
    zip,
    timestamp = Date.now(),
  }: {
    zip?: number;
    timestamp?: number;
  } = {},
): BundleSizeSummary {
  return {
    ...mapBundleParts((part) => partSizes[part]),
    zip,
    timestamp,
  };
}
