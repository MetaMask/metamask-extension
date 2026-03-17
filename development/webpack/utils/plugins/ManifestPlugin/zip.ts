import { extname } from 'node:path';
import {
  type DeflateOptions,
  Zip,
  AsyncZipDeflate,
  ZipDeflate,
  ZipPassThrough,
} from 'fflate';
import { sources } from 'webpack';
import type { Browser } from '../../helpers';

const { RawSource } = sources;

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
  onAssetAdded: (assetName: string) => void;
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
    const zipChunks: Uint8Array[] = [];
    let zipSize = 0;

    const zip = new Zip((error, data, final) => {
      if (errored) {
        return;
      }

      if (error) {
        errored = true;
        reject(error);
        return;
      }

      zipChunks.push(data);
      zipSize += data.byteLength;

      if (final) {
        resolve(new RawSource(Buffer.concat(zipChunks, zipSize)));
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
    onAssetAdded('manifest.json');

    for (const [assetName, asset] of assetEntries) {
      if (errored) {
        return;
      }

      const extName = extname(assetName);
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
      onAssetAdded(assetName);
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
  let zipFile: AsyncZipDeflate | ZipDeflate | ZipPassThrough;
  let zipAsset: Buffer | Uint8Array;
  if (!compress) {
    // ZipPassThrough doesn't use workers
    zipFile = new ZipPassThrough(assetName);
    zipAsset = Buffer.from(asset);
  } else if (asset.length > 1024 * 64) {
    // 1024 * 64 was fastest on my machine :-)
    // AsyncZipDeflate uses workers
    zipFile = new AsyncZipDeflate(assetName, compressionOptions);
    zipAsset = new Uint8Array(asset);
  } else {
    // ZipDeflate doesn't use workers, and is faster for small files as we don't
    // incur the overhead of transferring data to/from a worker thread.
    zipFile = new ZipDeflate(assetName, compressionOptions);
    zipAsset = Buffer.from(asset);
  }
  zipFile.mtime = mtime;
  zip.add(zipFile);
  // Zip consumes the input, so the sync paths need a copied Buffer to avoid
  // breaking subsequent browser builds. The async worker path needs a
  // transferable Uint8Array because Node.js 22+ marks our Buffer as
  // untransferable.
  // See: https://github.com/101arrowz/fflate/issues/227#issuecomment-2540024304
  zipFile.push(zipAsset, true);
}
