import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import {
  formatTime,
  normalizeTestPath,
  XML,
} from '../../../../.github/scripts/shared/utils.mts';

const BENCHMARK_MODES = [
  'withFixtures',
  'sharedReset',
  'sharedNoReset',
] as const;

const MODE_COMPARISONS = [
  ['withFixtures', 'sharedReset'],
  ['withFixtures', 'sharedNoReset'],
  ['sharedReset', 'sharedNoReset'],
] as const;

type BenchmarkMode = (typeof BENCHMARK_MODES)[number];

type BenchmarkRun = {
  iteration: number;
  mode: BenchmarkMode;
  sequenceIndex: number;
  suiteMs: number;
  suiteNames: string[];
  wallMs: number;
  xmlFiles: string[];
};

type SummaryStats = {
  maxMs: number;
  meanMs: number;
  medianMs: number;
  minMs: number;
  p95Ms: number;
};

type ModeSummary = {
  runs: BenchmarkRun[];
  suite: SummaryStats;
  wall: SummaryStats;
};

type ParsedArgs = {
  browser: 'chrome' | 'firefox';
  iterations: number;
  out: string;
  spec: string;
};

function calculateSummaryStats(values: number[]): SummaryStats {
  if (values.length === 0) {
    throw new Error('Cannot summarize an empty set of benchmark values.');
  }

  const sorted = [...values].sort((left, right) => left - right);
  const meanMs =
    sorted.reduce((total, value) => total + value, 0) / sorted.length;
  const medianMs =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
  const p95Index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);

  return {
    maxMs: sorted[sorted.length - 1],
    meanMs,
    medianMs,
    minMs: sorted[0],
    p95Ms: sorted[p95Index],
  };
}

function createMarkdownTable(
  modeSummaries: Record<BenchmarkMode, ModeSummary>,
) {
  const rows = BENCHMARK_MODES.map((mode) => {
    const summary = modeSummaries[mode];
    return `| ${mode} | ${summary.runs.length} | ${formatTime(
      summary.wall.meanMs,
    )} | ${formatTime(summary.wall.medianMs)} | ${formatTime(
      summary.wall.p95Ms,
    )} | ${formatTime(summary.suite.meanMs)} | ${formatTime(
      summary.suite.medianMs,
    )} | ${formatTime(summary.suite.p95Ms)} |`;
  });

  return [
    '| Mode | Runs | Mean wall | Median wall | P95 wall | Mean suite | Median suite | P95 suite |',
    '| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...rows,
  ].join('\n');
}

function formatSignedTime(ms: number) {
  const sign = ms < 0 ? '-' : '+';
  return `${sign}${formatTime(Math.abs(ms))}`;
}

function formatDeltaPercent(deltaMs: number, baselineMs: number) {
  return `${((deltaMs / baselineMs) * 100).toFixed(1)}%`;
}

function createModeComparison(
  baseline: BenchmarkMode,
  target: BenchmarkMode,
  modeSummaries: Record<BenchmarkMode, ModeSummary>,
) {
  const baselineSummary = modeSummaries[baseline];
  const targetSummary = modeSummaries[target];
  const wallDeltaMs =
    targetSummary.wall.medianMs - baselineSummary.wall.medianMs;
  const suiteDeltaMs =
    targetSummary.suite.medianMs - baselineSummary.suite.medianMs;

  return [
    `Median wall-clock delta (\`${target} - ${baseline}\`): ${formatSignedTime(
      wallDeltaMs,
    )} (${formatDeltaPercent(wallDeltaMs, baselineSummary.wall.medianMs)})`,
    `Median suite-time delta (\`${target} - ${baseline}\`): ${formatSignedTime(
      suiteDeltaMs,
    )} (${formatDeltaPercent(suiteDeltaMs, baselineSummary.suite.medianMs)})`,
  ].join('\n');
}

