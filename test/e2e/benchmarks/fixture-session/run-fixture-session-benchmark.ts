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
  'sharedResetCdpNoPreload',
  'sharedResetCdpNoPreloadNoWait',
  'sharedResetNoPreload',
  'sharedResetNoPreloadNoWait',
  'sharedNoReset',
] as const;

const MODE_COMPARISONS = [
  ['withFixtures', 'sharedReset'],
  ['withFixtures', 'sharedResetCdpNoPreload'],
  ['withFixtures', 'sharedResetCdpNoPreloadNoWait'],
  ['withFixtures', 'sharedResetNoPreload'],
  ['withFixtures', 'sharedResetNoPreloadNoWait'],
  ['withFixtures', 'sharedNoReset'],
  ['sharedReset', 'sharedResetNoPreload'],
  ['sharedResetNoPreload', 'sharedResetCdpNoPreload'],
  ['sharedResetNoPreloadNoWait', 'sharedResetCdpNoPreloadNoWait'],
  ['sharedResetNoPreload', 'sharedResetNoPreloadNoWait'],
  ['sharedReset', 'sharedNoReset'],
] as const;
const PROFILE_MARKER = '[fixture-benchmark-profile] ';
const ANSI_ESCAPE_CODE = 0x1b;

type BenchmarkMode = (typeof BENCHMARK_MODES)[number];

type BenchmarkRun = {
  iteration: number;
  mode: BenchmarkMode;
  profiles: BenchmarkProfile[];
  sequenceIndex: number;
  suiteMs: number;
  suiteNames: string[];
  wallMs: number;
  xmlFiles: string[];
};

type BenchmarkProfile = Record<string, unknown>;

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
  modes: BenchmarkMode[];
  out: string;
  spec: string;
};
type ModeSummaries = Partial<Record<BenchmarkMode, ModeSummary>>;

function stripAnsiCodes(value: string) {
  let strippedValue = '';

  for (let index = 0; index < value.length; index += 1) {
    if (
      value.charCodeAt(index) === ANSI_ESCAPE_CODE &&
      value[index + 1] === '['
    ) {
      index += 2;
      while (
        index < value.length &&
        (value[index] < '@' || value[index] > '~')
      ) {
        index += 1;
      }
      continue;
    }

    strippedValue += value[index];
  }

  return strippedValue;
}

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
  modes: BenchmarkMode[],
  modeSummaries: ModeSummaries,
) {
  const rows = modes.map((mode) => {
    const summary = getModeSummary(modeSummaries, mode);
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

function getModeSummary(
  modeSummaries: ModeSummaries,
  mode: BenchmarkMode,
): ModeSummary {
  const summary = modeSummaries[mode];
  if (!summary) {
    throw new Error(`Missing benchmark summary for mode "${mode}".`);
  }

  return summary;
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
  modeSummaries: ModeSummaries,
) {
  const baselineSummary = getModeSummary(modeSummaries, baseline);
  const targetSummary = getModeSummary(modeSummaries, target);
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
  modeSummaries: ModeSummaries,
) {
  const comparisons = MODE_COMPARISONS.filter(
    ([baseline, target]) =>
      args.modes.includes(baseline) && args.modes.includes(target),
  ).map(([baseline, target]) =>
    createModeComparison(baseline, target, modeSummaries),
  );

  return [
    '# Fixture Session Benchmark',
    '',
    `- Spec: \`${args.spec}\``,
    `- Browser: \`${args.browser}\``,
    `- Iterations per mode: \`${args.iterations}\``,
    `- Run order: ${args.modes.map((mode) => `\`${mode}\``).join(
      ', ',
    )}`,
    '',
    createMarkdownTable(args.modes, modeSummaries),
    '',
    ...comparisons,
  ].join('\n');
}

function parseBenchmarkModes(value: string | string[]): BenchmarkMode[] {
  const rawModes = (Array.isArray(value) ? value : [value]).flatMap((entry) =>
    entry.split(','),
  );
  const modes = rawModes
    .map((mode) => mode.trim())
    .filter((mode) => mode.length > 0);

  if (modes.length === 0) {
    throw new Error('At least one benchmark mode is required.');
  }

  const unsupportedModes = modes.filter(
    (mode): mode is string =>
      !(BENCHMARK_MODES as readonly string[]).includes(mode),
  );
  if (unsupportedModes.length > 0) {
    throw new Error(
      `Unsupported benchmark mode(s): ${unsupportedModes.join(
        ', ',
      )}. Expected one of: ${BENCHMARK_MODES.join(', ')}.`,
    );
  }

  return modes as BenchmarkMode[];
}

async function ensureEmptyDirectory(directoryPath: string) {
  await fs.rm(directoryPath, { force: true, recursive: true });
  await fs.mkdir(directoryPath, { recursive: true });
}

async function runCommand(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
): Promise<BenchmarkProfile[]> {
  const profiles: BenchmarkProfile[] = [];
  let stdoutBuffer = '';
  let stderrBuffer = '';

  const processLines = (chunk: Buffer, stream: NodeJS.WriteStream) => {
    stream.write(chunk);

    let buffer = stream === process.stdout ? stdoutBuffer : stderrBuffer;
    buffer += chunk.toString('utf8');
    const lines = buffer.split(/\r?\n/u);
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const lineWithoutAnsi = stripAnsiCodes(line);
      const markerIndex = lineWithoutAnsi.indexOf(PROFILE_MARKER);
      if (markerIndex === -1) {
        continue;
      }

      const json = lineWithoutAnsi.slice(markerIndex + PROFILE_MARKER.length);
      try {
        profiles.push(JSON.parse(json));
      } catch (error) {
        console.warn(`Failed to parse benchmark profile line: ${line}`, error);
      }
    }

    if (stream === process.stdout) {
      stdoutBuffer = buffer;
    } else {
      stderrBuffer = buffer;
    }
  };

  await new Promise<void>((resolve, reject) => {
    const childProcess = spawn(command, args, {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    childProcess.stdout.on('data', (chunk: Buffer) => {
      processLines(chunk, process.stdout);
    });
    childProcess.stderr.on('data', (chunk: Buffer) => {
      processLines(chunk, process.stderr);
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

  return profiles;
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
  const profiles = await runCommand(
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
      FIXTURE_SESSION_BENCHMARK_PROFILE: 'true',
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
    profiles,
    sequenceIndex,
    suiteMs,
    suiteNames,
    wallMs,
    xmlFiles,
  };
}

function getModeOrder(iteration: number, modes: BenchmarkMode[]): BenchmarkMode[] {
  const offset = (iteration - 1) % modes.length;
  return [
    ...modes.slice(offset),
    ...modes.slice(0, offset),
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
    .option('modes', {
      coerce: parseBenchmarkModes,
      default: BENCHMARK_MODES.join(','),
      description:
        'Comma-separated benchmark modes to run. Defaults to every mode.',
      type: 'string',
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
    for (const mode of getModeOrder(iteration, args.modes)) {
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
    args.modes.map((mode) => {
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
  ) as ModeSummaries;

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
