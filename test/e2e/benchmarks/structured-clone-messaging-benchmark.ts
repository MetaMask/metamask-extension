import assert from 'node:assert';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { performance as nodePerformance } from 'node:perf_hooks';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import { withFixtures } from '../helpers';
import { login } from '../page-objects/flows/login.flow';
import { getServerMochaToBackground } from '../background-socket/server-mocha-to-background';
import { type Driver } from '../webdriver/driver';

const STRUCTURED_CLONE_CHROME_VERSION = '148';
const DEFAULT_ITERATIONS = 20;
const DEFAULT_WARMUPS = 3;
const DEFAULT_PAYLOAD_BYTES = 8 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_OUT =
  'test-artifacts/benchmarks/structured-clone-messaging-benchmark.json';
const DEFAULT_MARKDOWN_OUT =
  'test-artifacts/benchmarks/structured-clone-messaging-benchmark.md';

type VariantName = 'flagOffJson' | 'flagOnStructuredClone';

type VariantSummary = {
  n: number;
  samplesMs: number[];
  meanMs: number;
  medianMs: number;
  minMs: number;
  maxMs: number;
  p75Ms: number;
  p95Ms: number;
  standardDeviationMs: number;
  ci95Ms: {
    lower: number;
    upper: number;
  };
};

type ComparisonSummary = {
  meanDeltaMs: number;
  percentFaster: number;
  degreesOfFreedom: number;
  ci95Ms: {
    lower: number;
    upper: number;
  };
  statisticallySignificant: boolean;
};

type BenchmarkResults = {
  metadata: {
    chromeVersion: string;
    iterationsPerVariant: number;
    warmupsPerBrowserLaunch: number;
    payloadBytes: number;
    payloadMiB: number;
    timeoutMs: number;
    measuredAt: string;
  };
  variants: Record<VariantName, VariantSummary>;
  comparison: ComparisonSummary;
};

type CliOptions = {
  iterations: number;
  warmups: number;
  payloadBytes: number;
  timeoutMs: number;
  out: string;
  markdownOut: string;
};

const VARIANT_LABELS: Record<VariantName, string> = {
  flagOffJson: 'flag off: JSON/chunked messaging',
  flagOnStructuredClone: 'flag on: structured clone messaging',
};

function percentile(sortedSamples: number[], percentileValue: number) {
  assert.ok(sortedSamples.length > 0, 'Cannot calculate empty percentile');

  const index = (percentileValue / 100) * (sortedSamples.length - 1);
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);

  if (lowerIndex === upperIndex) {
    return sortedSamples[lowerIndex];
  }

  const weight = index - lowerIndex;
  return (
    sortedSamples[lowerIndex] * (1 - weight) +
    sortedSamples[upperIndex] * weight
  );
}

function mean(samples: number[]) {
  assert.ok(samples.length > 0, 'Cannot calculate empty mean');

  return samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
}

function sampleVariance(samples: number[], sampleMean = mean(samples)) {
  if (samples.length < 2) {
    return 0;
  }

  return (
    samples.reduce(
      (sum, sample) => sum + Math.pow(sample - sampleMean, 2),
      0,
    ) /
    (samples.length - 1)
  );
}

function tCritical95(degreesOfFreedom: number) {
  const criticalValues = [
    [1, 12.706],
    [2, 4.303],
    [3, 3.182],
    [4, 2.776],
    [5, 2.571],
    [6, 2.447],
    [7, 2.365],
    [8, 2.306],
    [9, 2.262],
    [10, 2.228],
    [11, 2.201],
    [12, 2.179],
    [13, 2.16],
    [14, 2.145],
    [15, 2.131],
    [16, 2.12],
    [17, 2.11],
    [18, 2.101],
    [19, 2.093],
    [20, 2.086],
    [21, 2.08],
    [22, 2.074],
    [23, 2.069],
    [24, 2.064],
    [25, 2.06],
    [26, 2.056],
    [27, 2.052],
    [28, 2.048],
    [29, 2.045],
    [30, 2.042],
    [40, 2.021],
    [60, 2],
    [80, 1.99],
    [100, 1.984],
    [120, 1.98],
    [Number.POSITIVE_INFINITY, 1.96],
  ];

  return (
    criticalValues.find(([upperBound]) => degreesOfFreedom <= upperBound)?.[1] ??
    1.96
  );
}

