#!/usr/bin/env node
const path = require('path');
const { promises: fs } = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const ttest = require('ttest');
const { retry } = require('../../development/lib/retry');
const { exitWithError } = require('../../development/lib/exit-with-error');
const {
  isWritable,
  getFirstParentDirectoryThatExists,
} = require('../helpers/file');
const { withFixtures, tinyDelayMs, unlockWallet } = require('./helpers');
const { PAGES } = require('./webdriver/driver');
const FixtureBuilder = require('./fixture-builder');

const DEFAULT_NUM_SAMPLES = 20;
const ALL_PAGES = Object.values(PAGES);

async function measurePage(pageName) {
  let metrics;
  await withFixtures(
    { fixtures: new FixtureBuilder().build() },
    async ({ driver }) => {
      await driver.delay(tinyDelayMs);
      await unlockWallet(driver, {
        waitLoginSuccess: false,
      });
      await driver.findElement('[data-testid="account-menu-icon"]');
      await driver.navigate(pageName);
      await driver.delay(1000);
      metrics = await driver.collectMetrics();
    },
  );
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
const calculateSum = (array) => array.reduce((sum, val) => sum + val);
const calculateAverage = (array) => calculateSum(array) / array.length;
const minResult = calculateResult((array) => Math.min(...array));
const maxResult = calculateResult((array) => Math.max(...array));
const averageResult = calculateResult((array) => calculateAverage(array));
const standardDeviationResult = calculateResult((array) => {
  if (array.length === 1) {
    return 0;
  }
  const average = calculateAverage(array);
  const squareDiffs = array.map((value) => Math.pow(value - average, 2));
  return Math.sqrt(calculateAverage(squareDiffs));
});
// 95% margin of error calculated using Student's t-distribution
const calculateMarginOfError = (array) =>
  ttest(array).confidence()[1] - calculateAverage(array);
const marginOfErrorResult = calculateResult((array) =>
  array.length === 1 ? 0 : calculateMarginOfError(array),
);

async function profilePageLoad(pages, numSamples, retries) {
  const results = {};
  for (const pageName of pages) {
    const runResults = [];
    for (let i = 0; i < numSamples; i += 1) {
      let result;
      await retry({ retries }, async () => {
        result = await measurePage(pageName);
      });
      runResults.push(result);
    }

    if (runResults.some((result) => result.navigation.lenth > 1)) {
      throw new Error(`Multiple navigations not supported`);
    } else if (
      runResults.some((result) => result.navigation[0].type !== 'navigate')
    ) {
      throw new Error(
        `Navigation type ${
          runResults.find((result) => result.navigation[0].type !== 'navigate')
            .navigation[0].type
        } not supported`,
      );
    }

    const result = {
      firstPaint: runResults.map((metrics) => metrics.paint['first-paint']),
      domContentLoaded: runResults.map(
        (metrics) =>
          metrics.navigation[0] && metrics.navigation[0].domContentLoaded,
      ),
      load: runResults.map(
        (metrics) => metrics.navigation[0] && metrics.navigation[0].load,
      ),
      domInteractive: runResults.map(
        (metrics) =>
          metrics.navigation[0] && metrics.navigation[0].domInteractive,
      ),
    };

    results[pageName] = {
      min: minResult(result),
      max: maxResult(result),
      average: averageResult(result),
      standardDeviation: standardDeviationResult(result),
      marginOfError: marginOfErrorResult(result),
    };
  }
  return results;
}

async function main() {
  const { argv } = yargs(hideBin(process.argv)).usage(
    '$0 [options]',
    'Run a page load benchmark',
    (_yargs) =>
      _yargs
        .option('pages', {
          array: true,
          default: ['home'],
          description:
            'Set the page(s) to be benchmarked. This flag can accept multiple values (space-separated).',
          choices: ALL_PAGES,
        })
        .option('samples', {
          default: DEFAULT_NUM_SAMPLES,
          description: 'The number of times the benchmark should be run.',
          type: 'number',
        })
        .option('out', {
          description:
            'Output filename. Output printed to STDOUT of this is omitted.',
          type: 'string',
          normalize: true,
        })
        .option('retries', {
          default: 0,
          description:
            'Set how many times each benchmark sample should be retried upon failure.',
          type: 'number',
        }),
  );

  const { pages, samples, out, retries } = argv;

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

  const results = await profilePageLoad(pages, samples, retries);

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
