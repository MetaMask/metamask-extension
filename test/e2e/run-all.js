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

function chunk(array, chunkSize) {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
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
          .option('snaps', {
            description: `run snaps e2e tests`,
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

  const { browser, retries, snaps } = argv;

  let testDir = path.join(__dirname, 'tests');

  if (snaps) {
    testDir = path.join(__dirname, 'snaps');
  }

  let testPaths = await getTestPathsForTestDir(testDir);

  if (!snaps) {
    testPaths = [
      ...testPaths,
      ...(await getTestPathsForTestDir(path.join(__dirname, 'swaps'))),
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

  // For running E2Es in parallel in CI
  const currentChunkIndex = process.env.CIRCLE_NODE_INDEX ?? 0;
  const totalChunks = process.env.CIRCLE_NODE_TOTAL ?? 1;
  const chunkSize = Math.ceil(testPaths.length / totalChunks);
  const chunks = chunk(testPaths, chunkSize);
  const currentChunk = chunks[currentChunkIndex];

  for (const testPath of currentChunk) {
    await runInShell('node', [...args, testPath]);
  }
}

main().catch((error) => {
  exitWithError(error);
});