function summarize(samples: number[]): VariantSummary {
  const sortedSamples = [...samples].sort((a, b) => a - b);
  const sampleMean = mean(samples);
  const standardDeviation = Math.sqrt(sampleVariance(samples, sampleMean));
  const ciHalfWidth =
    tCritical95(samples.length - 1) *
    (standardDeviation / Math.sqrt(samples.length));

  return {
    n: samples.length,
    samplesMs: samples,
    meanMs: sampleMean,
    medianMs: percentile(sortedSamples, 50),
    minMs: sortedSamples[0],
    maxMs: sortedSamples[sortedSamples.length - 1],
    p75Ms: percentile(sortedSamples, 75),
    p95Ms: percentile(sortedSamples, 95),
    standardDeviationMs: standardDeviation,
    ci95Ms: {
      lower: sampleMean - ciHalfWidth,
      upper: sampleMean + ciHalfWidth,
    },
  };
}

function compareVariants(
  flagOffJson: VariantSummary,
  flagOnStructuredClone: VariantSummary,
): ComparisonSummary {
  const meanDeltaMs = flagOffJson.meanMs - flagOnStructuredClone.meanMs;
  const flagOffVariance =
    Math.pow(flagOffJson.standardDeviationMs, 2) / flagOffJson.n;
  const flagOnVariance =
    Math.pow(flagOnStructuredClone.standardDeviationMs, 2) /
    flagOnStructuredClone.n;
  const combinedStandardError = Math.sqrt(flagOffVariance + flagOnVariance);
  const degreesOfFreedomNumerator = Math.pow(
    flagOffVariance + flagOnVariance,
    2,
  );
  const degreesOfFreedomDenominator =
    Math.pow(flagOffVariance, 2) / (flagOffJson.n - 1) +
    Math.pow(flagOnVariance, 2) / (flagOnStructuredClone.n - 1);
  const degreesOfFreedom =
    degreesOfFreedomDenominator === 0
      ? Number.POSITIVE_INFINITY
      : degreesOfFreedomNumerator / degreesOfFreedomDenominator;
  const ciHalfWidth =
    tCritical95(degreesOfFreedom) * combinedStandardError;
  const lower = meanDeltaMs - ciHalfWidth;
  const upper = meanDeltaMs + ciHalfWidth;

  return {
    meanDeltaMs,
    percentFaster: (meanDeltaMs / flagOffJson.meanMs) * 100,
    degreesOfFreedom,
    ci95Ms: {
      lower,
      upper,
    },
    statisticallySignificant: lower > 0 || upper < 0,
  };
}

async function waitForPortStreamPayloadInUi(
  driver: Driver,
  sampleId: string,
  timeoutMs: number,
) {
  const result = (await driver.driver.executeAsyncScript(
    `
      const [sampleIdArg, timeoutMsArg] = arguments;
      const done = arguments[arguments.length - 1];
      const waitForPayload =
        window.stateHooks?.waitForPortStreamChunkingTestPayload;

      if (!waitForPayload) {
        done({
          error: 'Port stream chunking payload UI hook is unavailable',
        });
        return;
      }

      waitForPayload(sampleIdArg, timeoutMsArg)
        .then(() => done({ ok: true }))
        .catch((error) =>
          done({
            error: error instanceof Error ? error.message : String(error),
          }),
        );
    `,
    sampleId,
    timeoutMs,
  )) as { error?: string; ok?: boolean };

  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.ok, true);
}

