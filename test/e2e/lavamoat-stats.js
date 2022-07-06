#!/usr/bin/env node

/* eslint-disable node/shebang */
const path = require('path');
const { promises: fs, constants: fsConstants } = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const ttest = require('ttest');
const { exitWithError } = require('../../development/lib/exit-with-error');
const { withFixtures, tinyDelayMs } = require('./helpers');

async function measurePage() {
  let metrics;
  try {
    await withFixtures({ fixtures: 'imported-account' }, async ({ driver }) => {
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

      console.log('Metrics: ', metrics);
    });
  } catch (error) {
    // do nothing
  }

  console.log('52');
  return metrics;
}

function calculateResult(calc) {
  return (result) => {
    const calculatedResult = {};
    for (const key of Object.keys(result)) {
      calculatedResult[key] = calc(result[key]);
    }
    return calculatedResult;
  };
}
// const calculateSum = (array) => array.reduce((sum, val) => sum + val);
// const calculateAverage = (array) => calculateSum(array) / array.length;
// const minResult = calculateResult((array) => Math.min(...array));
// const maxResult = calculateResult((array) => Math.max(...array));
// const averageResult = calculateResult((array) => calculateAverage(array));
// const standardDeviationResult = calculateResult((array) => {
//   if (array.length === 1) {
//     return 0;
//   }
//   const average = calculateAverage(array);
//   const squareDiffs = array.map((value) => Math.pow(value - average, 2));
//   return Math.sqrt(calculateAverage(squareDiffs));
// });
// // 95% margin of error calculated using Student's t-distribution
// const calculateMarginOfError = (array) =>
//   ttest(array).confidence()[1] - calculateAverage(array);
// const marginOfErrorResult = calculateResult((array) =>
//   array.length === 1 ? 0 : calculateMarginOfError(array),
// );

async function profilePageLoad() {
  const results = await measurePage();
  const metrics = {};

  // metrics['background.js'] = {
  //   min: minResult(results[0]),
  //   max: maxResult(results[0]),
  //   average: averageResult(results[0]),
  //   standardDeviation: standardDeviationResult(results[0]),
  //   marginOfError: marginOfErrorResult(results[0]),
  // };

  // metrics['ui.js'] = {
  //   min: minResult(results[1]),
  //   max: maxResult(results[1]),
  //   average: averageResult(results[1]),
  //   standardDeviation: standardDeviationResult(results[1]),
  //   marginOfError: marginOfErrorResult(results[1]),
  // };

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
    await fs.writeFile(out, JSON.stringify(results, null, 2));
  } else {
    console.log(JSON.stringify(results, null, 2));
  }
}

main().catch((error) => {
  exitWithError(error);
});
