import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { exitWithError } from '../../development/lib/exit-with-error.js';
import { runInShell } from '../../development/lib/run-command.js';
import {
  getTestPathsForTestDir,
  runningOnGitHubActions,
} from './run-all-shared.mts';

/**
 * Playwright counterpart of `run-all.mts`. Both runners share the same CI
 * test-selection logic (`run-all-shared.mts`): time-based splitting across the
 * GitHub Actions matrix, the e2e quality gate for new/changed specs, and
 * re-run-only-failed on attempt > 1. Only the execution step differs.
 *
 * Quality gate: the splitter weights each new/changed spec with extra copies
 * and distributes them across shards, so the extra runs are accounted for in
 * the shard time balancing and execute in parallel. The Selenium runner turns
 * each copy into one `run-e2e-test.js --stop-after-one-failure --retries=N`
 * invocation, which runs the spec up to N+1 times and stops at the first
 * failure. This runner maps the same semantics onto native Playwright flags:
 * each copy of a spec in this shard's chunk contributes N+1 runs via
 * `--repeat-each`, combined with `--retries=0` (no retry masking) and
 * `--max-failures=1` (fail fast).
 *
 * Splitting/quality-gate/re-run logic only runs under GitHub Actions (guarded
 * by `process.env.GITHUB_ACTION`, matching `run-all.mts`). Locally the script
 * runs every discovered spec (or the spec filters passed as positional
 * arguments) in a single Playwright invocation.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_BY_BROWSER = {
  chrome: 'chrome-e2e',
  firefox: 'firefox-e2e',
} as const;

type Browser = keyof typeof PROJECT_BY_BROWSER;

/**
 * Runs a single Playwright invocation for the given specs. When `outputFile` is
 * provided it's exported as `PLAYWRIGHT_JUNIT_OUTPUT_FILE`; the mocha-compatible
 * reporter treats it as a base name and writes one XML file per spec
 * (`<base>-<specHash>.xml`) so re-run merging stays correct.
 *
 * @param options - Invocation options.
 * @param options.specs - Repo-relative spec paths to run.
 * @param options.project - Playwright project name (`chrome-e2e` / `firefox-e2e`).
 * @param options.extraArgs - Additional Playwright CLI args.
 * @param options.outputFile - JUnit output base path for this invocation, if any.
 */
async function runPlaywright({
  specs,
  project,
  extraArgs = [],
  outputFile,
}: {
  specs: string[];
  project: string;
  extraArgs?: string[];
  outputFile?: string;
}): Promise<void> {
  if (specs.length === 0) {
    return;
  }

  if (outputFile) {
    process.env.PLAYWRIGHT_JUNIT_OUTPUT_FILE = outputFile;
  } else {
    delete process.env.PLAYWRIGHT_JUNIT_OUTPUT_FILE;
  }

  const args = [
    'playwright',
    'test',
    `--project=${project}`,
    ...extraArgs,
    ...specs,
  ];

  await runInShell('yarn', args);
}