async function emitAndMeasurePayload({
  driver,
  payloadBytes,
  sampleId,
  timeoutMs,
}: {
  driver: Driver;
  payloadBytes: number;
  sampleId: string;
  timeoutMs: number;
}) {
  const start = nodePerformance.now();

  await getServerMochaToBackground().emitPortStreamChunkingTestPayload(
    payloadBytes,
    sampleId,
  );
  await waitForPortStreamPayloadInUi(driver, sampleId, timeoutMs);

  return nodePerformance.now() - start;
}

async function runVariant({
  variant,
  measuredIterations,
  warmups,
  payloadBytes,
  timeoutMs,
  launchIndex,
}: {
  variant: VariantName;
  measuredIterations: number;
  warmups: number;
  payloadBytes: number;
  timeoutMs: number;
  launchIndex: number;
}) {
  const samples: number[] = [];

  await withFixtures(
    {
      fixtures: new FixtureBuilderV2().build(),
      driverOptions: {
        chromeBrowserVersion: STRUCTURED_CLONE_CHROME_VERSION,
      },
      isBenchmark: true,
      localNodeOptions: [{ type: 'none' }],
      manifestTransform:
        variant === 'flagOffJson'
          ? (manifest: Record<string, unknown>) => {
              delete manifest.message_serialization;
            }
          : undefined,
      title: `structured-clone-messaging-${variant}-${launchIndex}`,
    },
    async ({ driver }: { driver: Driver }) => {
      await login(driver, {
        validateBalance: false,
        waitForNonEvmAccounts: false,
      });

      const beforeStats =
        await getServerMochaToBackground().getPortStreamChunkingTestEventStats();

      for (let index = 0; index < warmups; index++) {
        await emitAndMeasurePayload({
          driver,
          payloadBytes,
          sampleId: `${variant}-launch-${launchIndex}-warmup-${index}`,
          timeoutMs,
        });
      }

      for (let index = 0; index < measuredIterations; index++) {
        const duration = await emitAndMeasurePayload({
          driver,
          payloadBytes,
          sampleId: `${variant}-launch-${launchIndex}-sample-${index}`,
          timeoutMs,
        });

        samples.push(duration);
      }

      const afterStats =
        await getServerMochaToBackground().getPortStreamChunkingTestEventStats();

      if (variant === 'flagOffJson') {
        assert.ok(
          afterStats.count > beforeStats.count,
          `${VARIANT_LABELS[variant]} should use chunked messaging`,
        );
        return;
      }

      assert.strictEqual(
        afterStats.count,
        beforeStats.count,
        `${VARIANT_LABELS[variant]} should not use chunked messaging`,
      );
    },
  );

  return samples;
}

function formatMs(value: number) {
  return `${value.toFixed(1)} ms`;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatCi(ci: { lower: number; upper: number }) {
  return `${formatMs(ci.lower)} to ${formatMs(ci.upper)}`;
}

function buildMarkdown(results: BenchmarkResults) {
  const { variants, comparison, metadata } = results;
  const significanceLabel = comparison.statisticallySignificant ? 'yes' : 'no';

  return [
    '# Structured clone messaging benchmark',
    '',
    `Payload: ${metadata.payloadMiB} MiB typed array`,
    `Samples per variant: ${metadata.iterationsPerVariant}`,
    `Warmups per browser launch: ${metadata.warmupsPerBrowserLaunch}`,
    '',
    '| Variant | n | Mean | Median | P75 | P95 | Std dev | 95% CI |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...Object.entries(variants).map(
      ([variant, summary]) =>
        `| ${VARIANT_LABELS[variant as VariantName]} | ${
          summary.n
        } | ${formatMs(summary.meanMs)} | ${formatMs(
          summary.medianMs,
        )} | ${formatMs(summary.p75Ms)} | ${formatMs(
          summary.p95Ms,
        )} | ${formatMs(summary.standardDeviationMs)} | ${formatCi(
          summary.ci95Ms,
        )} |`,
    ),
    '',
    `Mean delta (flag off - flag on): ${formatMs(
      comparison.meanDeltaMs,
    )} (${formatCi(comparison.ci95Ms)}).`,
    `Structured clone speedup: ${formatPercent(comparison.percentFaster)}.`,
    `95% CI excludes zero: ${significanceLabel}.`,
    '',
    'Positive delta means structured clone messaging was faster.',
    '',
  ].join('\n');
}

