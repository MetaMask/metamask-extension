const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { runInShell } = require('../../development/lib/run-command');
const { exitWithError } = require('../../development/lib/exit-with-error');
const { loadBuildTypesConfig } = require('../../development/lib/build-type');

// These tests should only be run on Flask for now.
const FLASK_ONLY_TESTS = [
  'petnames.spec.js',
  'test-snap-txinsights-v2.spec.js',
];

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

// For running E2Es in parallel in CI
function runningOnCircleCI(testPaths) {
  const fullTestList = testPaths.join('\n');
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
    return [];
  }

  // If there's no text file, it means this node has no tests, so exit gracefully
  if (!fs.existsSync('test/test-results/myTestList.txt')) {
    console.log(
      'run-all.js info: Skipping this node because there is no myTestList.txt',
    );
    return [];
  }

  // take the space-delimited result and split into an array
  return fs
    .readFileSync('test/test-results/myTestList.txt', { encoding: 'utf8' })
    .split(' ');
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
            default: process.env.E2E_DEBUG === 'true',
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
  } else if (buildType === 'mmi') {
    const testDir = path.join(__dirname, 'tests');
    testPaths = [
      ...(await getTestPathsForTestDir(testDir)),
      path.join(__dirname, 'metamask-ui.spec.js'),
    ];
  } else {
    const testDir = path.join(__dirname, 'tests');
    const filteredFlaskAndMainTests = featureTestsOnMain.filter((p) =>
      FLASK_ONLY_TESTS.every((filteredTest) => !p.endsWith(filteredTest)),
    );
    testPaths = [
      ...(await getTestPathsForTestDir(testDir)),
      ...filteredFlaskAndMainTests,
      path.join(__dirname, 'metamask-ui.spec.js'),
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
  if (debug) {
    args.push('--debug');
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
  if (process.env.CIRCLECI) {
    myTestList = runningOnCircleCI(testPaths);
  } else {
    myTestList = testPaths;
  }

  console.log('My test list:', myTestList);

  // spawn `run-e2e-test.js` for each test in myTestList
  for (let testPath of myTestList) {
    if (testPath !== '') {
      testPath = testPath.replace('\n', ''); // sometimes there's a newline at the end of the testPath
      console.log(`\nExecuting testPath: ${testPath}\n`);
      await runInShell('node', [...args, testPath]);
    }
  }
}

main().catch((error) => {
  exitWithError(error);
});
