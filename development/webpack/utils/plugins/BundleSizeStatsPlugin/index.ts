import path from 'node:path';
import { sources, type Chunk, type Compilation, type Compiler } from 'webpack';
import {
  WEBPACK_BUNDLE_STATS_FILE,
  createWebpackBundleStats,
  type FileStat,
  type WebpackEntrypointFiles,
} from '../../../../lib/bundle-size';

const NAME = 'BundleSizeStatsPlugin';
const { RawSource } = sources;

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

function stripBrowserPrefix(
  assetName: string,
  browsers: readonly string[],
): string {
  for (const browser of browsers) {
    const prefix = `${browser}/`;
    if (assetName.startsWith(prefix)) {
      return assetName.slice(prefix.length);
    }
  }

  return assetName;
}

function getAssetStats(
  compilation: Compilation,
  assetNames: string[],
  browsers: readonly string[],
): FileStat[] {
  const seenAssets = new Set<string>();

  return assetNames.flatMap((assetName) => {
    if (!isJavaScriptAsset(assetName)) {
      return [];
    }

    const normalizedName = normalizeRelativePath(
      stripBrowserPrefix(assetName, browsers),
    );
    if (seenAssets.has(normalizedName)) {
      return [];
    }

    seenAssets.add(normalizedName);
    const asset = compilation.getAsset(assetName);
    if (!asset) {
      throw new Error(`Missing emitted asset "${assetName}"`);
    }

    return [{ name: normalizedName, size: asset.source.size() }];
  });
}

function getChunkAssets(
  compilation: Compilation,
  chunks: Iterable<Chunk>,
  browsers: readonly string[],
): FileStat[] {
  return getAssetStats(
    compilation,
    Array.from(chunks, (chunk) => Array.from(chunk.files)).flat(),
    browsers,
  );
}

function getEntrypointAssets(
  compilation: Compilation,
  entrypoint: Compilation['entrypoints'] extends Map<string, infer TEntrypoint>
    ? TEntrypoint
    : never,
  browsers: readonly string[],
): WebpackEntrypointFiles {
  return {
    initialFiles: getAssetStats(compilation, entrypoint.getFiles(), browsers),
    asyncFiles: getChunkAssets(
      compilation,
      entrypoint.getEntrypointChunk().getAllAsyncChunks(),
      browsers,
    ),
  };
}

export class BundleSizeStatsPlugin {
  readonly browsers: readonly string[];

  constructor({ browsers }: { browsers: readonly string[] }) {
    this.browsers = browsers;
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(NAME, (compilation) => {
      compilation.hooks.processAssets.tap(
        { name: NAME, stage: Infinity },
        () => {
          const entrypoints = Object.fromEntries(
            Array.from(compilation.entrypoints)
              .toSorted(([left], [right]) => left.localeCompare(right))
              .map(([name, entrypoint]) => [
                name,
                getEntrypointAssets(compilation, entrypoint, this.browsers),
              ])
              .filter(
                ([, entrypoint]) =>
                  entrypoint.initialFiles.length > 0 ||
                  entrypoint.asyncFiles.length > 0,
              ),
          );
          const source = new RawSource(
            JSON.stringify(createWebpackBundleStats(entrypoints), null, 2),
          );

          if (compilation.getAsset(WEBPACK_BUNDLE_STATS_FILE)) {
            compilation.updateAsset(WEBPACK_BUNDLE_STATS_FILE, source);
            return;
          }

          compilation.emitAsset(WEBPACK_BUNDLE_STATS_FILE, source, {
            javascriptModule: false,
            contentType: 'application/json',
          });
        },
      );
    });
  }
}
