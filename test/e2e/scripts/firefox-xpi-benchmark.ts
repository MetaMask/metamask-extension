import nodeCrypto from 'crypto';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { performance as perf } from 'perf_hooks';
import process from 'process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const MANIFEST_FILE_NAME = 'manifest.json';
const DEFAULT_ITERATIONS = 2;

type FirefoxDriverInternal = {
  _buildXpiTemplate: (
    absDir: string,
    xpiPath: string,
    manifestBuffer: Buffer,
  ) => Promise<string>;
  _patchManifest: (xpiPath: string, manifestBuffer: Buffer) => Promise<void>;
  _buildXpi: (
    addonDir: string,
    xpiPath: string,
    options?: {
      buffer?: Buffer;
      mode?: number;
      mtime?: Date;
    },
  ) => Promise<unknown>;
  _getOrBuildXpi: (addonDir: string) => Promise<string>;
};

type BenchmarkSample = {
  iteration: number;
  label: string;
  outputSizeBytes?: number;
  path?: string;
  durationMs: number;
};

type BenchmarkSummary = {
  label: string;
  meanMs: number;
  minMs: number;
  maxMs: number;
  samples: number;
  outputSizeBytes?: number;
};

const FirefoxDriver = require('../webdriver/firefox') as FirefoxDriverInternal;

function parseArgs(argv: string[]) {
  let addonDir = 'dist/firefox';
  let iterations = DEFAULT_ITERATIONS;
  let keepTemp = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--addon-dir') {
      addonDir = argv[index + 1];
      index += 1;
    } else if (argument === '--iterations') {
      iterations = parseInt(argv[index + 1], 10);
      index += 1;
    } else if (argument === '--keep-temp') {
      keepTemp = true;
    } else if (argument === '--help') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new Error(`Invalid iterations value: ${iterations}`);
  }

  return {
    addonDir: path.resolve(addonDir),
    iterations,
    keepTemp,
  };
}

function printHelp() {
  console.log(`Usage: yarn test:e2e:firefox:xpi-benchmark [options]

Options:
  --addon-dir <path>    Unpacked Firefox extension directory
  --iterations <count>  Number of benchmark iterations (default: ${DEFAULT_ITERATIONS})
  --keep-temp           Preserve the benchmark workspace after the run
  --help                Show this message
`);
}

function getDirHash(addonDir: string): string {
  return nodeCrypto
    .createHash('sha256')
    .update(path.resolve(addonDir))
    .digest('hex')
    .slice(0, 12);
}

function listDriverCachePaths(addonDir: string): string[] {
  const dirHash = getDirHash(addonDir);
  const prefix = `metamask-e2e-${dirHash}`;

  return fs
    .readdirSync(os.tmpdir())
    .filter((entry) => entry.startsWith(prefix))
    .map((entry) => path.join(os.tmpdir(), entry));
}

function clearDriverCaches(addonDir: string) {
  for (const filePath of listDriverCachePaths(addonDir)) {
    fs.rmSync(filePath, { force: true });
  }
}

function readManifestTemplate(addonDir: string) {
  return fs.readFileSync(path.join(addonDir, MANIFEST_FILE_NAME), 'utf8');
}

function writeManifestVariant(
  addonDir: string,
  manifestTemplate: string,
  variantLabel: string,
) {
  const manifest = JSON.parse(manifestTemplate) as {
    _flags?: Record<string, unknown>;
  };

  manifest._flags = {
    ...(manifest._flags ?? {}),
    xpiBenchmarkVariant: variantLabel,
  };

  fs.writeFileSync(
    path.join(addonDir, MANIFEST_FILE_NAME),
    JSON.stringify(manifest, null, 2),
  );
}

async function measure<ResultType>(
  operation: () => Promise<ResultType> | ResultType,
) {
  const start = perf.now();
  const result = await operation();
  const durationMs = perf.now() - start;

  return {
    durationMs,
    result,
  };
}

function buildWithZipUtil(addonDir: string, xpiPath: string) {
  try {
    fs.rmSync(xpiPath, { force: true });
  } catch {
    // Ignore cleanup failures before rebuilding the archive.
  }

  execFileSync('zip', ['-r', '-0', '-q', xpiPath, '.'], {
    cwd: addonDir,
    stdio: 'pipe',
  });
}

function formatDuration(durationMs: number) {
  return `${durationMs.toFixed(1)} ms`;
}

