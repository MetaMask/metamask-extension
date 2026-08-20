import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { loadBuildTypesConfig } from '../../development/lib/build-type.js';
import { exitWithError } from '../../development/lib/exit-with-error.js';
import { runInShell } from '../../development/lib/run-command.js';
import {
  getTestPathsForTestDir,
  runningOnGitHubActions,
} from './run-all-shared.mts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// These tests should only be run on Flask for now.
const FLASK_ONLY_TESTS: string[] = [];

// This test should only be run manually or via specific workflow update-onboarding-fixture.yml
const DIST_EXCLUDED_TESTS: string[] = ['wallet-fixture-export.spec.ts'];

// These tests are excluded on RC branches
const RC_EXCLUDED_TESTS: string[] = ['wallet-fixture-validation.spec.ts'];

// These tests are excluded on the stable branch
const STABLE_EXCLUDED_TESTS: string[] = ['wallet-fixture-validation.spec.ts'];

function getBranchName(): string {
  return (
    process.env.BRANCH ||
    process.env.GITHUB_HEAD_REF ||
    process.env.GITHUB_REF_NAME ||
    ''
  );
}

function isReleaseCandidateBranch(): boolean {
  return /^release\/(\d+)[.](\d+)[.](\d+)$/u.test(getBranchName());
}

function isStableBranch(): boolean {
  return getBranchName() === 'stable';
}

