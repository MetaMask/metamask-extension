import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { exitWithError } from '../../../development/lib/exit-with-error';
import {
  getFirstParentDirectoryThatExists,
  isWritable,
} from '../../helpers/file';

const SCHEMA_VERSION = 2 as const;

const backgroundFiles = [
  'scripts/runtime-lavamoat.js',
  'scripts/lockdown-more.js',
  'scripts/sentry-install.js',
  'scripts/policy-load.js',
];

const uiFiles = [
  'scripts/sentry-install.js',
  'scripts/runtime-lavamoat.js',
  'scripts/lockdown-more.js',
  'scripts/policy-load.js',
];

const contentScriptFiles = [
  'scripts/contentscript.js',
  'scripts/inpage.js',
  'vendor/trezor/content-script.js',
];

const webpackUiSurfaceEntrypoints = [
  ['bootstrap'],
  ['home'],
  ['notification'],
  ['popup'],
  ['sidepanel'],
  ['loading'],
  ['popup-init'],
] as const;

const webpackBackgroundSurfaceEntrypoints = [
  ['service-worker', 'service-worker.js'],
  ['offscreen'],
  [
    'usb-permissions',
    'trezor-usb-permissions',
    'vendor/trezor/usb-permissions.js',
  ],
] as const;

const webpackContentScriptEntrypoints = [
  ['scripts/contentscript.js'],
  ['scripts/inpage.js'],
  ['vendor/trezor/content-script.js'],
] as const;

const BackgroundFileRegex = /^background-[0-9]*\.js$/u;
const CommonFileRegex = /^common-[0-9]*\.js$/u;
const UIFileRegex = /^ui-[0-9]*\.js$/u;

export type Bundler = 'browserify' | 'webpack';

export type BundlePart = 'background' | 'ui' | 'common' | 'contentScripts';

export type FileStat = {
  name: string;
  size: number;
};

export type BundleStats = {
  name: BundlePart;
  size: number;
  fileList: FileStat[];
};

export type BundleSizeArtifactV2 = {
  schemaVersion: typeof SCHEMA_VERSION;
  bundler: Bundler;
  background: BundleStats;
  ui: BundleStats;
  common: BundleStats;
  contentScripts: BundleStats;
};

export type BundleSizeSummaryV2 = {
  schemaVersion: typeof SCHEMA_VERSION;
  bundler: Bundler;
  background: number;
  ui: number;
  common: number;
  contentScripts: number;
  timestamp: number;
};

type BundleStatsCollection = Record<BundlePart, FileStat[]>;

type WebpackAssetReference = string | { name?: string | null };

type WebpackChunkGroup = {
  assets?: WebpackAssetReference[];
};

type WebpackStatsAsset = {
  name?: string | null;
  size?: number | null;
};

type WebpackStatsFile = {
  assets?: WebpackStatsAsset[];
  assetsByChunkName?: Record<string, string | string[]>;
  entrypoints?:
    | Record<string, WebpackChunkGroup>
    | (WebpackChunkGroup & { name?: string | null })[];
  namedChunkGroups?:
    | Record<string, WebpackChunkGroup>
    | (WebpackChunkGroup & { name?: string | null })[];
};

function sortFileStats(fileList: FileStat[]): FileStat[] {
  return [...fileList].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

function getBundleSize(fileList: FileStat[]): number {
  return fileList.reduce((total, file) => total + file.size, 0);
}

function createBundleStats(
  name: BundlePart,
  fileList: FileStat[],
): BundleStats {
  const sortedFileList = sortFileStats(fileList);

  return {
    name,
    size: getBundleSize(sortedFileList),
    fileList: sortedFileList,
  };
}

function createBundleSizeArtifact(
  bundler: Bundler,
  fileLists: BundleStatsCollection,
): BundleSizeArtifactV2 {
  return {
    schemaVersion: SCHEMA_VERSION,
    bundler,
    background: createBundleStats('background', fileLists.background),
    ui: createBundleStats('ui', fileLists.ui),
    common: createBundleStats('common', fileLists.common),
    contentScripts: createBundleStats(
      'contentScripts',
      fileLists.contentScripts,
    ),
  };
}

export function createBundleSizeSummary(
  artifact: BundleSizeArtifactV2,
): BundleSizeSummaryV2 {
  return {
    schemaVersion: artifact.schemaVersion,
    bundler: artifact.bundler,
    background: artifact.background.size,
    ui: artifact.ui.size,
    common: artifact.common.size,
    contentScripts: artifact.contentScripts.size,
    timestamp: Date.now(),
  };
}

function isJavaScriptAsset(assetName: string): boolean {
  return (
    assetName.endsWith('.js') ||
    assetName.endsWith('.mjs') ||
    assetName.endsWith('.cjs')
  );
}

function normalizeRelativePath(filePath: string): string {
  return filePath.split(path.sep).join(path.posix.sep);
}

async function listFilesRecursively(
  rootDirectory: string,
  currentDirectory = rootDirectory,
): Promise<FileStat[]> {
  const directoryEntries = await fs.readdir(currentDirectory, {
    withFileTypes: true,
  });
  const fileLists = await Promise.all(
    directoryEntries.map(async (entry) => {
      const absolutePath = path.join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        return await listFilesRecursively(rootDirectory, absolutePath);
      }

      if (!entry.isFile()) {
        return [];
      }

      const stats = await fs.stat(absolutePath);

      return [
        {
          name: normalizeRelativePath(
            path.relative(rootDirectory, absolutePath),
          ),
          size: stats.size,
        },
      ];
    }),
  );

  return fileLists.flat();
}

