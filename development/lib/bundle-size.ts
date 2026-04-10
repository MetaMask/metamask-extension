export const BUNDLE_SIZE_SCHEMA_VERSION = 4 as const;

export const BUNDLE_SIZE_ARTIFACT_FILE = 'bundle_size.json';

export const BUNDLE_SIZE_SUMMARY_FILE = 'bundle_size_stats.json';

export const WEBPACK_BUNDLE_ANALYZER_DIRECTORY = 'bundle-analyzer';

export const WEBPACK_BUNDLE_ANALYZER_REPORT = `${WEBPACK_BUNDLE_ANALYZER_DIRECTORY}/report.html`;

export const WEBPACK_BUNDLE_STATS_FILE = `${WEBPACK_BUNDLE_ANALYZER_DIRECTORY}/stats.json`;

export const WEBPACK_BUNDLE_STATS_SCHEMA_VERSION = 2 as const;

export const bundleParts = [
  'background',
  'ui',
  'common',
  'auxiliaryPages',
  'contentScripts',
] as const;

export const bundleSizeBundlers = ['browserify', 'webpack'] as const;

export type BundleSizeBundler = (typeof bundleSizeBundlers)[number];

export type BundlePart = (typeof bundleParts)[number];

export type FileStat = {
  name: string;
  size: number;
};

export type BundleStats = {
  name: BundlePart;
  size: number;
  fileList: FileStat[];
};

export type BundleStatsCollection = Record<BundlePart, FileStat[]>;

export type BundleSizeArtifact = {
  schemaVersion: typeof BUNDLE_SIZE_SCHEMA_VERSION;
  bundler: BundleSizeBundler;
} & Record<BundlePart, BundleStats>;

export type BundleSizeSummary = {
  schemaVersion: typeof BUNDLE_SIZE_SCHEMA_VERSION;
  bundler: BundleSizeBundler;
  timestamp: number;
} & Record<BundlePart, number>;

export type StoredBundleSizeData = Record<
  string,
  Partial<Record<BundleSizeBundler, BundleSizeSummary>>
>;

export type WebpackEntrypointFiles = {
  initialFiles: FileStat[];
  asyncFiles: FileStat[];
};

export type WebpackBundleStats = {
  schemaVersion: typeof WEBPACK_BUNDLE_STATS_SCHEMA_VERSION;
  entrypoints: Record<string, WebpackEntrypointFiles>;
};

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

function sortFileStats(fileList: FileStat[]): FileStat[] {
  return fileList.toSorted((left, right) =>
    left.name.localeCompare(right.name),
  );
}

function createBundleStats(
  name: BundlePart,
  fileList: FileStat[],
): BundleStats {
  const sortedFileList = sortFileStats(fileList);

  return {
    name,
    size: sortedFileList.reduce((total, file) => total + file.size, 0),
    fileList: sortedFileList,
  };
}

export function createBundleSizeArtifact(
  bundler: BundleSizeBundler,
  fileLists: BundleStatsCollection,
): BundleSizeArtifact {
  return {
    schemaVersion: BUNDLE_SIZE_SCHEMA_VERSION,
    bundler,
    ...mapBundleParts((part) => createBundleStats(part, fileLists[part])),
  };
}

export function createBundleSizeSummary(
  artifact: BundleSizeArtifact,
): BundleSizeSummary {
  return {
    schemaVersion: artifact.schemaVersion,
    bundler: artifact.bundler,
    ...mapBundleParts((part) => artifact[part].size),
    timestamp: Date.now(),
  };
}

function sortWebpackEntrypointFiles(
  entrypoint: WebpackEntrypointFiles,
): WebpackEntrypointFiles {
  return {
    initialFiles: sortFileStats(entrypoint.initialFiles),
    asyncFiles: sortFileStats(entrypoint.asyncFiles),
  };
}

export function createWebpackBundleStats(
  entrypoints: Record<string, WebpackEntrypointFiles>,
): WebpackBundleStats {
  return {
    schemaVersion: WEBPACK_BUNDLE_STATS_SCHEMA_VERSION,
    entrypoints: Object.fromEntries(
      Object.entries(entrypoints)
        .toSorted(([left], [right]) => left.localeCompare(right))
        .map(([name, assets]) => [name, sortWebpackEntrypointFiles(assets)]),
    ),
  };
}

export function isBundleSizeBundler(
  value: unknown,
): value is BundleSizeBundler {
  return (
    typeof value === 'string' &&
    bundleSizeBundlers.includes(value as BundleSizeBundler)
  );
}

function isFileStat(value: unknown): value is FileStat {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    typeof value.size === 'number'
  );
}

export function isWebpackBundleStats(
  value: unknown,
): value is WebpackBundleStats {
  return (
    isRecord(value) &&
    value.schemaVersion === WEBPACK_BUNDLE_STATS_SCHEMA_VERSION &&
    isRecord(value.entrypoints) &&
    Object.values(value.entrypoints).every(
      (entrypoint) =>
        isRecord(entrypoint) &&
        Array.isArray(entrypoint.initialFiles) &&
        entrypoint.initialFiles.every(isFileStat) &&
        Array.isArray(entrypoint.asyncFiles) &&
        entrypoint.asyncFiles.every(isFileStat),
    )
  );
}

export function isBundleSizeSummary(
  value: unknown,
): value is BundleSizeSummary {
  return (
    isRecord(value) &&
    value.schemaVersion === BUNDLE_SIZE_SCHEMA_VERSION &&
    isBundleSizeBundler(value.bundler) &&
    typeof value.timestamp === 'number' &&
    bundleParts.every((part) => typeof value[part] === 'number')
  );
}