async function main(): Promise<void> {
  const { argv } = yargs(hideBin(process.argv))
    .usage(
      '$0 [options]',
      'Run all E2E tests, with a variable number of retries.',
      (_yargs) =>
        _yargs
          .option('browser', {
            description: `Set the browser used; either 'chrome' or 'firefox'.`,
            type: 'string',
            choices: ['chrome', 'firefox'],
          })
          .option('debug', {
            default: true,
            description:
              'Run tests in debug mode, logging each driver interaction',
            type: 'boolean',
          })
          .option('rpc', {
            description: `run json-rpc specific e2e tests`,
            type: 'boolean',
          })
          .option('dist', {
            description: `run e2e tests for production-like builds`,
            type: 'boolean',
          })
          .option('multi-provider', {
            description: `run multi injected provider e2e tests`,
            type: 'boolean',
          })
          .option('performance', {
            description: `run performance e2e tests`,
            type: 'boolean',
          })
          .option('build-type', {
            description: `Sets the build-type to test for. This may filter out tests.`,
            type: 'string',
            choices: Object.keys(loadBuildTypesConfig().buildTypes),
          })
          .option('retries', {
            description:
              'Set how many times the test should be retried upon failure.',
            type: 'number',
          })
          .option('update-snapshot', {
            alias: 'u',
            default: false,
            description: 'Update E2E snapshots',
            type: 'boolean',
          })
          .option('update-privacy-snapshot', {
            default: false,
            description:
              'Update the privacy snapshot to include new hosts and paths',
            type: 'boolean',
          }),
    )
    .strict()
    .help('help');

  const {
    browser,
    debug,
    dist,
    retries,
    rpc,
    buildType,
    updateSnapshot,
    updatePrivacySnapshot,
    multiProvider,
    performance: runPerformanceTests,
  } = argv as {
    browser?: 'chrome' | 'firefox';
    debug?: boolean;
    dist?: boolean;
    retries?: number;
    rpc?: boolean;
    buildType?: string;
    updateSnapshot?: boolean;
    updatePrivacySnapshot?: boolean;
    multiProvider?: boolean;
    performance?: boolean;
  };

  let testPaths: string[];

  // These test paths should be run against both flask and main builds.
  // Eventually we should move all features to this array and test them all
  // on every build type in which they are running to avoid regressions across
  // builds.
  const featureTestsOnMain = [
    ...(await getTestPathsForTestDir(path.join(__dirname, 'accounts'))),
    ...(await getTestPathsForTestDir(path.join(__dirname, 'snaps'))),
  ];

  if (buildType === 'flask') {
    testPaths = [
      ...(await getTestPathsForTestDir(path.join(__dirname, 'flask'))),
      ...featureTestsOnMain,
    ];
  } else if (dist) {
    const testDir = path.join(__dirname, 'dist');
    const allDistTests = await getTestPathsForTestDir(testDir);
    testPaths = allDistTests.filter((p) =>
      DIST_EXCLUDED_TESTS.every(
        (excludedTest) => path.basename(p) !== excludedTest,
      ),
    );
  } else if (rpc) {
    const testDir = path.join(__dirname, 'json-rpc');
    testPaths = await getTestPathsForTestDir(testDir);
  } else if (multiProvider) {
    // Copy dist/ to folder
    fs.cp(
      path.resolve('dist/chrome'),
      path.resolve('dist/chrome2'),
      { recursive: true },
      (err) => {
        if (err) {
          throw err;
        }
      },
    );

    const testDir = path.join(__dirname, 'multi-injected-provider');
    testPaths = await getTestPathsForTestDir(testDir);
  } else if (runPerformanceTests) {
    const testDir = path.join(__dirname, '../performance-tests');
    testPaths = await getTestPathsForTestDir(testDir);
  } else {
    const testDir = path.join(__dirname, 'tests');
    const filteredFlaskAndMainTests = featureTestsOnMain.filter((p) =>
      FLASK_ONLY_TESTS.every((filteredTest) => !p.endsWith(filteredTest)),
    );
    testPaths = [
      ...(await getTestPathsForTestDir(testDir)),
      ...filteredFlaskAndMainTests,
    ];
  }

  if (isReleaseCandidateBranch()) {
    console.log('RC branch detected — excluding tests:', RC_EXCLUDED_TESTS);
    testPaths = testPaths.filter((p) =>
      RC_EXCLUDED_TESTS.every(
        (excludedTest) => path.basename(p) !== excludedTest,
      ),
    );
  }

  if (isStableBranch()) {
    console.log(
      'Stable branch detected — excluding tests:',
      STABLE_EXCLUDED_TESTS,
    );
    testPaths = testPaths.filter((p) =>
      STABLE_EXCLUDED_TESTS.every(
        (excludedTest) => path.basename(p) !== excludedTest,
      ),
    );
  }

  const runE2eTestPath = path.join(__dirname, 'run-e2e-test.js');

  const args: string[] = [runE2eTestPath];
  if (browser) {
    args.push('--browser', browser);
  }
  if (retries) {
    args.push('--retries', retries.toString());
  }
  if (!debug) {
    args.push('--debug=false');
  }
  if (updateSnapshot) {
    args.push('--update-snapshot');
  }
  if (updatePrivacySnapshot) {
    args.push('--update-privacy-snapshot');
  }

  await fs.promises.mkdir('test/test-results/e2e', { recursive: true });

  let myTestList: string[];
  let changedOrNewTests: string[] = [];
  if (process.env.GITHUB_ACTION) {
    ({ myTestList, changedOrNewTests } =
      await runningOnGitHubActions(testPaths));

    // If no tests to run (e.g., all passed in previous attempt), exit early
    if (myTestList.length === 0) {
      console.log('No tests to run, exiting successfully.');
      return;
    }
  } else {
    myTestList = testPaths;
  }
  console.log('My test list:', myTestList);

  // spawn `run-e2e-test.js` for each test in myTestList
  for (let i = 0; i < myTestList.length; i++) {
    const testFile = myTestList[i];
    if (testFile !== '') {
      console.log(
        `\nExecuting testFile (${i + 1} of ${
          myTestList.length
        }): ${testFile}\n`,
      );

      const isTestChangedOrNew = changedOrNewTests.includes(testFile);
      const qualityGateArg = isTestChangedOrNew
        ? ['--stop-after-one-failure']
        : [];
      await runInShell('node', [...args, ...qualityGateArg, testFile]);
    }
  }
}

main().catch((error) => {
  exitWithError(error);
});
