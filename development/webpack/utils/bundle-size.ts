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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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

export function isBundleSizeSummary(
  value: unknown,
): value is BundleSizeSummary {
  return (
    isRecord(value) &&
    typeof value.timestamp === 'number' &&
    typeof value.background === 'number' &&
    typeof value.ui === 'number' &&
    typeof value.common === 'number' &&
    (value.other === undefined || typeof value.other === 'number') &&
    (value.contentScripts === undefined ||
      typeof value.contentScripts === 'number') &&
    (value.zip === undefined || typeof value.zip === 'number')
  );
}