async function getDistFileStats(distDirectory: string): Promise<FileStat[]> {
  const absoluteDistDirectory = path.resolve(distDirectory);
  const files = await listFilesRecursively(absoluteDistDirectory);

  return sortFileStats(files);
}

export async function collectBrowserifyBundleSizeArtifact(
  distDirectory: string,
): Promise<BundleSizeArtifactV2> {
  const files = await getDistFileStats(distDirectory);
  const fileLists: BundleStatsCollection = {
    background: [],
    ui: [],
    common: [],
    contentScripts: [],
  };

  for (const file of files) {
    const baseName = path.posix.basename(file.name);

    if (contentScriptFiles.includes(file.name)) {
      fileLists.contentScripts.push(file);
    }

    if (CommonFileRegex.test(baseName)) {
      fileLists.common.push(file);
    } else if (
      backgroundFiles.includes(file.name) ||
      BackgroundFileRegex.test(baseName)
    ) {
      fileLists.background.push(file);
    } else if (uiFiles.includes(file.name) || UIFileRegex.test(baseName)) {
      fileLists.ui.push(file);
    }
  }

  return createBundleSizeArtifact('browserify', fileLists);
}

function normalizeChunkGroupMap<TChunkGroup extends { name?: string | null }>(
  groups?: Record<string, TChunkGroup> | TChunkGroup[],
): Record<string, TChunkGroup> {
  if (!groups) {
    return {};
  }

  if (!Array.isArray(groups)) {
    return groups;
  }

  return groups.reduce<Record<string, TChunkGroup>>((result, group) => {
    if (group.name) {
      result[group.name] = group;
    }
    return result;
  }, {});
}

function normalizeAssetName(asset: WebpackAssetReference): string | null {
  if (typeof asset === 'string') {
    return asset;
  }

  return asset.name ?? null;
}

function getChunkGroupAssets(
  stats: WebpackStatsFile,
  groupName: string,
): string[] {
  const entrypoints = normalizeChunkGroupMap(stats.entrypoints);
  const namedChunkGroups = normalizeChunkGroupMap(stats.namedChunkGroups);
  const group = entrypoints[groupName] ?? namedChunkGroups[groupName];

  if (group?.assets) {
    return group.assets
      .map(normalizeAssetName)
      .filter((assetName): assetName is string => {
        return Boolean(assetName) && isJavaScriptAsset(assetName);
      });
  }

  const assetsByChunkName = stats.assetsByChunkName?.[groupName];
  let assetNames: string[] = [];

  if (Array.isArray(assetsByChunkName)) {
    assetNames = assetsByChunkName;
  } else if (assetsByChunkName) {
    assetNames = [assetsByChunkName];
  }

  return assetNames.filter(isJavaScriptAsset);
}

function getWebpackAssetSizeMap(
  stats: WebpackStatsFile,
): ReadonlyMap<string, number> {
  const assetSizes = new Map<string, number>();

  for (const asset of stats.assets ?? []) {
    if (
      !asset.name ||
      typeof asset.size !== 'number' ||
      !isJavaScriptAsset(asset.name)
    ) {
      continue;
    }

    assetSizes.set(asset.name, asset.size);
  }

  return assetSizes;
}

function getSurfaceAssetNames(
  stats: WebpackStatsFile,
  entrypointCandidates: readonly (readonly string[])[],
): Set<string> {
  const assetNames = new Set<string>();

  for (const candidateNames of entrypointCandidates) {
    for (const entrypointName of candidateNames) {
      for (const assetName of getChunkGroupAssets(stats, entrypointName)) {
        assetNames.add(assetName);
      }
    }
  }

  return assetNames;
}

function deleteAssetNames(
  target: Set<string>,
  namesToDelete: Iterable<string>,
) {
  for (const name of namesToDelete) {
    target.delete(name);
  }
}

function getIntersection(
  left: ReadonlySet<string>,
  right: ReadonlySet<string>,
): Set<string> {
  const intersection = new Set<string>();

  for (const value of left) {
    if (right.has(value)) {
      intersection.add(value);
    }
  }

  return intersection;
}

