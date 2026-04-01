import { extname } from 'node:path';
import { ZipFile } from 'yazl';
import { sources } from 'webpack';
import type { ZipOptions } from './types';

const { RawSource } = sources;

/**
 * File types that generally compress well with DEFLATE.
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
  '.riv',
  '.svg',
  '.txt',
  '.wasm',
  '.vtt',
  '.wav',
  '.xml',
]);

export type ZipCompressionOptions = Pick<ZipOptions['zipOptions'], 'level'>;

type CreateBrowserZipBuilderOptions = {
  compressionOptions: ZipCompressionOptions;
  excludeExtensions: string[];
  manifest: sources.RawSource;
  mtime: number;
  onAssetAdded: (assetName: string) => void;
};

/**
 * Incrementally builds a browser zip asset.
 */
export type BrowserZipBuilder = {
  /**
   * Adds an emitted webpack asset to the in-progress zip.
   */
  addAsset: (assetName: string, asset: sources.Source) => void;

  /**
   * Finalizes the zip and resolves the emitted webpack source.
   */
  finalize: () => Promise<sources.Source>;
};

/**
 * Creates a zip builder for a single browser bundle.
 *
 * @param options - Zip generation options.
 * @param options.compressionOptions - ZIP compression settings.
 * @param options.excludeExtensions - Asset extensions to skip entirely.
 * @param options.manifest - The browser-specific manifest source.
 * @param options.mtime - The zip entry modification time.
 * @param options.onAssetAdded - Progress callback for each added file.
 * @returns The zip builder.
 */
export function createBrowserZipBuilder({
  compressionOptions,
  excludeExtensions,
  manifest,
  mtime,
  onAssetAdded,
}: CreateBrowserZipBuilderOptions): BrowserZipBuilder {
  let errored = false;
  let finalized = false;
  let resolveSource!: (source: sources.Source) => void;
  let rejectSource!: (error: Error) => void;
  const sourcePromise = new Promise<sources.Source>((resolve, reject) => {
    resolveSource = resolve;
    rejectSource = reject;
  });

  const zipFile = new ZipFile();
  const zipChunks: Buffer[] = [];
  let zipSize = 0;
  const zipEntryDate = new Date(mtime);

  const rejectOnce = (error: Error) => {
    if (errored) {
      return;
    }

    errored = true;
    rejectSource(error);
  };

  zipFile.once('error', rejectOnce);
  zipFile.outputStream.once('error', rejectOnce);
  zipFile.outputStream.on('data', (chunk: Buffer) => {
    if (errored) {
      return;
    }

    zipChunks.push(chunk);
    zipSize += chunk.length;
  });
  zipFile.outputStream.once('end', () => {
    if (!errored) {
      resolveSource(new RawSource(Buffer.concat(zipChunks, zipSize)));
    }
  });

  addAssetToZip(
    manifest.buffer(),
    'manifest.json',
    true,
    compressionOptions,
    zipEntryDate,
    zipFile,
  );
  onAssetAdded('manifest.json');

  const addAsset = (assetName: string, asset: sources.Source) => {
    if (finalized) {
      throw new Error('Cannot add asset after finalize()');
    }

    if (errored) {
      return;
    }

    const extName = extname(assetName);
    if (excludeExtensions.includes(extName)) {
      return;
    }

    addAssetToZip(
      asset.buffer(),
      assetName,
      compressibleFileTypes.has(extName),
      compressionOptions,
      zipEntryDate,
      zipFile,
    );
    onAssetAdded(assetName);
  };

  const finalize = () => {
    if (!finalized) {
      finalized = true;
      zipFile.end();
    }

    return sourcePromise;
  };

  return { addAsset, finalize };
}

/**
 * Adds the given asset to the zip file.
 *
 * @param asset - The asset to add.
 * @param assetName - The name of the asset.
 * @param compress - Whether the asset type is compressible.
 * @param compressionOptions - The zip compression settings.
 * @param mtime - The modification time to apply to the zip entry.
 * @param zipFile - The zip file to add the asset to.
 */
function addAssetToZip(
  asset: Buffer,
  assetName: string,
  compress: boolean,
  compressionOptions: ZipCompressionOptions,
  mtime: Date,
  zipFile: ZipFile,
): void {
  const shouldCompress = compressionOptions.level > 0 && compress;

  zipFile.addBuffer(asset, assetName, {
    compress: shouldCompress,
    compressionLevel: shouldCompress ? compressionOptions.level : 0,
    mtime,
  });
}