function createMarkdownSummary(
  args: ParsedArgs,
  modeSummaries: Record<BenchmarkMode, ModeSummary>,
) {
  const comparisons = MODE_COMPARISONS.map(([baseline, target]) =>
    createModeComparison(baseline, target, modeSummaries),
  );

  return [
    '# Fixture Session Benchmark',
    '',
    `- Spec: \`${args.spec}\``,
    `- Browser: \`${args.browser}\``,
    `- Iterations per mode: \`${args.iterations}\``,
    `- Run order: ${BENCHMARK_MODES.map((mode) => `\`${mode}\``).join(
      ', ',
    )}`,
    '',
    createMarkdownTable(modeSummaries),
    '',
    ...comparisons,
  ].join('\n');
}

async function ensureEmptyDirectory(directoryPath: string) {
  await fs.rm(directoryPath, { force: true, recursive: true });
  await fs.mkdir(directoryPath, { recursive: true });
}

async function runCommand(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
): Promise<void> {
  await new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, {
      env,
      stdio: 'inherit',
    });

    childProcess.once('exit', (code, signal) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(
        new Error(
          `Benchmark command failed with code "${code}" and signal "${signal}".`,
        ),
      );
    });

    childProcess.once('error', reject);
  });
}

async function parseSuiteResults(
  resultsDirectory: string,
  specPath: string,
): Promise<Pick<BenchmarkRun, 'suiteMs' | 'suiteNames' | 'xmlFiles'>> {
  const xmlFiles = (await fs.readdir(resultsDirectory)).filter((filename) =>
    filename.endsWith('.xml'),
  );

  let suiteMs = 0;
  const suiteNames: string[] = [];

  for (const filename of xmlFiles) {
    const xmlContents = await fs.readFile(
      path.join(resultsDirectory, filename),
      'utf8',
    );
    const parsedResults = await XML.parse(xmlContents);

    for (const suite of parsedResults.testsuites?.testsuite || []) {
      if (!suite.$?.file) {
        continue;
      }

      if (normalizeTestPath(suite.$.file) !== specPath) {
        continue;
      }

      suiteNames.push(suite.$.name);
      suiteMs += Number(suite.$.time || 0) * 1000;
    }
  }

  if (suiteNames.length === 0) {
    throw new Error(
      `Did not find any JUnit suites for benchmark spec "${specPath}" in ${resultsDirectory}.`,
    );
  }

  return { suiteMs, suiteNames, xmlFiles };
}

async function runSingleBenchmark(
  args: ParsedArgs,
  mode: BenchmarkMode,
  iteration: number,
  sequenceIndex: number,
): Promise<BenchmarkRun> {
  const resultsDirectory = path.resolve('test/test-results/e2e');

  await ensureEmptyDirectory(resultsDirectory);

  console.log(
    `\n=== Running ${mode} benchmark (${sequenceIndex}) for iteration ${iteration}/${args.iterations} ===\n`,
  );

  const startedAt = Date.now();
  await runCommand(
    process.execPath,
    [
      'test/e2e/run-e2e-test.js',
      '--browser',
      args.browser,
      '--debug=false',
      args.spec,
    ],
    {
      ...process.env,
      FIXTURE_SESSION_BENCHMARK_MODE: mode,
    },
  );
  const wallMs = Date.now() - startedAt;

  const { suiteMs, suiteNames, xmlFiles } = await parseSuiteResults(
    resultsDirectory,
    args.spec,
  );

  console.log(
    `Completed ${mode} benchmark (${sequenceIndex}) in ${formatTime(
      wallMs,
    )}; JUnit suite time ${formatTime(suiteMs)}.`,
  );

  return {
    iteration,
    mode,
    sequenceIndex,
    suiteMs,
    suiteNames,
    wallMs,
    xmlFiles,
  };
}

function getModeOrder(iteration: number): BenchmarkMode[] {
  const offset = (iteration - 1) % BENCHMARK_MODES.length;
  return [
    ...BENCHMARK_MODES.slice(offset),
    ...BENCHMARK_MODES.slice(0, offset),
  ];
}

async function main() {
  const { argv } = yargs(hideBin(process.argv))
    .usage('$0 [options]', 'Run the fixture-session benchmark')
    .option('browser', {
      choices: ['chrome', 'firefox'] as const,
      default: 'chrome',
      description: 'Browser used for the benchmark run',
      type: 'string',
    })
    .option('iterations', {
      default: 5,
      description: 'Number of iterations to run for each benchmark mode',
      type: 'number',
    })
    .option('out', {
      default: 'test-artifacts/fixture-session-benchmark',
      description: 'Directory for benchmark outputs',
      type: 'string',
    })
    .option('spec', {
      default:
        'test/e2e/benchmarks/fixture-session/phishing-redirects.fixture-session-benchmark.spec.ts',
      description: 'Benchmark spec file to execute',
      type: 'string',
    })
    .strict()
    .help();

  const args = argv as ParsedArgs;
  const outDirectory = path.resolve(args.out);
  const normalizedSpecPath = normalizeTestPath(args.spec);
  const runs: BenchmarkRun[] = [];
  let sequenceIndex = 0;

  await fs.mkdir(outDirectory, { recursive: true });

  for (let iteration = 1; iteration <= args.iterations; iteration += 1) {
    for (const mode of getModeOrder(iteration)) {
      sequenceIndex += 1;
      runs.push(
        await runSingleBenchmark(
          {
            ...args,
            spec: normalizedSpecPath,
          },
          mode,
          iteration,
          sequenceIndex,
        ),
      );
    }
  }

  const modeSummaries = Object.fromEntries(
    BENCHMARK_MODES.map((mode) => {
      const modeRuns = runs.filter((run) => run.mode === mode);
      return [
        mode,
        {
          runs: modeRuns,
          suite: calculateSummaryStats(modeRuns.map((run) => run.suiteMs)),
          wall: calculateSummaryStats(modeRuns.map((run) => run.wallMs)),
        },
      ];
    }),
  ) as Record<BenchmarkMode, ModeSummary>;

  const markdownSummary = createMarkdownSummary(
    {
      ...args,
      spec: normalizedSpecPath,
    },
    modeSummaries,
  );

  const jsonSummary = {
    benchmark: 'fixture-session-phishing-redirects',
    browser: args.browser,
    iterations: args.iterations,
    modes: modeSummaries,
    spec: normalizedSpecPath,
    summaryMarkdown: markdownSummary,
  };

  await fs.writeFile(
    path.join(outDirectory, 'results.json'),
    JSON.stringify(jsonSummary, null, 2),
  );
  await fs.writeFile(path.join(outDirectory, 'summary.md'), markdownSummary);

  console.log(`\n${markdownSummary}\n`);
}

main().catch((error) => {
  console.error('Fixture-session benchmark failed:', error);
  process.exitCode = 1;
});
