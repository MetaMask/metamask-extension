import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

type Args = {
  iterations: number;
  out?: string;
  refLabel: string;
};

type VariantName =
  | 'zip1'
  | 'yazlCurrent'
  | 'yazlManifestCompressed'
  | 'yazlManifestStoredRaw';

type VariantResult = {
  path: string;
  size: number;
  samples: number[];
  summary: {
    mean: number;
    median: number;
    p95: number;
  };
};

type BenchmarkResult = {
  gitRef: string;
  gitSha: string;
  iterations: number;
  variants: Record<VariantName, VariantResult>;
};

const MANIFEST_FILE_NAME = 'manifest.json';
const MANIFEST_SIZE = 64 * 1024;

function parseArgs(argv: string[]): Args {
  let iterations = 7;
  let out: string | undefined;
  let refLabel = 'unknown';

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--iterations') {
      iterations = Number(argv[index + 1]);
      index += 1;
    } else if (arg === '--out') {
      out = argv[index + 1];
      index += 1;
    } else if (arg === '--ref-label') {
      refLabel = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new Error(`Invalid iterations: ${iterations}`);
  }

  return { iterations, out, refLabel };
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: number[], percentileValue: number) {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((percentileValue / 100) * sorted.length) - 1,
  );
  return sorted[index];
}

function summarize(values: number[]) {
  return {
    mean: mean(values),
    median: percentile(values, 50),
    p95: percentile(values, 95),
  };
}

function formatMs(value: number) {
  return `${value.toFixed(1)} ms`;
}

function buildPaddedManifest(absExtDir: string) {
  const manifest = Buffer.allocUnsafe(MANIFEST_SIZE);
  manifest.fill(
    0x20,
    fs.readFileSync(path.join(absExtDir, MANIFEST_FILE_NAME)).copy(manifest),
  );
  return manifest;
}

async function main() {
  const { iterations, out, refLabel } = parseArgs(process.argv.slice(2));
  const root = process.cwd();
  const requireFromTarget = createRequire(path.join(root, 'package.json'));
  const { Builder } = requireFromTarget(
    'selenium-webdriver',
  ) as typeof import('selenium-webdriver');
  const firefox = requireFromTarget(
    'selenium-webdriver/firefox',
  ) as typeof import('selenium-webdriver/firefox');
  const { ZipFile } = requireFromTarget('yazl') as typeof import('yazl');

  const absExtDir = path.resolve('dist/firefox');
  const rawManifest = fs.readFileSync(path.join(absExtDir, MANIFEST_FILE_NAME));
  const paddedManifest = buildPaddedManifest(absExtDir);
  const benchmarkDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'firefox-installaddon-variants-'),
  );

  function buildZip1Xpi() {
    const xpiPath = path.join(benchmarkDir, 'zip1.xpi');
    execFileSync('zip', ['-r', '-1', '-q', xpiPath, '.'], { cwd: absExtDir });
    return xpiPath;
  }

  async function buildYazlXpi(
    name: string,
    manifestBuffer: Buffer,
    manifestOptions: {
      compress: boolean;
      compressionLevel?: number;
    },
  ) {
    const xpiPath = path.join(benchmarkDir, `${name}.xpi`);
    const zipFile = new ZipFile();
    const manifestHash = createHash('sha256')
      .update(manifestBuffer)
      .digest('base64');

    zipFile.addBuffer(manifestBuffer, MANIFEST_FILE_NAME, manifestOptions);
    for (const entry of fs.readdirSync(absExtDir, {
      recursive: true,
      withFileTypes: true,
    })) {
      if (entry.isFile()) {
        const absPath = path.join(entry.parentPath, entry.name);
        const relPath = path.relative(absExtDir, absPath);
        if (relPath !== MANIFEST_FILE_NAME) {
          zipFile.addFile(absPath, relPath, {
            compress: true,
            compressionLevel: 1,
          });
        }
      }
    }

    await new Promise<void>((resolve, reject) => {
      zipFile.outputStream.once('error', reject);
      zipFile.outputStream
        .pipe(fs.createWriteStream(xpiPath))
        .once('error', reject)
        .once('close', () => resolve());
      zipFile.end({ comment: manifestHash, forceZip64Format: false });
    });

    return xpiPath;
  }

  async function measureInstallAddon(xpiPath: string) {
    const options = new firefox.Options();
    options.addArguments('-headless');
    options.setAcceptInsecureCerts(true);
    const driver = await new Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(options)
      .build();

    try {
      const start = performance.now();
      await driver.installAddon(xpiPath, true);
      return performance.now() - start;
    } finally {
      await driver.quit();
    }
  }

  const variants: Record<VariantName, string> = {
    zip1: buildZip1Xpi(),
    yazlCurrent: await buildYazlXpi('yazl-current', paddedManifest, {
      compress: false,
    }),
    yazlManifestCompressed: await buildYazlXpi(
      'yazl-manifest-compressed',
      rawManifest,
      { compress: true, compressionLevel: 1 },
    ),
    yazlManifestStoredRaw: await buildYazlXpi(
      'yazl-manifest-stored-raw',
      rawManifest,
      { compress: false },
    ),
  };

  const results = {} as Record<VariantName, VariantResult>;

  for (const [name, xpiPath] of Object.entries(variants) as [
    VariantName,
    string,
  ][]) {
    const samples: number[] = [];
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      samples.push(await measureInstallAddon(xpiPath));
    }

    results[name] = {
      path: xpiPath,
      size: fs.statSync(xpiPath).size,
      samples,
      summary: summarize(samples),
    };
  }

  const gitSha = requireFromTarget('node:child_process')
    .execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root })
    .toString()
    .trim();

  const result: BenchmarkResult = {
    gitRef: refLabel,
    gitSha,
    iterations,
    variants: results,
  };

  console.log(
    `Firefox installAddon variant benchmark for ${refLabel} (${gitSha})`,
  );
  console.log(
    'Variant'.padEnd(28) +
      'size'.padStart(14) +
      'mean'.padStart(14) +
      'median'.padStart(14) +
      'p95'.padStart(14),
  );

  for (const [name, variant] of Object.entries(result.variants) as [
    VariantName,
    VariantResult,
  ][]) {
    console.log(
      name.padEnd(28) +
        `${(variant.size / (1024 * 1024)).toFixed(1)} MiB`.padStart(14) +
        formatMs(variant.summary.mean).padStart(14) +
        formatMs(variant.summary.median).padStart(14) +
        formatMs(variant.summary.p95).padStart(14),
    );
  }

  if (out) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(result, null, 2));
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
