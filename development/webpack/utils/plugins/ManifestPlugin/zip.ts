import path from 'node:path';
import {
  type DeflateOptions,
  Zip,
  AsyncZipDeflate,
  ZipDeflate,
  ZipPassThrough,
} from 'fflate';
import { sources } from 'webpack';
import type { Browser } from '../../helpers';

const { RawSource, ConcatSource } = sources;

const BROWSER_TEMPLATE_RE = /\[browser\]/gu;

/**
 * File types that can be compressed well using DEFLATE compression.
 */
const compressibleFileTypes = new Set([
  '.bmp',
  '.cjs',
  '.css',
  '.csv',
  '.eot',
  '.html',
  '.js',
  '.json',
  '.log',
  '.map',
  '.md',
  '.mjs',
  '.svg',
  '.txt',
  '.wasm',
  '.vtt', // very slow to process?
  '.wav',
  '.xml',
]);

type AssetEntries = [string, sources.Source][];

type BuildBrowserZipSourceOptions = {
  assetEntries: AssetEntries;
  compressionOptions: DeflateOptions | undefined;
  excludeExtensions: string[];
  manifest: sources.RawSource;
  mtime: number;
  onAssetAdded?: (assetName: string) => void;
};

/**
 * Builds the zip source for a single browser bundle.
 *
 * @param options - Zip generation options.
 * @param options.assetEntries
 * @param options.compressionOptions
 * @param options.excludeExtensions
 * @param options.manifest
 * @param options.mtime
 * @param options.onAssetAdded
 * @returns The generated zip source.
 */
export async function buildBrowserZipSource({
  assetEntries,
  compressionOptions,
  excludeExtensions,
  manifest,
  mtime,
  onAssetAdded,
}: BuildBrowserZipSourceOptions): Promise<sources.Source> {
  return await new Promise<sources.Source>((resolve, reject) => {
    // Since zipping is async, a past chunk could cause an error after we've
    // started processing additional chunks. We'll use this errored flag to
    // short-circuit the rest of the processing if that happens.
    let errored = false;
    const zipSource = new ConcatSource();
    const zip = new Zip((error, data, final) => {
      if (errored) {
        return;
      }

      if (error) {
        errored = true;
        reject(error);
        return;
      }

      zipSource.add(new RawSource(Buffer.from(data)));
      if (final) {
        resolve(zipSource);
      }
    });

    addAssetToZip(
      manifest.buffer(),
      'manifest.json',
      true,
      compressionOptions,
      mtime,
      zip,
    );
    onAssetAdded?.('manifest.json');

    for (const [assetName, asset] of assetEntries) {
      if (errored) {
        return;
      }

      const extName = path.extname(assetName);
      if (excludeExtensions.includes(extName)) {
        continue;
      }

      addAssetToZip(
        asset.buffer(),
        assetName,
        compressibleFileTypes.has(extName),
        compressionOptions,
        mtime,
        zip,
      );
      onAssetAdded?.(assetName);
    }

    zip.end();
  });
}

/**
 * Resolves the output path for a browser-specific zip file.
 *
 * @param outFilePath - The file path template from plugin options.
 * @param browser - The browser currently being built.
 * @returns The resolved zip file path.
 */
export function getZipFilePath(outFilePath: string, browser: Browser): string {
  return outFilePath.replace(BROWSER_TEMPLATE_RE, browser);
}

/**
 * Adds the given asset to the zip file.
 *
 * @param asset - The asset to add.
 * @param assetName - The name of the asset.
 * @param compress - Whether to compress the asset.
 * @param compressionOptions - The options to use for compression.
 * @param mtime - The modification time of the asset.
 * @param zip - The zip file to add the asset to.
 */
function addAssetToZip(
  asset: Buffer,
  assetName: string,
  compress: boolean,
  compressionOptions: DeflateOptions | undefined,
  mtime: number,
  zip: Zip,
): void {
  const zipFile = compress
    ? // AsyncZipDeflate uses workers
      // only use async deflate for "larger" files
      asset.length > 1024 * 64
      ? new AsyncZipDeflate(assetName, compressionOptions)
      : new ZipDeflate(assetName, compressionOptions)
    : // ZipPassThrough doesn't use workers
      new ZipPassThrough(assetName);
  zipFile.mtime = mtime;
  zip.add(zipFile);
  // Use a copy of the Buffer via `Buffer.from(asset)`, as Zip will *consume*
  // it, which breaks things if we are compiling for multiple browsers at once.
  // `Buffer.from` uses the internal pool, so it's superior to `new Uint8Array`
  // if we don't need to pass it off to a worker thread.
  //
  // Additionally, in Node.js 22+ a Buffer marked as "Untransferable" (like
  // ours) can't be passed to a worker, which `AsyncZipDeflate` uses.
  // See: https://github.com/101arrowz/fflate/issues/227#issuecomment-2540024304
  // this can probably be simplified to `zipFile.push(Buffer.from(asset), true);`
  // if the above issue is resolved.
  zipFile.push(compress ? new Uint8Array(asset) : Buffer.from(asset), true);
}
