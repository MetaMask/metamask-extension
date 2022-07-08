#!/usr/bin/env node

/* eslint-disable node/shebang */
const path = require('path');
const { promises: fs, constants: fsConstants } = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { exitWithError } = require('../../../development/lib/exit-with-error');
const { withFixtures, tinyDelayMs } = require('../helpers');

async function profilePageLoad() {
  const parsedLogs = {};
  try {
    await withFixtures({ fixtures: 'imported-account' }, async ({ driver }) => {
      await driver.delay(tinyDelayMs);
      await driver.navigate();
      // await driver.findElement('#password');
      await driver.delay(1000);
      const logs = await driver.checkBrowserForLavamoatLogs();

      let logString = '';
      let inObject = '';

      logs.forEach((log) => {
        if (log.indexOf('"version": 1') >= 0) {
          logString += log;
          parsedLogs[inObject] = JSON.parse(`{${logString}}`);
          logString = '';
          inObject = '';
        } else if (inObject) {
          logString += log;
        } else if (
          log.search(/"name": ".*app\/scripts\/background.js",/u) >= 0
        ) {
          logString += log;
          inObject = 'background.js';
        } else if (log.search(/"name": ".*app\/scripts\/ui.js",/u) >= 0) {
          logString += log;
          inObject = 'ui.js';
        } else if (log.search(/"name": "Total"/u) >= 0) {
          logString += log;
          inObject = 'loadTime';
        }
      });
    });
  } catch (error) {
    // do nothing
  }
  return parsedLogs;
}

async function isWritable(directory) {
  try {
    await fs.access(directory, fsConstants.W_OK);
    return true;
  } catch (error) {
    if (error.code !== 'EACCES') {
      throw error;
    }
    return false;
  }
}

async function getFirstParentDirectoryThatExists(directory) {
  let nextDirectory = directory;
  for (;;) {
    try {
      await fs.access(nextDirectory, fsConstants.F_OK);
      return nextDirectory;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      } else if (nextDirectory === path.dirname(nextDirectory)) {
        throw new Error('Failed to find parent directory that exists');
      }
      nextDirectory = path.dirname(nextDirectory);
    }
  }
}

async function main() {
  const { argv } = yargs(hideBin(process.argv)).usage(
    '$0 [options]',
    'Run a page load benchmark',
    (_yargs) =>
      _yargs.option('out', {
        description:
          'Output filename. Output printed to STDOUT of this is omitted.',
        type: 'string',
        normalize: true,
      }),
  );

  const results = await profilePageLoad();
  const { out } = argv;

  console.log('results = ', results);

  if (out) {
    if (results['background.js']) {
      const backgroundOutPath = `${out}/initialisation/background/stacks.json`;
      const backgroundOutputDirectory = path.dirname(backgroundOutPath);
      const backgroundExistingParentDirectory = await getFirstParentDirectoryThatExists(
        backgroundOutputDirectory,
      );
      if (!(await isWritable(backgroundExistingParentDirectory))) {
        throw new Error('Specified output file directory is not writable');
      }
      if (backgroundOutputDirectory !== backgroundExistingParentDirectory) {
        await fs.mkdir(backgroundOutputDirectory, { recursive: true });
      }
      await fs.writeFile(
        backgroundOutPath,
        JSON.stringify(results['background.js'], null, 2),
      );
    }
    if (results['ui.js']) {
      const uiOutPath = `${out}/initialisation/ui/stacks.json`;
      const uiOutputDirectory = path.dirname(uiOutPath);
      const uiExistingParentDirectory = await getFirstParentDirectoryThatExists(
        uiOutputDirectory,
      );
      if (!(await isWritable(uiExistingParentDirectory))) {
        throw new Error('Specified output file directory is not writable');
      }
      if (uiOutputDirectory !== uiExistingParentDirectory) {
        await fs.mkdir(uiOutputDirectory, { recursive: true });
      }
      await fs.writeFile(uiOutPath, JSON.stringify(results['ui.js'], null, 2));
    }
    if (results.loadTime) {
      const loadTimeOutPath = `${out}/load_time/stats.json`;
      const loadTimeOutputDirectory = path.dirname(loadTimeOutPath);
      const loadTimeExistingParentDirectory = await getFirstParentDirectoryThatExists(
        loadTimeOutputDirectory,
      );
      if (!(await isWritable(loadTimeExistingParentDirectory))) {
        throw new Error('Specified output file directory is not writable');
      }
      if (loadTimeOutputDirectory !== loadTimeExistingParentDirectory) {
        await fs.mkdir(loadTimeOutputDirectory, { recursive: true });
      }
      await fs.writeFile(
        loadTimeOutPath,
        JSON.stringify(results.loadTime, null, 2),
      );
    }
  } else {
    console.log(JSON.stringify(results, null, 2));
  }
}

main().catch((error) => {
  exitWithError(error);
});
