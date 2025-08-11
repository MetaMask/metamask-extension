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
            default: process.env.SELENIUM_BROWSER || 'all',
            description: `Set the browser to be used; specify 'chrome', 'firefox', 'all' or leave unset to run on 'all' by default.`,
            type: 'string',
            choices: ['chrome', 'firefox', 'all'],
          })
          .option('debug', {
            default: true,
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
          .option('stop-after-one-failure', {
            default: false,
            description: 'Retries until the test fails',
            type: 'boolean',
          })
          .option('leave-running', {
            default: false,
            description:
              'Leaves the browser running after a test fails, along with anything else that the test used (ganache, the test dapp, etc.)',
            type: 'boolean',
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
          })
          .positional('e2e-test-path', {
            describe: 'The path for the E2E test to run.',
            type: 'string',
            normalize: true,
          }),
    )
    .strict()
    .help('help');

  const {
    browser,
    debug,
    e2eTestPath,
    retries,
    stopAfterOneFailure,
    leaveRunning,
    updateSnapshot,
    updatePrivacySnapshot,
  } = argv;

  const runTestsOnSingleBrowser = async (selectedBrowserForRun) => {
    if (!selectedBrowserForRun) {
      exitWithError(
        `"The browser must be set, via the '--browser' flag or the SELENIUM_BROWSER environment variable`,
      );
      return;
    } else if (selectedBrowserForRun !== process.env.SELENIUM_BROWSER) {
      process.env.SELENIUM_BROWSER = selectedBrowserForRun;
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

    if (updateSnapshot) {
      process.env.UPDATE_SNAPSHOTS = 'true';
    }

    if (updatePrivacySnapshot) {
      process.env.UPDATE_PRIVACY_SNAPSHOT = 'true';
    }

    const configFile = path.join(__dirname, '.mocharc.js');
    const extraArgs = process.env.E2E_ARGS?.split(' ') || [];

    const dir = 'test/test-results/e2e';
    fs.mkdir(dir, { recursive: true });

    await retry({ retries, stopAfterOneFailure }, async () => {
      await runInShell('yarn', [
        'mocha',
        `--config=${configFile}`,
        `--timeout=${testTimeoutInMilliseconds}`,
        '--reporter=mocha-junit-reporter',
        '--reporter-options',
        `mochaFile=test/test-results/e2e/[hash].xml,toConsole=true`,
        ...extraArgs,
        e2eTestPath,
        exit,
      ]);
    });
  };

  const allBrowsers = ['chrome', 'firefox'];
  if (browser === 'all') {
    for (const currentBrowser of allBrowsers) {
      console.log(`Running tests on ${currentBrowser}`);
      try {
        await runTestsOnSingleBrowser(currentBrowser);
      } catch (error) {
        exitWithError(
          `Error occurred while running tests on ${currentBrowser}: ${error}`,
        );
      }
    }
  } else {
    console.log(`Running tests on ${browser}`);
    try {
      await runTestsOnSingleBrowser(browser);
    } catch (error) {
      exitWithError(
        `Error occurred while running tests on ${browser}: ${error}`,
      );
    }
  }

  // In CI we sometimes get to this point without being ready to properly
  // terminate the process. We haven't been able to figure out what is
  // holding up the process. But this is a quick fix to ensure more
  // stable CI going forward.
  // eslint-disable-next-line node/no-process-exit
  process.exit();
}

main().catch((error) => {
  exitWithError(error);
});
