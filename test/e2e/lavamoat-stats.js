#!/usr/bin/env node

/* eslint-disable node/shebang */
const path = require('path');
const { promises: fs, constants: fsConstants } = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { exitWithError } = require('../../development/lib/exit-with-error');
const { withFixtures, tinyDelayMs } = require('./helpers');
const FixtureBuilder = require('./fixture-builder');

async function measurePage() {
  let metrics;
  try {
    await withFixtures(
      { fixtures: new FixtureBuilder().build() },
      async ({ driver }) => {
        await driver.delay(tinyDelayMs);
        await driver.navigate();
        await driver.findElement('#password');
        await driver.delay(1000);
        const logs = await driver.checkBrowserForLavamoatLogs();

        let logString = '';
        let inObject = false;

        const parsedLogs = [];

        logs.forEach((log) => {
          if (log.indexOf('"version": 1') >= 0) {
            logString += log;
            parsedLogs.push(`{${logString}}`);
            logString = '';
            inObject = false;
          } else if (inObject) {
            logString += log;
          } else if (
            log.search(/"name": ".*app\/scripts\/background.js",/u) >= 0 ||
            log.search(/"name": ".*app\/scripts\/ui.js",/u) >= 0
          ) {
            logString += log;
            inObject = true;
          }
        });

        metrics = parsedLogs.map((pl) => JSON.parse(pl));
      },
    );
  } catch (error) {
    // do nothing
  }
  return metrics;
}

async function profilePageLoad() {
  const results = await measurePage();
  const metrics = {};

  metrics['background.js'] = results[0];
  metrics['ui.js'] = results[1];

  return metrics;
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

  const { out } = argv;

  let outputDirectory;
  let existingParentDirectory;
  if (out) {
    outputDirectory = path.dirname(out);
    existingParentDirectory = await getFirstParentDirectoryThatExists(
      outputDirectory,
    );
    if (!(await isWritable(existingParentDirectory))) {
      throw new Error('Specified output file directory is not writable');
    }
  }

  const results = await profilePageLoad();

  if (out) {
    if (outputDirectory !== existingParentDirectory) {
      await fs.mkdir(outputDirectory, { recursive: true });
    }

    await fs.writeFile(
      path.join(out, 'background.json'),
      JSON.stringify(results['background.js'], null, 2),
    );

    await fs.writeFile(
      path.join(out, 'ui.json'),
      JSON.stringify(results['ui.js'], null, 2),
    );
  } else {
    console.log(JSON.stringify(results, null, 2));
  }
}

main().catch((error) => {
  exitWithError(error);
});
