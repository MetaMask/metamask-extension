import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { extractTestResults } from '../../.github/scripts/extract-test-results.mts';
import {
  formatTime,
  normalizeTestPath,
} from '../../.github/scripts/shared/utils.mts';
import { splitTestsByTimings } from '../../.github/scripts/split-tests-by-timings.mts';
import { exitWithError } from '../../development/lib/exit-with-error.js';
import { runInShell } from '../../development/lib/run-command.js';
import {
  readChangedAndFilterE2eChangedFiles,
  shouldE2eQualityGateBeSkipped,
} from './changedFilesUtil.js';

/**
 * Playwright counterpart of `run-all.mts`. It applies the same CI behaviors to
 * migrated `*.pw.spec.ts` specs that the Selenium runner applies to `*.spec.ts`:
 *
 * - time-based splitting across the GitHub Actions matrix (`splitTestsByTimings`,
 *   fed by the same `test-runs-<browser>.json` timing artifact),
 * - the e2e quality gate (new/changed specs run extra times and fail fast),
 * - re-run-only-failed on attempt > 1.
 *
 * Unlike the Selenium runner — which spawns `run-e2e-test.js` (Mocha) per file —
 * this delegates execution to the Playwright runner, mapping each behavior onto a
 * native Playwright flag:
 *
 * - normal specs → a single `playwright test <files>` invocation (config retries
 *   apply),
 * - changed/new specs → `playwright test <files> --repeat-each=N --retries=0
 *   --max-failures=1` (run multiple times, no retry masking, stop on first
 *   failure) — the quality-gate equivalent of Mocha's `--stop-after-one-failure`.
 *
 * Splitting/quality-gate/re-run logic only runs under GitHub Actions (guarded by
 * `process.env.GITHUB_ACTION`, matching `run-all.mts`). Locally the script runs
 * every discovered spec (or the spec filters passed as positional arguments) in a
 * single Playwright invocation.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Run each new/changed spec this many times in the quality gate. Mirrors
// `RETRIES_FOR_NEW_OR_CHANGED_TESTS` in `split-tests-by-timings.mts`.
const QUALITY_GATE_REPEAT_EACH = 3;

const PROJECT_BY_BROWSER = {
  chrome: 'chrome-e2e',
  firefox: 'firefox-e2e',
} as const;

type Browser = keyof typeof PROJECT_BY_BROWSER;

/**
 * Recursively collects `*.pw.spec.ts` files under the given directory.
 *
 * @param testDir - Absolute path to the directory to scan.
 * @returns Normalized, repo-relative spec paths.
 */
async function getPlaywrightTestPaths(testDir: string): Promise<string[]> {
  const entries = await fs.promises.readdir(testDir, { withFileTypes: true });
  const testPaths: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(testDir, entry.name);
    if (entry.isDirectory()) {
      testPaths.push(...(await getPlaywrightTestPaths(fullPath)));
    } else if (fullPath.endsWith('.pw.spec.ts')) {
      testPaths.push(normalizeTestPath(fullPath));
    }
  }

  return testPaths;
}

/**
 * Computes the spec list this matrix job should run, applying the quality gate
 * and (on re-run) the failed-only filter. Mirrors `runningOnGitHubActions` in
 * `run-all.mts`.
 *
 * @param fullTestList - All discovered Playwright specs.
 * @returns The specs to run plus the changed/new specs (for quality-gate flags).
 */
