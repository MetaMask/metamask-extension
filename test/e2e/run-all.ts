import fs from 'fs';
import path from 'path';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import {
  formatTime,
  normalizeTestPath,
} from '../../.github/scripts/shared/utils';
import { splitTestsByTimings } from '../../.github/scripts/split-tests-by-timings';
import { loadBuildTypesConfig } from '../../development/lib/build-type';
import { exitWithError } from '../../development/lib/exit-with-error';
import { runInShell } from '../../development/lib/run-command';
import {
  readChangedAndFilterE2eChangedFiles,
  shouldE2eQualityGateBeSkipped,
} from './changedFilesUtil';

// These tests should only be run on Flask for now.
const FLASK_ONLY_TESTS: string[] = [];

const getTestPathsForTestDir = async (testDir: string): Promise<string[]> => {
  const testFilenames = await fs.promises.readdir(testDir, {
    withFileTypes: true,
  });
  const testPaths: string[] = [];

  for (const itemInDirectory of testFilenames) {
    const fullPath = path.join(testDir, itemInDirectory.name);

    if (itemInDirectory.isDirectory()) {
      const subDirPaths = await getTestPathsForTestDir(fullPath);
      testPaths.push(...subDirPaths);
    } else if (fullPath.endsWith('.spec.js') || fullPath.endsWith('.spec.ts')) {
      testPaths.push(normalizeTestPath(fullPath));
    }
  }

  return testPaths;
};

// For running E2Es in parallel in GitHub Actions
function runningOnGitHubActions(fullTestList: string[]) {
  let changedOrNewTests: string[] = [];

  if (!shouldE2eQualityGateBeSkipped()) {
    changedOrNewTests = readChangedAndFilterE2eChangedFiles();
  }

  console.log('Changed or new test list:', changedOrNewTests);
  console.log('Full test list:', fullTestList);

  // Determine the test matrix division
  // GitHub Actions uses matrix.index (0-based) and matrix.total values for test splitting
  const matrixIndex = parseInt(process.env.MATRIX_INDEX || '0', 10);
  const matrixTotal = parseInt(process.env.MATRIX_TOTAL || '1', 10);

  console.log(
    `GitHub Actions matrix: index ${matrixIndex} of ${matrixTotal} total jobs`,
  );

  const chunks = splitTestsByTimings(
    fullTestList,
    changedOrNewTests,
    matrixTotal,
  );

  console.log(
    `Expected chunk run time: ${formatTime(chunks[matrixIndex].time)}`,
  );

  const myTestList = chunks[matrixIndex].paths || [];

  return { myTestList, changedOrNewTests };
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
          .option('multi-provider', {
            description: `run multi injected provider e2e tests`,
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
    retries,
    rpc,
    buildType,
    updateSnapshot,
    updatePrivacySnapshot,
    multiProvider,
  } = argv as {
    browser?: 'chrome' | 'firefox';
    debug?: boolean;
    retries?: number;
    rpc?: boolean;
    buildType?: string;
    updateSnapshot?: boolean;
    updatePrivacySnapshot?: boolean;
    multiProvider?: boolean;
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