function formatBytes(bytes?: number) {
  if (bytes === undefined) {
    return '-';
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

function summarize(samples: BenchmarkSample[]): BenchmarkSummary[] {
  const summaries = new Map<string, BenchmarkSummary>();

  for (const sample of samples) {
    const existing = summaries.get(sample.label);

    if (!existing) {
      summaries.set(sample.label, {
        label: sample.label,
        maxMs: sample.durationMs,
        meanMs: sample.durationMs,
        minMs: sample.durationMs,
        outputSizeBytes: sample.outputSizeBytes,
        samples: 1,
      });
      continue;
    }

    existing.samples += 1;
    existing.meanMs += sample.durationMs;
    existing.minMs = Math.min(existing.minMs, sample.durationMs);
    existing.maxMs = Math.max(existing.maxMs, sample.durationMs);
    if (existing.outputSizeBytes === undefined) {
      existing.outputSizeBytes = sample.outputSizeBytes;
    }
  }

  return [...summaries.values()]
    .map((summary) => ({
      ...summary,
      meanMs: summary.meanMs / summary.samples,
    }))
    .sort((summaryA, summaryB) => summaryA.label.localeCompare(summaryB.label));
}

function printSummary(samples: BenchmarkSample[]) {
  const summaries = summarize(samples);

  console.log('\nSummary');
  console.log(
    'Step'.padEnd(32) +
      'Mean'.padStart(14) +
      'Min'.padStart(14) +
      'Max'.padStart(14) +
      'Size'.padStart(14),
  );

  for (const summary of summaries) {
    console.log(
      summary.label.padEnd(32) +
        formatDuration(summary.meanMs).padStart(14) +
        formatDuration(summary.minMs).padStart(14) +
        formatDuration(summary.maxMs).padStart(14) +
        formatBytes(summary.outputSizeBytes).padStart(14),
    );
  }

  console.log('\nRaw samples');
  for (const sample of samples) {
    console.log(
      `iter=${sample.iteration} ${sample.label} ${formatDuration(sample.durationMs)}`,
    );
  }
}

function recordSample(
  samples: BenchmarkSample[],
  iteration: number,
  label: string,
  durationMs: number,
  outputPath?: string,
) {
  samples.push({
    durationMs,
    iteration,
    label,
    outputSizeBytes: outputPath ? fs.statSync(outputPath).size : undefined,
    path: outputPath,
  });
}

async function runOptimizedEndToEndBenchmark(
  addonDir: string,
  manifestTemplate: string,
  iteration: number,
  samples: BenchmarkSample[],
) {
  clearDriverCaches(addonDir);
  writeManifestVariant(
    addonDir,
    manifestTemplate,
    `optimized-create-${iteration}`,
  );

  const createMeasurement = await measure(() =>
    FirefoxDriver._getOrBuildXpi(addonDir),
  );
  recordSample(
    samples,
    iteration,
    'optimized.endToEndCreate',
    createMeasurement.durationMs,
    createMeasurement.result,
  );

  const cachedMeasurement = await measure(() =>
    FirefoxDriver._getOrBuildXpi(addonDir),
  );
  recordSample(
    samples,
    iteration,
    'optimized.cachedHit',
    cachedMeasurement.durationMs,
    cachedMeasurement.result,
  );

  writeManifestVariant(
    addonDir,
    manifestTemplate,
    `optimized-update-${iteration}`,
  );
  const updateMeasurement = await measure(() =>
    FirefoxDriver._getOrBuildXpi(addonDir),
  );
  recordSample(
    samples,
    iteration,
    'optimized.endToEndUpdate',
    updateMeasurement.durationMs,
    updateMeasurement.result,
  );
}

async function runOptimizedInternalBenchmark(
  addonDir: string,
  benchmarkRoot: string,
  manifestTemplate: string,
  iteration: number,
  samples: BenchmarkSample[],
) {
  clearDriverCaches(addonDir);
  writeManifestVariant(
    addonDir,
    manifestTemplate,
    `optimized-template-create-${iteration}`,
  );

  const templatePath = path.join(
    benchmarkRoot,
    `optimized-template-${iteration}.xpi`,
  );
  const createManifestBuffer = fs.readFileSync(
    path.join(addonDir, MANIFEST_FILE_NAME),
  );

  const templateBuildMeasurement = await measure(() =>
    FirefoxDriver._buildXpiTemplate(
      addonDir,
      templatePath,
      createManifestBuffer,
    ),
  );
  recordSample(
    samples,
    iteration,
    'optimized.templateBuild',
    templateBuildMeasurement.durationMs,
    templatePath,
  );

  writeManifestVariant(
    addonDir,
    manifestTemplate,
    `optimized-template-update-${iteration}`,
  );
  const updateManifestBuffer = fs.readFileSync(
    path.join(addonDir, MANIFEST_FILE_NAME),
  );

  const manifestPatchMeasurement = await measure(() =>
    FirefoxDriver._patchManifest(templatePath, updateManifestBuffer),
  );
  recordSample(
    samples,
    iteration,
    'optimized.manifestPatch',
    manifestPatchMeasurement.durationMs,
    templatePath,
  );
}

async function runFullYazlBenchmark(
  addonDir: string,
  benchmarkRoot: string,
  manifestTemplate: string,
  iteration: number,
  samples: BenchmarkSample[],
) {
  writeManifestVariant(
    addonDir,
    manifestTemplate,
    `yazl-full-create-${iteration}`,
  );

  const createPath = path.join(
    benchmarkRoot,
    `yazl-full-create-${iteration}.xpi`,
  );
  const createMeasurement = await measure(() =>
    FirefoxDriver._buildXpi(addonDir, createPath),
  );
  recordSample(
    samples,
    iteration,
    'yazlFull.create',
    createMeasurement.durationMs,
    createPath,
  );

  writeManifestVariant(
    addonDir,
    manifestTemplate,
    `yazl-full-update-${iteration}`,
  );

  const updatePath = path.join(
    benchmarkRoot,
    `yazl-full-update-${iteration}.xpi`,
  );
  const updateMeasurement = await measure(() =>
    FirefoxDriver._buildXpi(addonDir, updatePath),
  );
  recordSample(
    samples,
    iteration,
    'yazlFull.update',
    updateMeasurement.durationMs,
    updatePath,
  );
}

async function runZipUtilBenchmark(
  addonDir: string,
  benchmarkRoot: string,
  manifestTemplate: string,
  iteration: number,
  samples: BenchmarkSample[],
) {
  writeManifestVariant(
    addonDir,
    manifestTemplate,
    `zip-util-create-${iteration}`,
  );

  const createPath = path.join(
    benchmarkRoot,
    `zip-util-create-${iteration}.xpi`,
  );
  const createMeasurement = await measure(() =>
    buildWithZipUtil(addonDir, createPath),
  );
  recordSample(
    samples,
    iteration,
    'zipUtil.create',
    createMeasurement.durationMs,
    createPath,
  );

  writeManifestVariant(
    addonDir,
    manifestTemplate,
    `zip-util-update-${iteration}`,
  );

  const updatePath = path.join(
    benchmarkRoot,
    `zip-util-update-${iteration}.xpi`,
  );
  const updateMeasurement = await measure(() =>
    buildWithZipUtil(addonDir, updatePath),
  );
  recordSample(
    samples,
    iteration,
    'zipUtil.update',
    updateMeasurement.durationMs,
    updatePath,
  );
}

async function main() {
  const { addonDir, iterations, keepTemp } = parseArgs(process.argv.slice(2));
  const manifestPath = path.join(addonDir, MANIFEST_FILE_NAME);

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing manifest.json in ${addonDir}`);
  }

  const benchmarkRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'metamask-firefox-xpi-benchmark-'),
  );
  const workspaceAddonDir = path.join(benchmarkRoot, 'firefox');
  fs.cpSync(addonDir, workspaceAddonDir, { recursive: true });

  console.log(`Workspace: ${benchmarkRoot}`);
  console.log(`Benchmarking: ${workspaceAddonDir}`);
  console.log(`Iterations: ${iterations}`);

  const manifestTemplate = readManifestTemplate(workspaceAddonDir);
  const samples: BenchmarkSample[] = [];

  try {
    for (let iteration = 1; iteration <= iterations; iteration += 1) {
      console.log(`\nIteration ${iteration}/${iterations}`);

      await runOptimizedEndToEndBenchmark(
        workspaceAddonDir,
        manifestTemplate,
        iteration,
        samples,
      );
      await runOptimizedInternalBenchmark(
        workspaceAddonDir,
        benchmarkRoot,
        manifestTemplate,
        iteration,
        samples,
      );
      await runFullYazlBenchmark(
        workspaceAddonDir,
        benchmarkRoot,
        manifestTemplate,
        iteration,
        samples,
      );
      await runZipUtilBenchmark(
        workspaceAddonDir,
        benchmarkRoot,
        manifestTemplate,
        iteration,
        samples,
      );
    }

    printSummary(samples);
  } finally {
    if (keepTemp) {
      console.log(`\nKept workspace: ${benchmarkRoot}`);
    } else {
      fs.rmSync(benchmarkRoot, { force: true, recursive: true });
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