async function main(): Promise<void> {
  const { argv } = yargs(hideBin(process.argv))
    .usage(
      '$0 [specs..]',
      'Run migrated Playwright (*.pw.spec.ts) E2E tests with CI splitting and the e2e quality gate.',
      (_yargs) =>
        _yargs
          .option('browser', {
            description: `Set the browser used; either 'chrome' or 'firefox'.`,
            type: 'string',
            choices: ['chrome', 'firefox'] as const,
            demandOption: true,
          })
          .option('retries', {
            description:
              'Playwright retries for normal (non-quality-gate) specs.',
            type: 'number',
          })
          .positional('specs', {
            description:
              'Optional spec path filters. When provided, only these run (local use).',
            type: 'string',
            array: true,
          }),
    )
    .strict()
    .help('help');

  const { browser, retries, specs } = argv as unknown as {
    browser: Browser;
    retries?: number;
    specs?: string[];
  };

  const project = PROJECT_BY_BROWSER[browser];
  // Keep the timing-split + JUnit defaults aligned with the rest of the e2e
  // tooling, which keys off SELENIUM_BROWSER.
  process.env.SELENIUM_BROWSER = browser;
  if (browser === 'firefox') {
    process.env.PLAYWRIGHT_BROWSER = 'firefox';
  }

  const fullTestList = await getTestPathsForTestDir(
    path.join(__dirname, 'tests'),
    { playwright: true },
  );

  await fs.promises.mkdir('test/test-results/e2e', { recursive: true });

  const normalArgs = retries === undefined ? [] : [`--retries=${retries}`];

  // Local invocation (or explicit spec filters): one Playwright run, no split.
  // Spec filters are forwarded verbatim — Playwright matches them as path
  // substrings, so both full paths and bare filenames work.
  if (!process.env.GITHUB_ACTION) {
    const specsToRun = specs && specs.length > 0 ? specs : fullTestList;
    await runPlaywright({ specs: specsToRun, project, extraArgs: normalArgs });
    return;
  }

  const { myTestList, changedOrNewTests } = await runningOnGitHubActions(
    fullTestList,
    { playwrightOnly: true },
  );

  if (myTestList.length === 0) {
    console.log('No tests to run, exiting successfully.');
    return;
  }

  const matrixIndex = parseInt(process.env.MATRIX_INDEX || '0', 10);
  const shardLabel = `${browser}-${matrixIndex + 1}`;
  const changedSet = new Set(changedOrNewTests);

  // The chunk can contain the same changed spec more than once (the splitter
  // distributes extra quality-gate copies across shards). Playwright treats
  // repeated file arguments as one filter, so duplicates are translated into
  // `--repeat-each` below instead of being passed through.
  const normalSpecs = [
    ...new Set(myTestList.filter((spec) => spec && !changedSet.has(spec))),
  ];

  // Count how many copies of each changed spec landed in this shard's chunk.
  const qualityGateOccurrences = new Map<string, number>();
  for (const spec of myTestList) {
    if (spec && changedSet.has(spec)) {
      qualityGateOccurrences.set(
        spec,
        (qualityGateOccurrences.get(spec) ?? 0) + 1,
      );
    }
  }

  console.log('My test list (normal):', normalSpecs);
  console.log('My test list (quality gate):', [
    ...qualityGateOccurrences.keys(),
  ]);

  // Normal specs: standard run with config/CLI retries (flaky tolerance).
  await runPlaywright({
    specs: normalSpecs,
    project,
    extraArgs: normalArgs,
    outputFile: `test/test-results/e2e/junit-pw-${shardLabel}.xml`,
  });

  // Quality gate: mirror the Selenium runner, where each chunk copy of a
  // changed spec runs up to `retries + 1` times and stops at the first failure
  // (`--stop-after-one-failure`). Here that becomes `--repeat-each = copies *
  // (retries + 1)` with `--retries=0` (no retry masking) and `--max-failures=1`
  // (fail fast). `--repeat-each` applies to the whole invocation, so specs are
  // grouped by their run count.
  const runsPerOccurrence = (retries ?? 0) + 1;
  const specsByRunCount = new Map<number, string[]>();
  for (const [spec, occurrences] of qualityGateOccurrences) {
    const runCount = occurrences * runsPerOccurrence;
    const group = specsByRunCount.get(runCount) ?? [];
    group.push(spec);
    specsByRunCount.set(runCount, group);
  }

  for (const [runCount, qualityGateSpecs] of specsByRunCount) {
    await runPlaywright({
      specs: qualityGateSpecs,
      project,
      extraArgs: [
        `--repeat-each=${runCount}`,
        '--retries=0',
        '--max-failures=1',
      ],
      outputFile: `test/test-results/e2e/junit-pw-${shardLabel}-qg.xml`,
    });
  }
}

main().catch((error) => {
  exitWithError(error);
});
