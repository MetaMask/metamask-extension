const { promises: fs } = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { runInShell } = require('../../development/lib/run-command');
const { exitWithError } = require('../../development/lib/exit-with-error');
const { retry } = require('../../development/lib/retry');

async function main() {
  const { argv } = yargs(hideBin(process.argv))
    .usage(
      '$0 [options] <e2e-test-path>',
      'Run a single E2E test, with a variable number of retries.',
      (_yargs) =>
        _yargs
          .option('browser', {
            default: process.env.SELENIUM_BROWSER,
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
          .option('retries', {
            default: 0,
            description:
              'Set how many times the test should be retried upon failure.',
            type: 'number',
          })
          .option('leave-running', {
            default: false,
            description:
              'Leaves the browser running after a test fails, along with anything else that the test used (ganache, the test dapp, etc.)',
            type: 'boolean',
          })
          .positional('e2e-test-path', {
            describe: 'The path for the E2E test to run.',
            type: 'string',
            normalize: true,
          }),
    )
    .strict()
    .help('help');

  const { browser, debug, e2eTestPath, retries, leaveRunning } = argv;

  if (!browser) {
    exitWithError(
      `"The browser must be set, via the '--browser' flag or the SELENIUM_BROWSER environment variable`,
    );
    return;
  } else if (browser !== process.env.SELENIUM_BROWSER) {
    process.env.SELENIUM_BROWSER = browser;
  }

  try {
    const stat = await fs.stat(e2eTestPath);
    if (!stat.isFile()) {
      exitWithError('Test path must be a file');
      return;
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      exitWithError('Test path specified does not exist');
      return;
    } else if (error.code === 'EACCES') {
      exitWithError(
        'Access to test path is forbidden by file access permissions',
      );
      return;
    }
    throw error;
  }

  if (debug) {
    process.env.E2E_DEBUG = 'true';
  }

  let testTimeoutInMilliseconds = 80 * 1000;
  let exit = '--exit';

  if (leaveRunning) {
    process.env.E2E_LEAVE_RUNNING = 'true';
    testTimeoutInMilliseconds = 0;
    exit = '--no-exit';
  }

  const configFile = path.join(__dirname, '.mocharc.js');

  await retry({ retries }, async () => {
    await runInShell('yarn', [
      'mocha',
      `--config=${configFile}`,
      '--timeout',
      testTimeoutInMilliseconds,
      e2eTestPath,
      exit,
    ]);
  });
}

main().catch((error) => {
  exitWithError(error);
});
