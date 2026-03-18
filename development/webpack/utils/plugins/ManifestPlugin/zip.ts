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
const GiB = 1024 * MiB;
const FAST_MACHINE_ASYNC_COMPRESSION_SIZE = 48 * KiB;
const CI_ASYNC_COMPRESSION_SIZE = 216 * KiB;
const MIN_COMPRESSIBLE_ASSET_SIZE = 24 * KiB;
const MIN_ASYNC_COMPRESSION_SIZE = 64 * KiB;
const LOW_PARALLELISM_ASYNC_COMPRESSION_SIZE = 96 * KiB;
const MAX_ASYNC_COMPRESSION_SIZE = 16 * MiB;
const RSS_SAMPLE_INTERVAL_MS = 250;
const THROUGHPUT_SMOOTHING_FACTOR = 0.25;
const MAX_ASYNC_JOBS = 4;
const CI_MAX_ASYNC_JOBS = 3;
const CI_MEMORY_SOFT_LIMIT = 6 * GiB;
const FAST_MACHINE_PARALLELISM_THRESHOLD = 8;
const FAST_MACHINE_MEMORY_THRESHOLD = 16 * GiB;
const IS_CI = process.env.CI === '1' || process.env.CI === 'true';

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
  finalize: () => void;
  recordSyncCompression: (assetSize: number, durationMs: number) => void;
  shouldUseAsyncCompression: (assetSize: number) => boolean;
};

/**
 * Fixed limits for the adaptive controller after environment detection has
 * already selected the "adaptive" path.
 */
