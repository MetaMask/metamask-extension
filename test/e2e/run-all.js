const path = require('path');
const { promises: fs } = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { runInShell } = require('../../development/lib/run-command');
const { exitWithError } = require('../../development/lib/exit-with-error');

const getTestPathsForTestDir = async (testDir) => {
  const testFilenames = await fs.readdir(testDir);
  const testPaths = testFilenames.map((filename) =>
    path.join(testDir, filename),
  );
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
          .option('snaps', {
            description: `run snaps e2e tests`,
            type: 'boolean',
          })
          .option('mv3', {
            description: `run mv3 specific e2e tests`,
            type: 'boolean',
          })
          .option('nft', {
            description: `run nft specific e2e tests`,
            type: 'boolean',
          })
          .option('retries', {
            description:
              'Set how many times the test should be retried upon failure.',
            type: 'number',
          }),
    )
    .strict()
    .help('help');

  const { browser, debug, retries, snaps, mv3, nft } = argv;

  let testPaths;

  if (snaps) {
    const testDir = path.join(__dirname, 'snaps');
    testPaths = await getTestPathsForTestDir(testDir);
  } else if (nft) {
    const testDir = path.join(__dirname, 'nft');
    testPaths = await getTestPathsForTestDir(testDir);
  } else {
    const testDir = path.join(__dirname, 'tests');
    testPaths = [
      ...(await getTestPathsForTestDir(testDir)),
      ...(await getTestPathsForTestDir(path.join(__dirname, 'swaps'))),
      path.join(__dirname, 'metamask-ui.spec.js'),
    ];

    if (mv3) {
      testPaths.push(
        ...(await getTestPathsForTestDir(path.join(__dirname, 'mv3'))),
      );
    }
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

  // For running E2Es in parallel in CI
  const currentChunkIndex = process.env.CIRCLE_NODE_INDEX ?? 0;
  const totalChunks = process.env.CIRCLE_NODE_TOTAL ?? 1;
  const chunks = chunk(testPaths, totalChunks);
  const currentChunk = chunks[currentChunkIndex];

  for (const testPath of currentChunk) {
    await runInShell('node', [...args, testPath]);
  }
}

main().catch((error) => {
  exitWithError(error);
});