async function parseCliOptions(): Promise<CliOptions> {
  const argv = await yargs(hideBin(process.argv))
    .option('iterations', {
      type: 'number',
      default: DEFAULT_ITERATIONS,
      description: 'Measured samples per variant',
    })
    .option('warmups', {
      type: 'number',
      default: DEFAULT_WARMUPS,
      description: 'Warmup samples per browser launch',
    })
    .option('payloadBytes', {
      type: 'number',
      default: DEFAULT_PAYLOAD_BYTES,
      description: 'Typed array payload size in bytes',
    })
    .option('timeoutMs', {
      type: 'number',
      default: DEFAULT_TIMEOUT_MS,
      description: 'Timeout while waiting for the UI to receive a payload',
    })
    .option('out', {
      type: 'string',
      default: DEFAULT_OUT,
      description: 'Path to write benchmark JSON',
    })
    .option('markdownOut', {
      type: 'string',
      default: DEFAULT_MARKDOWN_OUT,
      description: 'Path to write benchmark Markdown summary',
    })
    .strict()
    .parse();

  assert.ok(argv.iterations >= 2, '--iterations must be at least 2');
  assert.ok(argv.warmups >= 0, '--warmups must be at least 0');
  assert.ok(argv.payloadBytes > 0, '--payloadBytes must be greater than 0');
  assert.ok(argv.timeoutMs > 0, '--timeoutMs must be greater than 0');

  return argv;
}

async function main() {
  const options = await parseCliOptions();
  const samples: Record<VariantName, number[]> = {
    flagOffJson: [],
    flagOnStructuredClone: [],
  };
  const variantLaunchOrder: VariantName[] = [
    'flagOffJson',
    'flagOnStructuredClone',
    'flagOnStructuredClone',
    'flagOffJson',
  ];

  for (const [launchIndex, variant] of variantLaunchOrder.entries()) {
    const remaining = options.iterations - samples[variant].length;

    if (remaining <= 0) {
      continue;
    }

    const measuredIterations = Math.min(
      Math.ceil(options.iterations / 2),
      remaining,
    );

    console.log(
      `Running ${VARIANT_LABELS[variant]} launch ${
        launchIndex + 1
      } with ${measuredIterations} measured samples`,
    );

    samples[variant].push(
      ...(await runVariant({
        variant,
        measuredIterations,
        warmups: options.warmups,
        payloadBytes: options.payloadBytes,
        timeoutMs: options.timeoutMs,
        launchIndex,
      })),
    );
  }

  const variants = {
    flagOffJson: summarize(samples.flagOffJson),
    flagOnStructuredClone: summarize(samples.flagOnStructuredClone),
  };
  const results: BenchmarkResults = {
    metadata: {
      chromeVersion: STRUCTURED_CLONE_CHROME_VERSION,
      iterationsPerVariant: options.iterations,
      warmupsPerBrowserLaunch: options.warmups,
      payloadBytes: options.payloadBytes,
      payloadMiB: options.payloadBytes / 1024 / 1024,
      timeoutMs: options.timeoutMs,
      measuredAt: new Date().toISOString(),
    },
    variants,
    comparison: compareVariants(
      variants.flagOffJson,
      variants.flagOnStructuredClone,
    ),
  };
  const markdown = buildMarkdown(results);

  await mkdir(dirname(options.out), { recursive: true });
  await mkdir(dirname(options.markdownOut), { recursive: true });
  await writeFile(options.out, `${JSON.stringify(results, null, 2)}\n`);
  await writeFile(options.markdownOut, markdown);

  console.log(markdown);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