async function resolveTestListForGitHubActions(
  fullTestList: string[],
): Promise<{ myTestList: string[]; changedOrNewTests: string[] }> {
  let changedOrNewTests: string[] = [];
  if (!shouldE2eQualityGateBeSkipped()) {
    changedOrNewTests = readChangedAndFilterE2eChangedFiles({
      playwrightOnly: true,
    });
  }

  console.log('Changed or new test list:', changedOrNewTests);
  console.log('Full test list:', fullTestList);

  const matrixIndex = parseInt(process.env.MATRIX_INDEX || '0', 10);
  const matrixTotal = parseInt(process.env.MATRIX_TOTAL || '1', 10);
  const runAttempt = parseInt(process.env.RUN_ATTEMPT || '1', 10);
  const previousResultsPath = process.env.PREVIOUS_RESULTS_PATH;

  console.log(
    `GitHub Actions matrix: index ${matrixIndex} of ${matrixTotal} total jobs (attempt ${runAttempt})`,
  );

  // Playwright applies the quality gate with `--repeat-each`, so changed specs
  // must not also be duplicated by the timing splitter. Otherwise every shard
  // can receive the same changed specs and run the full quality gate.
  const chunks = splitTestsByTimings(fullTestList, [], matrixTotal);

  console.log(
    `Expected chunk run time: ${formatTime(chunks[matrixIndex].time)}`,
  );

  const myOriginalTestList = chunks[matrixIndex].paths.filter(Boolean);

  if (runAttempt > 1 && previousResultsPath) {
    console.log(
      `Re-run detected (attempt ${runAttempt}), checking for failed tests to re-run...`,
    );

    const { passed, failed, executed } =
      await extractTestResults(previousResultsPath);

    if (executed.length === 0) {
      console.log(
        'No test results found from previous run, running all tests in chunk.',
      );
      return { myTestList: myOriginalTestList, changedOrNewTests };
    }

    // Re-run tests that failed OR were never executed; skip only confirmed passes.
    const testsToRerun = myOriginalTestList.filter(
      (testPath) => !passed.includes(testPath),
    );
    const failedInChunk = testsToRerun.filter((t) => failed.includes(t)).length;
    const notExecutedInChunk = testsToRerun.length - failedInChunk;

    console.log(
      `Previous run results: ${passed.length} passed, ${failed.length} failed`,
    );
    console.log(
      `This chunk: ${failedInChunk} failed, ${notExecutedInChunk} not executed`,
    );

    if (testsToRerun.length > 0) {
      console.log(`Re-running ${testsToRerun.length} tests:`, testsToRerun);
      return { myTestList: testsToRerun, changedOrNewTests };
    }

    console.log('All tests in this chunk passed, skipping.');
    return { myTestList: [], changedOrNewTests };
  }

  return { myTestList: myOriginalTestList, changedOrNewTests };
}

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

  const fullTestList = await getPlaywrightTestPaths(
    path.join(__dirname, 'tests'),
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

  const { myTestList, changedOrNewTests } =
    await resolveTestListForGitHubActions(fullTestList);

  if (myTestList.length === 0) {
    console.log('No tests to run, exiting successfully.');
    return;
  }

  const matrixIndex = parseInt(process.env.MATRIX_INDEX || '0', 10);
  const shardLabel = `${browser}-${matrixIndex + 1}`;
  const changedSet = new Set(changedOrNewTests);
  const normalSpecs = myTestList.filter((spec) => !changedSet.has(spec));
  const qualityGateSpecs = myTestList.filter((spec) => changedSet.has(spec));

  console.log('My test list (normal):', normalSpecs);
  console.log('My test list (quality gate):', qualityGateSpecs);

  // Normal specs: standard run with config/CLI retries (flaky tolerance).
  await runPlaywright({
    specs: normalSpecs,
    project,
    extraArgs: normalArgs,
    outputFile: `test/test-results/e2e/junit-pw-${shardLabel}.xml`,
  });

  // Quality gate: new/changed specs run multiple times, no retry masking, and
  // fail fast — the Playwright equivalent of `--stop-after-one-failure`.
  await runPlaywright({
    specs: qualityGateSpecs,
    project,
    extraArgs: [
      `--repeat-each=${QUALITY_GATE_REPEAT_EACH}`,
      '--retries=0',
      '--max-failures=1',
    ],
    outputFile: `test/test-results/e2e/junit-pw-${shardLabel}-qg.xml`,
  });
}

main().catch((error) => {
  exitWithError(error);
});
