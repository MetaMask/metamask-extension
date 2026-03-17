import { availableParallelism, totalmem } from 'node:os';
import { performance } from 'node:perf_hooks';
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
const KiB = 1024;
const MiB = 1024 * KiB;
const FAST_MACHINE_ASYNC_COMPRESSION_SIZE = 32 * KiB;
const MIN_COMPRESSIBLE_ASSET_SIZE = 16 * KiB;
const MIN_ASYNC_COMPRESSION_SIZE = 64 * KiB;
const MAX_ASYNC_COMPRESSION_SIZE = 16 * MiB;
const RSS_SAMPLE_INTERVAL_MS = 250;
const THROUGHPUT_SMOOTHING_FACTOR = 0.25;

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

type CreateBrowserZipBuilderOptions = {
  compressionOptions: DeflateOptions | undefined;
  compressionController: ZipCompressionController;
  excludeExtensions: string[];
  manifest: sources.RawSource;
  mtime: number;
  onAssetAdded: (assetName: string) => void;
};

type ZipCompressionController = {
  trackAsyncCompression: boolean;
  beginAsyncCompression: (assetSize: number) => () => void;
  recordSyncCompression: (assetSize: number, durationMs: number) => void;
  shouldUseAsyncCompression: (assetSize: number) => boolean;
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
 * Creates a shared controller that adaptively decides when async ZIP
 * compression is worthwhile for the current machine and build.
 *
 * This first pass keeps the policy intentionally conservative:
 * it caps in-flight async work using machine heuristics, then nudges the async
 * size threshold up or down based on observed sync vs async throughput.
 *
 * @returns The adaptive compression controller for a single zip run.
 */
export function createZipCompressionController(): ZipCompressionController {
  const parallelism = availableParallelism();
  const totalMemory = totalmem();
  const useAdaptiveRetuning =
    parallelism <= 8 || totalMemory <= 16 * 1024 * MiB;

  if (!useAdaptiveRetuning) {
    return {
      trackAsyncCompression: false,
      beginAsyncCompression: () => () => undefined,
      recordSyncCompression: () => undefined,
      shouldUseAsyncCompression: (assetSize) =>
        assetSize >= FAST_MACHINE_ASYNC_COMPRESSION_SIZE,
    };
  }

  const maxAsyncJobs = useAdaptiveRetuning
    ? clamp(parallelism - 1, 1, 4)
    : Math.max(parallelism - 1, 1);
  const maxAsyncBytes = clamp(
    Math.floor(totalMemory / (useAdaptiveRetuning ? 64 : 16)),
    useAdaptiveRetuning ? 32 * MiB : 64 * MiB,
    useAdaptiveRetuning ? 512 * MiB : 2 * 1024 * MiB,
  );
  const memorySoftLimit = useAdaptiveRetuning
    ? clamp(Math.floor(totalMemory / 4), 512 * MiB, 2 * 1024 * MiB)
    : Number.POSITIVE_INFINITY;
  let asyncSizeThreshold =
    parallelism <= 4 ? 128 * KiB : MIN_ASYNC_COMPRESSION_SIZE;
  let inflightAsyncJobs = 0;
  let inflightAsyncBytes = 0;
  let syncSamples = 0;
  let asyncSamples = 0;
  let syncThroughput = 0;
  let asyncThroughput = 0;
  let lastRssSampleAt = -Infinity;
  let cachedRss = 0;

  function beginAsyncCompression(assetSize: number): () => void {
    inflightAsyncJobs += 1;
    inflightAsyncBytes += assetSize;

    if (!useAdaptiveRetuning) {
      return () => {
        inflightAsyncJobs = Math.max(0, inflightAsyncJobs - 1);
        inflightAsyncBytes = Math.max(0, inflightAsyncBytes - assetSize);
      };
    }

    const startedAt = performance.now();
    let completed = false;

    return () => {
      if (completed) {
        return;
      }

      completed = true;
      inflightAsyncJobs = Math.max(0, inflightAsyncJobs - 1);
      inflightAsyncBytes = Math.max(0, inflightAsyncBytes - assetSize);
      asyncSamples += 1;
      asyncThroughput = updateAverageThroughput(
        asyncThroughput,
        assetSize,
        performance.now() - startedAt,
        asyncSamples,
      );
      retuneAsyncThreshold();
    };
  }

  function recordSyncCompression(assetSize: number, durationMs: number): void {
    if (!useAdaptiveRetuning) {
      return;
    }

    syncSamples += 1;
    syncThroughput = updateAverageThroughput(
      syncThroughput,
      assetSize,
      durationMs,
      syncSamples,
    );
    retuneAsyncThreshold();
  }

  function shouldUseAsyncCompression(assetSize: number): boolean {
    const rss = useAdaptiveRetuning ? getRss() : 0;
    return (
      assetSize >= asyncSizeThreshold &&
      inflightAsyncJobs < maxAsyncJobs &&
      inflightAsyncBytes + assetSize <= maxAsyncBytes &&
      rss + inflightAsyncBytes + assetSize <= memorySoftLimit
    );
  }

  function retuneAsyncThreshold(): void {
    if (!useAdaptiveRetuning) {
      return;
    }

    if (syncSamples < 2 || asyncSamples < 2) {
      return;
    }

    const asyncIsClearlyBetter = asyncThroughput > syncThroughput * 1.2;
    const syncIsClearlyBetter = syncThroughput > asyncThroughput * 1.1;
    const underPressure =
      inflightAsyncJobs >= maxAsyncJobs ||
      inflightAsyncBytes >= maxAsyncBytes * 0.75 ||
      getRss() >= memorySoftLimit;

    if (syncIsClearlyBetter || underPressure) {
      asyncSizeThreshold = Math.min(
        MAX_ASYNC_COMPRESSION_SIZE,
        Math.floor(asyncSizeThreshold * 1.5),
      );
    } else if (asyncIsClearlyBetter) {
      asyncSizeThreshold = Math.max(
        MIN_ASYNC_COMPRESSION_SIZE,
        Math.floor(asyncSizeThreshold / 1.25),
      );
    }
  }

  function getRss(): number {
    const now = performance.now();
    if (now - lastRssSampleAt >= RSS_SAMPLE_INTERVAL_MS) {
      cachedRss = process.memoryUsage.rss();
      lastRssSampleAt = now;
    }

    return cachedRss;
  }

  return {
    trackAsyncCompression: true,
    beginAsyncCompression,
    recordSyncCompression,
    shouldUseAsyncCompression,
  };
}

/**
 * Creates a zip builder for a single browser bundle.
 *
 * @param options - Zip generation options.
 * @param options.compressionOptions
 * @param options.excludeExtensions
 * @param options.manifest - The browser-specific manifest source.
 * @param options.mtime - The zip entry modification time.
 * @param options.onAssetAdded - Progress callback for each added file.
 * @param options.compressionController
 * @returns The zip builder.
 */
export function createBrowserZipBuilder({
  compressionOptions,
  compressionController,
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
  const zipChunks: Uint8Array[] = [];
  let zipSize = 0;
  const zip = new Zip((error, data, final) => {
    if (errored) {
      return;
    }

    if (error) {
      errored = true;
      rejectSource(error);
      return;
    }

    zipChunks.push(data);
    zipSize += data.byteLength;

    if (final) {
      resolveSource(new RawSource(Buffer.concat(zipChunks, zipSize)));
    }
  });

  addAssetToZip(
    manifest.buffer(),
    'manifest.json',
    true,
    compressionOptions,
    compressionController,
    mtime,
    zip,
  );
  onAssetAdded('manifest.json');

  const addAsset = (assetName: string, asset: sources.Source) => {
    if (errored || finalized) {
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
      compressionController,
      mtime,
      zip,
    );
    onAssetAdded(assetName);
  };

  const finalize = () => {
    if (!finalized) {
      finalized = true;
      zip.end();
    }

    return sourcePromise;
  };

  return { addAsset, finalize };
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
 * @param compressionController
 * @param mtime - The modification time of the asset.
 * @param zip - The zip file to add the asset to.
 */
function addAssetToZip(
  asset: Buffer,
  assetName: string,
  compress: boolean,
  compressionOptions: DeflateOptions | undefined,
  compressionController: ZipCompressionController,
  mtime: number,
  zip: Zip,
): void {
  let zipFile: AsyncZipDeflate | ZipDeflate | ZipPassThrough;
  let zipAsset: Buffer | Uint8Array;
  const shouldCompress =
    compress && asset.length >= MIN_COMPRESSIBLE_ASSET_SIZE;
  const shouldUseAsyncCompression =
    shouldCompress &&
    compressionController.shouldUseAsyncCompression(asset.length);

  if (!shouldCompress) {
    // ZipPassThrough doesn't use workers
    zipFile = new ZipPassThrough(assetName);
    zipAsset = Buffer.from(asset);
  } else if (shouldUseAsyncCompression) {
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
  if (
    zipFile instanceof AsyncZipDeflate &&
    compressionController.trackAsyncCompression
  ) {
    const completeAsyncCompression =
      compressionController.beginAsyncCompression(asset.length);
    const { ondata } = zipFile;
    zipFile.ondata = (error, data, final) => {
      try {
        ondata(error, data, final);
      } finally {
        if (error || final) {
          completeAsyncCompression();
        }
      }
    };
  }
  // The sync paths use copied Buffers because the zip writer consumes the input.
  // The async worker path needs a transferable Uint8Array because Node.js 22+
  // marks our Buffer as untransferable.
  // See: https://github.com/101arrowz/fflate/issues/227#issuecomment-2540024304
  const startedAt = zipFile instanceof ZipDeflate ? performance.now() : 0;
  zipFile.push(zipAsset, true);
  if (zipFile instanceof ZipDeflate) {
    compressionController.recordSyncCompression(
      asset.length,
      performance.now() - startedAt,
    );
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function updateAverageThroughput(
  currentAverage: number,
  bytes: number,
  durationMs: number,
  sampleCount: number,
): number {
  const throughput = bytes / Math.max(durationMs, 0.1);
  return sampleCount === 1
    ? throughput
    : currentAverage * (1 - THROUGHPUT_SMOOTHING_FACTOR) +
        throughput * THROUGHPUT_SMOOTHING_FACTOR;
}
