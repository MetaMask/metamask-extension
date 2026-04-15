import { promises as fs } from 'fs';
import path from 'path';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import {
  BUNDLE_SIZE_ARTIFACT_FILE,
  BUNDLE_SIZE_SUMMARY_FILE,
  WEBPACK_BUNDLE_STATS_FILE,
  createBundleSizeArtifact,
  createBundleSizeSummary,
  isWebpackBundleStats,
  type BundleSizeArtifact,
  type FileStat,
  type WebpackEntrypointFiles,
  type WebpackBundleStats,
} from '../../../development/lib/bundle-size';
import { exitWithError } from '../../../development/lib/exit-with-error';
import {
  getFirstParentDirectoryThatExists,
  isWritable,
} from '../../helpers/file';

const uiHtmlFiles = [
  'home.html',
  'loading.html',
  'notification.html',
  'popup-init.html',
  'popup.html',
  'sidepanel.html',
] as const;

const auxiliaryPageHtmlFiles = [
  'offscreen.html',
  'trezor-usb-permissions.html',
] as const;

const extraContentScriptFiles = [
  'scripts/inpage.js',
  'vendor/trezor/content-script.js',
] as const;

const htmlScriptSrcRegex =
  /<script\b[^>]*\bsrc=(['"])(?<src>[^'"#?]+(?:\.(?:mjs|cjs|js)))\1[^>]*>/giu;

export { createBundleSizeSummary };

type DistManifest = {
  background?: {
    ['service_worker']?: string;
  };
  ['content_scripts']?: {
    js?: string[];
  }[];
};

function normalizeRelativePath(filePath: string): string {
  return filePath.split(path.sep).join(path.posix.sep);
}

async function getDistFileStats(distDirectory: string): Promise<FileStat[]> {
  const rootDirectory = path.resolve(distDirectory);
  const fileStats: FileStat[] = [];

  for await (const entry of fs.glob('**/*', {
    cwd: rootDirectory,
    withFileTypes: true,
  })) {
    if (!entry.isFile()) {
      continue;
    }

    const absolutePath = path.join(entry.parentPath, entry.name);
    const stats = await fs.stat(absolutePath);

    fileStats.push({
      name: normalizeRelativePath(path.relative(rootDirectory, absolutePath)),
      size: stats.size,
    });
  }

  return fileStats;
}

async function getDistFileSizeMap(
  distDirectory: string,
): Promise<ReadonlyMap<string, number>> {
  return new Map(
    (await getDistFileStats(distDirectory)).map(({ name, size }) => [
      name,
      size,
    ]),
  );
}

function isJavaScriptAsset(filePath: string): boolean {
  return (
    filePath.endsWith('.js') ||
    filePath.endsWith('.mjs') ||
    filePath.endsWith('.cjs')
  );
}

function isRuntimeAsset(filePath: string): boolean {
  return path.posix.basename(filePath).startsWith('runtime-');
}

function resolveDistAssetPath(
  distDirectory: string,
  fromRelativePath: string,
  assetPath: string,
): string {
  return normalizeRelativePath(
    path.relative(
      distDirectory,
      path.resolve(distDirectory, path.dirname(fromRelativePath), assetPath),
    ),
  );
}

async function readDistManifest(distDirectory: string): Promise<DistManifest> {
  return JSON.parse(
    await fs.readFile(path.join(distDirectory, 'manifest.json'), 'utf8'),
  ) as DistManifest;
}

function getServiceWorkerPath(manifest: DistManifest): string {
  const serviceWorkerPath = manifest.background?.service_worker;

  if (!serviceWorkerPath) {
    throw new Error(
      'Bundle-size collector expects an MV3 manifest with background.service_worker',
    );
  }

  return serviceWorkerPath;
}

async function getHtmlSurfaceAssetNames(
  distDirectory: string,
  htmlFiles: readonly string[],
): Promise<Set<string>> {
  const assetNames = new Set<string>();

  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(distDirectory, htmlFile);

    try {
      const html = await fs.readFile(htmlPath, 'utf8');

      for (const match of html.matchAll(htmlScriptSrcRegex)) {
        const scriptSource = match.groups?.src;
        if (scriptSource) {
          assetNames.add(
            resolveDistAssetPath(distDirectory, htmlFile, scriptSource),
          );
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  return assetNames;
}

function getManifestContentScriptAssetNames(
  manifest: DistManifest,
  distFileSizeMap: ReadonlyMap<string, number>,
): Set<string> {
  const assetNames = new Set(
    (manifest.content_scripts ?? []).flatMap(
      (contentScript) => contentScript.js ?? [],
    ),
  );

  for (const assetName of extraContentScriptFiles) {
    if (distFileSizeMap.has(assetName)) {
      assetNames.add(assetName);
    }
  }

  return assetNames;
}

function getWebpackBackgroundEntrypoint(
  stats: WebpackBundleStats,
  serviceWorkerPath: string,
): WebpackEntrypointFiles {
  const entrypoint = Object.values(stats.entrypoints).find(({ initialFiles }) =>
    initialFiles.some((file) => file.name === serviceWorkerPath),
  );

  if (!entrypoint) {
    throw new Error(
      `Unable to find webpack service worker entrypoint for "${serviceWorkerPath}"`,
    );
  }

  return entrypoint;
}

function getWebpackSurfaceAssetNamesFromInitialAssets(
  stats: WebpackBundleStats,
  initialAssetNames: ReadonlySet<string>,
): Set<string> {
  const asyncAssetNames = new Set(
    Object.values(stats.entrypoints).flatMap((entrypoint) =>
      entrypoint.initialFiles.some(
        ({ name }) => initialAssetNames.has(name) && !isRuntimeAsset(name),
      )
        ? entrypoint.asyncFiles.map(({ name }) => name)
        : [],
    ),
  );

  // @ts-expect-error Node 24 supports Set.prototype.union, but the repo TS lib config does not type it yet.
  return new Set(initialAssetNames).union(asyncAssetNames);
}

function createFileStatsFromAssetNames(
  assetNames: Iterable<string>,
  sizeMap: ReadonlyMap<string, number>,
): FileStat[] {
  return Array.from(new Set(assetNames), (name) => {
    const size = sizeMap.get(name);

    if (typeof size !== 'number') {
      throw new Error(`Missing size for emitted asset "${name}"`);
    }

    return { name, size };
  });
}

function partitionSurfaceAssets({
  backgroundAssets,
  uiAssets,
  auxiliaryPageAssets,
  contentScriptAssets,
  assetSizeMap,
}: {
  backgroundAssets: Set<string>;
  uiAssets: Set<string>;
  auxiliaryPageAssets: Set<string>;
  contentScriptAssets: Set<string>;
  assetSizeMap: ReadonlyMap<string, number>;
}): BundleSizeArtifact {
  // @ts-expect-error Node 24 supports Set.prototype.intersection/difference, but the repo TS lib config does not type them yet.
  const commonAssets = backgroundAssets
    .intersection(uiAssets)
    .difference(contentScriptAssets);
  // @ts-expect-error Node 24 supports Set.prototype.difference, but the repo TS lib config does not type it yet.
  const backgroundOnlyAssets = backgroundAssets
    .difference(commonAssets)
    .difference(contentScriptAssets);
  // @ts-expect-error Node 24 supports Set.prototype.difference, but the repo TS lib config does not type it yet.
  const uiOnlyAssets = uiAssets
    .difference(commonAssets)
    .difference(contentScriptAssets);
  // @ts-expect-error Node 24 supports Set.prototype.difference, but the repo TS lib config does not type it yet.
  const auxiliaryPageOnlyAssets = auxiliaryPageAssets
    .difference(contentScriptAssets)
    .difference(commonAssets)
    .difference(backgroundOnlyAssets)
    .difference(uiOnlyAssets);

  return createBundleSizeArtifact({
    background: createFileStatsFromAssetNames(
      backgroundOnlyAssets,
      assetSizeMap,
    ),
    ui: createFileStatsFromAssetNames(uiOnlyAssets, assetSizeMap),
    common: createFileStatsFromAssetNames(commonAssets, assetSizeMap),
    auxiliaryPages: createFileStatsFromAssetNames(
      auxiliaryPageOnlyAssets,
      assetSizeMap,
    ),
    contentScripts: createFileStatsFromAssetNames(
      contentScriptAssets,
      assetSizeMap,
    ),
  });
}

export function collectBundleSizeArtifactFromStats(
  stats: WebpackBundleStats,
  {
    manifest,
    assetSizeMap,
    uiInitialAssets,
    auxiliaryPageInitialAssets,
  }: {
    manifest: DistManifest;
    assetSizeMap: ReadonlyMap<string, number>;
    uiInitialAssets: Set<string>;
    auxiliaryPageInitialAssets: Set<string>;
  },
): BundleSizeArtifact {
  const serviceWorkerPath = getServiceWorkerPath(manifest);
  const backgroundEntrypoint = getWebpackBackgroundEntrypoint(
    stats,
    serviceWorkerPath,
  );
  const uiAssets = getWebpackSurfaceAssetNamesFromInitialAssets(
    stats,
    uiInitialAssets,
  );
  const auxiliaryPageAssets = getWebpackSurfaceAssetNamesFromInitialAssets(
    stats,
    auxiliaryPageInitialAssets,
  );
  const backgroundAssets = new Set(
    [...backgroundEntrypoint.initialFiles, ...backgroundEntrypoint.asyncFiles]
      .map(({ name }) => name)
      .filter(isJavaScriptAsset),
  );
  const contentScriptAssets = getManifestContentScriptAssetNames(
    manifest,
    assetSizeMap,
  );

  return partitionSurfaceAssets({
    backgroundAssets,
    uiAssets,
    auxiliaryPageAssets,
    contentScriptAssets,
    assetSizeMap,
  });
}

export async function collectBundleSizeArtifact(
  distDirectory: string,
): Promise<BundleSizeArtifact> {
  const [assetSizeMap, manifest, uiInitialAssets, auxiliaryPageInitialAssets] =
    await Promise.all([
      getDistFileSizeMap(distDirectory),
      readDistManifest(distDirectory),
      getHtmlSurfaceAssetNames(distDirectory, uiHtmlFiles),
      getHtmlSurfaceAssetNames(distDirectory, auxiliaryPageHtmlFiles),
    ]);
  const statsPath = path.join(
    path.dirname(path.resolve(distDirectory)),
    WEBPACK_BUNDLE_STATS_FILE,
  );
  const statsContents = await fs.readFile(statsPath, 'utf8');
  const stats = JSON.parse(statsContents) as unknown;

  if (!isWebpackBundleStats(stats)) {
    throw new Error(`Invalid webpack bundle stats file at "${statsPath}"`);
  }

  return collectBundleSizeArtifactFromStats(stats, {
    manifest,
    assetSizeMap,
    uiInitialAssets,
    auxiliaryPageInitialAssets,
  });
}

async function ensureOutputDirectory(outDirectory: string): Promise<void> {
  const bundleSizePath = path.join(outDirectory, BUNDLE_SIZE_ARTIFACT_FILE);
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
  artifact: BundleSizeArtifact,
  outDirectory: string,
): Promise<void> {
  await ensureOutputDirectory(outDirectory);

  await fs.writeFile(
    path.join(outDirectory, BUNDLE_SIZE_ARTIFACT_FILE),
    JSON.stringify(artifact, null, 2),
  );
  await fs.writeFile(
    path.join(outDirectory, BUNDLE_SIZE_SUMMARY_FILE),
    JSON.stringify(createBundleSizeSummary(artifact), null, 2),
  );
}

async function main(): Promise<void> {
  const argv = yargs(hideBin(process.argv))
    .usage('$0 [options]', 'Capture bundle size stats', (_yargs) =>
      _yargs
        .option('distDir', {
          alias: 'dist-dir',
          description: 'Path to the built platform dist directory',
          demandOption: true,
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
    .strict()
    .parseSync();
  const distDirectory = argv.distDir as string;
  const out = argv.out as string | undefined;
  const artifact = await collectBundleSizeArtifact(distDirectory);

  if (out) {
    await writeBundleSizeArtifact(artifact, out);
  } else {
    console.log(JSON.stringify(artifact, null, 2));
  }
}

if (require.main === module) {
  main().catch((error) => {
    exitWithError(error);
  });
}
