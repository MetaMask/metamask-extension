const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { runInShell } = require('../../development/lib/run-command');
const { exitWithError } = require('../../development/lib/exit-with-error');
const { loadBuildTypesConfig } = require('../../development/lib/build-type');
const { filterE2eChangedFiles } = require('./changedFilesUtil');

// These tests should only be run on Flask for now.
const FLASK_ONLY_TESTS = [];

const getTestPathsForTestDir = async (testDir) => {
  const testFilenames = await fs.promises.readdir(testDir, {
    withFileTypes: true,
  });
  const testPaths = [];

  for (const itemInDirectory of testFilenames) {
    const fullPath = path.join(testDir, itemInDirectory.name);

    if (itemInDirectory.isDirectory()) {
      const subDirPaths = await getTestPathsForTestDir(fullPath);
      testPaths.push(...subDirPaths);
    } else if (fullPath.endsWith('.spec.js') || fullPath.endsWith('.spec.ts')) {
      testPaths.push(fullPath);
    }
  }

  return testPaths;
};

// Quality Gate Retries
const RETRIES_FOR_NEW_OR_CHANGED_TESTS = 4;

/**
 * Runs the quality gate logic to filter and append changed or new tests if present.
 *
 * @param {string} fullTestList - List of test paths to be considered.
 * @param {string[]} changedOrNewTests - List of changed or new test paths.
 * @returns {string} The updated full test list.
 */
function applyQualityGate(fullTestList, changedOrNewTests) {
  let qualityGatedList = fullTestList;

  if (changedOrNewTests.length > 0) {
    // Filter to include only the paths present in fullTestList
    const filteredTests = changedOrNewTests.filter((test) =>
      fullTestList.includes(test),
    );

    // If there are any filtered tests, append them to fullTestList
    if (filteredTests.length > 0) {
      const filteredTestsString = filteredTests.join('\n');
      for (let i = 0; i < RETRIES_FOR_NEW_OR_CHANGED_TESTS; i++) {
        qualityGatedList += `\n${filteredTestsString}`;
      }
    }
  }

  return qualityGatedList;
}

// For running E2Es in parallel in CI
function runningOnCircleCI(testPaths) {
  const changedOrNewTests = filterE2eChangedFiles();
  console.log('Changed or new test list:', changedOrNewTests);

  const fullTestList = applyQualityGate(
    testPaths.join('\n'),
    changedOrNewTests,
  );

  console.log('Full test list:', fullTestList);
  fs.writeFileSync('test/test-results/fullTestList.txt', fullTestList);

  // Use `circleci tests run` on `testList.txt` to do two things:
  // 1. split the test files into chunks based on how long they take to run
  // 2. support "Rerun failed tests" on CircleCI
  const result = execSync(
    'circleci tests run --command=">test/test-results/myTestList.txt xargs echo" --split-by=timings --timings-type=filename --time-default=30s < test/test-results/fullTestList.txt',
  ).toString('utf8');

  // Report if no tests found, exit gracefully
  if (result.indexOf('There were no tests found') !== -1) {
    console.log(`run-all.js info: Skipping this node because "${result}"`);
    return { fullTestList: [] };
  }

  // If there's no text file, it means this node has no tests, so exit gracefully
  if (!fs.existsSync('test/test-results/myTestList.txt')) {
    console.log(
      'run-all.js info: Skipping this node because there is no myTestList.txt',
    );
    return { fullTestList: [] };
  }

  // take the space-delimited result and split into an array
  const myTestList = fs
    .readFileSync('test/test-results/myTestList.txt', { encoding: 'utf8' })
    .split(' ');

  return { fullTestList: myTestList, changedOrNewTests };
}

async function main() {
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
          .option('mmi', {
            description: `Run only mmi related tests`,
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
    mmi,
    rpc,
    buildType,
    updateSnapshot,
    updatePrivacySnapshot,
    multiProvider,
  } = argv;

  let testPaths;

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
  } else if (buildType === 'mmi') {
    const testDir = path.join(__dirname, 'tests');
    testPaths = [...(await getTestPathsForTestDir(testDir))];
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

  const args = [runE2eTestPath];
  if (browser) {
    args.push('--browser', browser);
  }
  if (retries) {
    args.push('--retries', retries);
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
  if (mmi) {
    args.push('--mmi');
  }

  await fs.promises.mkdir('test/test-results/e2e', { recursive: true });

  let myTestList;
  let changedOrNewTests;
  if (process.env.CIRCLECI) {
    ({ fullTestList: myTestList, changedOrNewTests = [] } =
      runningOnCircleCI(testPaths));
  } else {
    myTestList = testPaths;
  }

  console.log('My test list:', myTestList);

  // spawn `run-e2e-test.js` for each test in myTestList
  for (let testPath of myTestList) {
    if (testPath !== '') {
      testPath = testPath.replace('\n', ''); // sometimes there's a newline at the end of the testPath
      console.log(`\nExecuting testPath: ${testPath}\n`);

      const isTestChangedOrNew = changedOrNewTests?.includes(testPath);
      const qualityGateArg = isTestChangedOrNew
        ? ['--stop-after-one-failure']
        : [];
      await runInShell('node', [...args, ...qualityGateArg, testPath]);
    }
  }
}

main().catch((error) => {
  exitWithError(error);
});