type AdaptiveZipCompressionPolicy = {
  asyncSizeThreshold: number;
  maxAsyncBytes: number;
  maxAsyncJobs: number;
  memorySoftLimit: number;
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
 * Creates the ZIP compression controller for the current process.
 *
 * Large local machines use a fixed threshold to avoid the bookkeeping cost of
 * live tuning. CI and smaller machines use the adaptive controller so they can
 * react to memory pressure and the observed sync-vs-async tradeoff at runtime.
 *
 * @returns The compression controller for a single zip run.
 */
export function createZipCompressionController(): ZipCompressionController {
  const parallelism = availableParallelism();
  const totalMemory = totalmem();
  let asyncSizeThreshold = MIN_ASYNC_COMPRESSION_SIZE;
  if (IS_CI) {
    asyncSizeThreshold = CI_ASYNC_COMPRESSION_SIZE;
  } else if (parallelism <= 4) {
    asyncSizeThreshold = LOW_PARALLELISM_ASYNC_COMPRESSION_SIZE;
  }
  if (!shouldUseAdaptiveController(parallelism, totalMemory)) {
    return createStaticZipCompressionController(
      IS_CI
        ? LOW_PARALLELISM_ASYNC_COMPRESSION_SIZE
        : FAST_MACHINE_ASYNC_COMPRESSION_SIZE,
    );
  }

  return createAdaptiveZipCompressionController({
    asyncSizeThreshold,
    maxAsyncBytes: clamp(Math.floor(totalMemory / 64), 32 * MiB, 512 * MiB),
    maxAsyncJobs: IS_CI
      ? CI_MAX_ASYNC_JOBS
      : clamp(parallelism - 1, 1, MAX_ASYNC_JOBS),
    memorySoftLimit: IS_CI
      ? CI_MEMORY_SOFT_LIMIT
      : clamp(Math.floor(totalMemory / 4), 512 * MiB, 2 * GiB),
  });
}

/**
 * Uses the adaptive controller for CI and for machines that look constrained
 * enough to benefit from live tuning. Large local machines stay on the simpler
 * fixed-threshold path.
 * @param parallelism
 * @param totalMemory
 */
function shouldUseAdaptiveController(
  parallelism: number,
  totalMemory: number,
): boolean {
  return (
    IS_CI ||
    parallelism <= FAST_MACHINE_PARALLELISM_THRESHOLD ||
    totalMemory <= FAST_MACHINE_MEMORY_THRESHOLD
  );
}

/**
 * Creates a fixed-threshold controller with no runtime tuning.
 * @param asyncSizeThreshold
 */
function createStaticZipCompressionController(
  asyncSizeThreshold: number,
): ZipCompressionController {
  return {
    trackAsyncCompression: false,
    beginAsyncCompression: () => () => undefined,
    finalize: () => undefined,
    recordSyncCompression: () => undefined,
    shouldUseAsyncCompression: (assetSize) => assetSize >= asyncSizeThreshold,
  };
}

/**
 * Creates the adaptive controller that bounds worker usage and retunes the
 * async threshold based on measured throughput and memory pressure.
 * @param options0
 * @param options0.asyncSizeThreshold
 * @param options0.maxAsyncBytes
 * @param options0.maxAsyncJobs
 * @param options0.memorySoftLimit
 */
function createAdaptiveZipCompressionController({
  asyncSizeThreshold: initialAsyncSizeThreshold,
  maxAsyncBytes,
  maxAsyncJobs,
  memorySoftLimit,
}: AdaptiveZipCompressionPolicy): ZipCompressionController {
  const shouldLogDiagnostics = IS_CI;
  const fallbackCounts = {
    belowThreshold: 0,
    maxAsyncBytes: 0,
    maxAsyncJobs: 0,
    memorySoftLimit: 0,
  };
  let asyncSizeThreshold = initialAsyncSizeThreshold;
  let inflightAsyncJobs = 0;
  let inflightAsyncBytes = 0;
  let syncSamples = 0;
  let asyncSamples = 0;
  let syncThroughput = 0;
  let asyncThroughput = 0;
  let retuneCount = 0;
  let lastRssSampleAt = -Infinity;
  let cachedRss = 0;
  let didLogSummary = false;

  if (shouldLogDiagnostics) {
    console.log(
      `[zip-adaptive] start threshold_kib=${toKiB(asyncSizeThreshold)} max_async_jobs=${maxAsyncJobs} max_async_bytes=${maxAsyncBytes} memory_soft_limit=${memorySoftLimit} rss=${process.memoryUsage.rss()}`,
    );
  }

  function beginAsyncCompression(assetSize: number): () => void {
    inflightAsyncJobs += 1;
    inflightAsyncBytes += assetSize;

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

  function finalize(): void {
    if (!shouldLogDiagnostics || didLogSummary) {
      return;
    }

    didLogSummary = true;
    console.log(
      `[zip-adaptive] summary final_threshold_kib=${toKiB(asyncSizeThreshold)} sync_samples=${syncSamples} async_samples=${asyncSamples} retunes=${retuneCount} below_threshold=${fallbackCounts.belowThreshold} max_jobs=${fallbackCounts.maxAsyncJobs} max_async_bytes=${fallbackCounts.maxAsyncBytes} memory_soft_limit_hits=${fallbackCounts.memorySoftLimit} rss=${process.memoryUsage.rss()}`,
    );
  }

  function recordSyncCompression(assetSize: number, durationMs: number): void {
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
    const rss = getRss();
    if (assetSize < asyncSizeThreshold) {
      fallbackCounts.belowThreshold += 1;
      return false;
    }

    if (inflightAsyncJobs >= maxAsyncJobs) {
      fallbackCounts.maxAsyncJobs += 1;
      return false;
    }

    if (inflightAsyncBytes + assetSize > maxAsyncBytes) {
      fallbackCounts.maxAsyncBytes += 1;
      return false;
    }

    if (rss + inflightAsyncBytes + assetSize > memorySoftLimit) {
      fallbackCounts.memorySoftLimit += 1;
      return false;
    }

    return true;
  }

  function retuneAsyncThreshold(): void {
    if (syncSamples < 2 || asyncSamples < 2) {
      return;
    }

    const asyncIsClearlyBetter = asyncThroughput > syncThroughput * 1.2;
    const syncIsClearlyBetter = syncThroughput > asyncThroughput * 1.1;
    const underPressure =
      inflightAsyncJobs >= maxAsyncJobs ||
      inflightAsyncBytes >= maxAsyncBytes * 0.75 ||
      getRss() >= memorySoftLimit;
    const previousAsyncSizeThreshold = asyncSizeThreshold;
    let retuneReason: 'async_better' | 'sync_better' | 'under_pressure' | null =
      null;

    if (syncIsClearlyBetter || underPressure) {
      asyncSizeThreshold = Math.min(
        MAX_ASYNC_COMPRESSION_SIZE,
        Math.floor(asyncSizeThreshold * 1.5),
      );
      retuneReason = underPressure ? 'under_pressure' : 'sync_better';
    } else if (asyncIsClearlyBetter) {
      asyncSizeThreshold = Math.max(
        MIN_ASYNC_COMPRESSION_SIZE,
        Math.floor(asyncSizeThreshold / 1.25),
      );
      retuneReason = 'async_better';
    }

    if (
      shouldLogDiagnostics &&
      retuneReason &&
      asyncSizeThreshold !== previousAsyncSizeThreshold
    ) {
      retuneCount += 1;
      console.log(
        `[zip-adaptive] retune from_kib=${toKiB(previousAsyncSizeThreshold)} to_kib=${toKiB(asyncSizeThreshold)} reason=${retuneReason} sync_throughput=${Math.round(syncThroughput)} async_throughput=${Math.round(asyncThroughput)} inflight_jobs=${inflightAsyncJobs} inflight_async_bytes=${inflightAsyncBytes}`,
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
    finalize,
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

function toKiB(bytes: number): number {
  return Math.round(bytes / KiB);
}
