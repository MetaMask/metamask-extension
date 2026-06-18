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
  categories: BundleSizeCategory[];
  initialFiles: BundleSizeAssetStat[];
  asyncFiles: BundleSizeAssetStat[];
};

type BundleSizeCategoryAssets = Record<BundleSizeCategory, Set<string>>;
type NonContentBundleSizeCategory = Exclude<
  BundleSizeCategory,
  'contentScripts'
>;

const bundleSizeCategories = [
  'background',
  'ui',
  'other',
  'contentScripts',
] as const satisfies readonly BundleSizeCategory[];
const nonContentBundleSizeCategories = [
  'background',
  'ui',
  'other',
] as const satisfies readonly NonContentBundleSizeCategory[];

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
  const nonContentAssetCategoryCount = new Map<string, number>();

  for (const category of nonContentBundleSizeCategories) {
    for (const assetName of categoryAssets[category]) {
      if (categoryAssets.contentScripts.has(assetName)) {
        continue;
      }
      nonContentAssetCategoryCount.set(
        assetName,
        (nonContentAssetCategoryCount.get(assetName) ?? 0) + 1,
      );
    }
  }

  const commonAssets = new Set(
    [...nonContentAssetCategoryCount]
      .filter(([, categoryCount]) => categoryCount > 1)
      .map(([assetName]) => assetName),
  );
  const getCategorySpecificAssets = (
    category: NonContentBundleSizeCategory,
  ) =>
    [...categoryAssets[category]].filter(
      (assetName) =>
        !categoryAssets.contentScripts.has(assetName) &&
        !commonAssets.has(assetName),
    );

  return {
    background: sumAssetSizes(
      getCategorySpecificAssets('background'),
      assetSizes,
    ),
    ui: sumAssetSizes(getCategorySpecificAssets('ui'), assetSizes),
    common: sumAssetSizes(commonAssets, assetSizes),
    other: sumAssetSizes(getCategorySpecificAssets('other'), assetSizes),
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
