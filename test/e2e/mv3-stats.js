#!/usr/bin/env node

/* eslint-disable node/shebang */
const path = require('path');
const { promises: fs } = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const { exitWithError } = require('../../development/lib/exit-with-error');
const {
  isWritable,
  getFirstParentDirectoryThatExists,
} = require('../helpers/file');
const { withFixtures, tinyDelayMs } = require('./helpers');
const FixtureBuilder = require('./fixture-builder');

/**
 * The e2e test case is used to capture load and initialisation time statistics for extension in MV3 environment.
 */

async function profilePageLoad() {
  const parsedLogs = {};
  try {
    await withFixtures(
      { fixtures: new FixtureBuilder().build() },
      async ({ driver }) => {
        await driver.delay(tinyDelayMs);
        await driver.navigate();
        await driver.delay(1000);
        const logs = await driver.checkBrowserForLavamoatLogs();

        let logString = '';
        let logType = '';

        logs.forEach((log) => {
          if (log.indexOf('"version": 1') >= 0) {
            // log end here
            logString += log;
            parsedLogs[logType] = JSON.parse(`{${logString}}`);
            logString = '';
            logType = '';
          } else if (logType) {
            // log string continues
            logString += log;
          } else if (
            log.search(/"name": ".*app\/scripts\/background.js",/u) >= 0
          ) {
            // background log starts
            logString += log;
            logType = 'background';
          } else if (log.search(/"name": ".*app\/scripts\/ui.js",/u) >= 0) {
            // ui log starts
            logString += log;
            logType = 'ui';
          } else if (log.search(/"name": "Total"/u) >= 0) {
            // load time log starts
            logString += log;
            logType = 'loadTime';
          }
        });
      },
    );
  } catch (error) {
    console.log('Error in trying to parse logs.');
  }
  return parsedLogs;
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

  const logCategories = [
    { key: 'background', dirPath: 'initialisation/background/stacks.json' },
    { key: 'ui', dirPath: 'initialisation/ui/stacks.json' },
    { key: 'loadTime', dirPath: 'load_time/stats.json' },
  ];

  if (out) {
    logCategories.forEach(async ({ key, dirPath }) => {
      if (results[key]) {
        const outPath = `${out}/${dirPath}`;
        const outputDirectory = path.dirname(outPath);
        const existingParentDirectory = await getFirstParentDirectoryThatExists(
          outputDirectory,
        );
        if (!(await isWritable(existingParentDirectory))) {
          throw new Error('Specified output file directory is not writable');
        }
        if (outputDirectory !== existingParentDirectory) {
          await fs.mkdir(outputDirectory, { recursive: true });
        }
        await fs.writeFile(outPath, JSON.stringify(results[key], null, 2));
      }
    });
  } else {
    console.log(JSON.stringify(results, null, 2));
  }
}

main().catch((error) => {
  exitWithError(error);
});