function createFileStatsFromAssetNames(
  assetNames: Iterable<string>,
  sizeMap: ReadonlyMap<string, number>,
): FileStat[] {
  const uniqueSortedNames = [...new Set(assetNames)].sort((left, right) =>
    left.localeCompare(right),
  );

  return uniqueSortedNames
    .map((name) => {
      const size = sizeMap.get(name);

      if (typeof size !== 'number') {
        return null;
      }

      return { name, size };
    })
    .filter((file): file is FileStat => Boolean(file));
}

export function collectWebpackBundleSizeArtifactFromStats(
  stats: WebpackStatsFile,
): BundleSizeArtifactV2 {
  const assetSizeMap = getWebpackAssetSizeMap(stats);
  const contentScriptAssets = getSurfaceAssetNames(
    stats,
    webpackContentScriptEntrypoints,
  );
  const uiAssets = getSurfaceAssetNames(stats, webpackUiSurfaceEntrypoints);
  const backgroundAssets = getSurfaceAssetNames(
    stats,
    webpackBackgroundSurfaceEntrypoints,
  );

  deleteAssetNames(uiAssets, contentScriptAssets);
  deleteAssetNames(backgroundAssets, contentScriptAssets);

  const commonAssets = getIntersection(uiAssets, backgroundAssets);

  deleteAssetNames(uiAssets, commonAssets);
  deleteAssetNames(backgroundAssets, commonAssets);

  return createBundleSizeArtifact('webpack', {
    background: createFileStatsFromAssetNames(backgroundAssets, assetSizeMap),
    ui: createFileStatsFromAssetNames(uiAssets, assetSizeMap),
    common: createFileStatsFromAssetNames(commonAssets, assetSizeMap),
    contentScripts: createFileStatsFromAssetNames(
      contentScriptAssets,
      assetSizeMap,
    ),
  });
}

export async function collectWebpackBundleSizeArtifact(
  statsFile: string,
): Promise<BundleSizeArtifactV2> {
  const statsContents = await fs.readFile(statsFile, 'utf8');
  const stats = JSON.parse(statsContents) as WebpackStatsFile;

  return collectWebpackBundleSizeArtifactFromStats(stats);
}

async function ensureOutputDirectory(outDirectory: string): Promise<void> {
  const bundleSizePath = path.join(outDirectory, 'bundle_size.json');
  const outputDirectory = path.dirname(bundleSizePath);
  const existingParentDirectory =
    await getFirstParentDirectoryThatExists(outputDirectory);

  if (!(await isWritable(existingParentDirectory))) {
    throw new Error('Specified output file directory is not writable');
  }

  if (outputDirectory !== existingParentDirectory) {
    await fs.mkdir(outputDirectory, { recursive: true });
  }
}

export async function writeBundleSizeArtifact(
  artifact: BundleSizeArtifactV2,
  outDirectory: string,
): Promise<void> {
  await ensureOutputDirectory(outDirectory);

  await fs.writeFile(
    path.join(outDirectory, 'bundle_size.json'),
    JSON.stringify(artifact, null, 2),
  );
  await fs.writeFile(
    path.join(outDirectory, 'bundle_size_stats.json'),
    JSON.stringify(createBundleSizeSummary(artifact), null, 2),
  );
}

async function main(): Promise<void> {
  const { argv } = yargs(hideBin(process.argv))
    .usage('$0 [options]', 'Capture bundle size stats', (_yargs) =>
      _yargs
        .option('bundler', {
          choices: ['browserify', 'webpack'],
          description: 'The bundler used to produce the dist directory',
          demandOption: true,
          type: 'string',
        })
        .option('dist-dir', {
          description: 'Path to the built dist directory',
          demandOption: true,
          normalize: true,
          type: 'string',
        })
        .option('stats-file', {
          description:
            'Path to webpack bundle stats.json. Required when bundler is webpack.',
          normalize: true,
          type: 'string',
        })
        .option('out', {
          description:
            'Output directory. Output printed to STDOUT if this is omitted.',
          normalize: true,
          type: 'string',
        }),
    )
    .strict();
  const { bundler, out } = argv as {
    bundler: Bundler;
    distDir: string;
    out?: string;
    statsFile?: string;
  };
  const distDirectory = argv['dist-dir'] as string;
  const statsFile = argv['stats-file'] as string | undefined;

  const artifact =
    bundler === 'browserify'
      ? await collectBrowserifyBundleSizeArtifact(distDirectory)
      : await (() => {
          if (!statsFile) {
            throw new Error(
              'The --stats-file option is required when --bundler webpack is used',
            );
          }

          return collectWebpackBundleSizeArtifact(statsFile);
        })();

  if (out) {
    await writeBundleSizeArtifact(artifact, out);
  } else {
    console.log(JSON.stringify(artifact, null, 2));
  }
}

const isDirectExecution =
  Boolean(process.argv[1]) &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  main().catch((error) => {
    exitWithError(error);
  });
}
