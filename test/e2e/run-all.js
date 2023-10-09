const path = require('path');
const { promises: fs } = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { runInShell } = require('../../development/lib/run-command');
const { exitWithError } = require('../../development/lib/exit-with-error');
const { loadBuildTypesConfig } = require('../../development/lib/build-type');

const getTestPathsForTestDir = async (testDir) => {
  const testFilenames = await fs.readdir(testDir, { withFileTypes: true });
  const testPaths = [];

  for (const itemInDirectory of testFilenames) {
    const fullPath = path.join(testDir, itemInDirectory.name);

    if (itemInDirectory.isDirectory()) {
      const subDirPaths = await getTestPathsForTestDir(fullPath);
      testPaths.push(...subDirPaths);
    } else if (fullPath.endsWith('.spec.js')) {
      testPaths.push(fullPath);
    }
  }

  return testPaths;
};

// Heavily inspired by: https://stackoverflow.com/a/51514813
// Splits the array into totalChunks chunks with a decent spread of items in each chunk
function chunk(array, totalChunks) {
  const copyArray = [...array];
  const result = [];
  for (let chunkIndex = totalChunks; chunkIndex > 0; chunkIndex--) {
    result.push(copyArray.splice(0, Math.ceil(copyArray.length / chunkIndex)));
  }
  return result;
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
          .option('snaps', {
            description: `run snaps e2e tests`,
            type: 'boolean',
          })
          .option('mv3', {
            description: `run mv3 specific e2e tests`,
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
    snaps,
    mv3,
    rpc,
    buildType,
    updateSnapshot,
    updatePrivacySnapshot,
  } = argv;

  let testPaths;

  if (snaps) {
    testPaths = [
      ...(await getTestPathsForTestDir(path.join(__dirname, 'snaps'))),
      ...(await getTestPathsForTestDir(path.join(__dirname, 'accounts'))),
      ...(await getTestPathsForTestDir(path.join(__dirname, 'flask'))),
    ];
  } else if (rpc) {
    const testDir = path.join(__dirname, 'json-rpc');
    testPaths = await getTestPathsForTestDir(testDir);
  } else {
    const testDir = path.join(__dirname, 'tests');
    testPaths = [
      ...(await getTestPathsForTestDir(testDir)),
      ...(await getTestPathsForTestDir(path.join(__dirname, 'swaps'))),
      ...(await getTestPathsForTestDir(path.join(__dirname, 'nft'))),
      ...(await getTestPathsForTestDir(path.join(__dirname, 'metrics'))),
      path.join(__dirname, 'metamask-ui.spec.js'),
    ];

    if (mv3) {
      testPaths.push(
        ...(await getTestPathsForTestDir(path.join(__dirname, 'mv3'))),
      );
    }
  }

  // These tests should only be run on Flask for now.
  if (buildType !== 'flask') {
    const filteredTests = [
      'settings-add-snap-account-toggle.spec.js',
      'test-snap-accounts.spec.js',
      'test-create-snap-account.spec.js',
      'test-remove-accounts-snap.spec.js',
      'test-snap-lifecycle.spec.js',
      'test-snap-get-locale.spec.js',
      'ppom-blockaid-alert.spec.js',
      'ppom-toggle-settings.spec.js',
      'petnames.spec.js',
    ];
    testPaths = testPaths.filter((p) =>
      filteredTests.every((filteredTest) => !p.endsWith(filteredTest)),
    );
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

  // For running E2Es in parallel in CI
  const currentChunkIndex = process.env.CIRCLE_NODE_INDEX ?? 0;
  const totalChunks = process.env.CIRCLE_NODE_TOTAL ?? 1;
  const chunks = chunk(testPaths, totalChunks);
  const currentChunk = chunks[currentChunkIndex];

  for (const testPath of currentChunk) {
    const dir = 'test/test-results/e2e';
    fs.mkdir(dir, { recursive: true });
    await runInShell('node', [...args, testPath]);
  }
}

main().catch((error) => {
  exitWithError(error);
});
