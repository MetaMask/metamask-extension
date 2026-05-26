import type { BundleSizeCategory } from './types';

export const BUNDLE_SIZE_SUMMARY_FILE = 'bundle-size/[browser].json';
export const BUNDLE_SIZE_DEBUG_FILE = BUNDLE_SIZE_SUMMARY_FILE.replace(
  /\.json$/u,
  '.debug.json',
);

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

type BundleSizeCategoryAssets = Record<BundleSizeCategory, Set<string>>;

const bundleSizeCategories = [
  'background',
  'ui',
  'other',
  'contentScripts',
] as const satisfies readonly BundleSizeCategory[];

function sumAssetSizes(
  assetNames: Iterable<string>,
  assetSizes: ReadonlyMap<string, number>,
): number {
  let total = 0;

  for (const assetName of assetNames) {
    const size = assetSizes.get(assetName);

    if (size === undefined) {
      throw new Error(
        `Missing size for normalized emitted asset "${assetName}"`,
      );
    }

    total += size;
  }

  return total;
}

export function createBundleSizeCategoryAssets(): BundleSizeCategoryAssets {
  return Object.fromEntries(
    bundleSizeCategories.map((category) => [category, new Set<string>()]),
  ) as BundleSizeCategoryAssets;
}

export function getBundlePartSizes(
  categoryAssets: BundleSizeCategoryAssets,
  assetSizes: ReadonlyMap<string, number>,
): Record<BundlePart, number> {
  const commonAssets = categoryAssets.background
    // @ts-expect-error - Node types need to be updated.
    .intersection(categoryAssets.ui)
    .difference(categoryAssets.contentScripts) as Set<string>;
  const backgroundAssets = categoryAssets.background
    // @ts-expect-error - Node types need to be updated.
    .difference(categoryAssets.ui)
    .difference(categoryAssets.contentScripts) as Set<string>;
  const uiAssets = categoryAssets.ui
    // @ts-expect-error - Node types need to be updated.
    .difference(categoryAssets.background)
    .difference(categoryAssets.contentScripts) as Set<string>;
  const otherAssets = categoryAssets.other
    // @ts-expect-error - Node types need to be updated.
    .difference(categoryAssets.background)
    .difference(categoryAssets.ui)
    .difference(categoryAssets.contentScripts) as Set<string>;

  return {
    background: sumAssetSizes(backgroundAssets, assetSizes),
    ui: sumAssetSizes(uiAssets, assetSizes),
    common: sumAssetSizes(commonAssets, assetSizes),
    other: sumAssetSizes(otherAssets, assetSizes),
    contentScripts: sumAssetSizes(categoryAssets.contentScripts, assetSizes),
  };
}

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
    timestamp,
  }: {
    zip?: number;
    timestamp: number;
  },
): BundleSizeSummary {
  return {
    ...mapBundleParts((part) => partSizes[part]),
    zip,
    timestamp,
  };
}
