import { promises as fs } from 'fs';
import get from 'lodash/get';
import path from 'path';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { exitWithError } from '../../development/lib/exit-with-error';
import { retry } from '../../development/lib/retry';
import { getFirstParentDirectoryThatExists, isWritable } from '../helpers/file';
import FixtureBuilder from './fixture-builder';
import { unlockWallet, withFixtures } from './helpers';
import { PAGES } from './webdriver/driver';
import { calculateStandardDeviation } from '../utils/benchmark-math-utils';

const DEFAULT_NUM_BROWSER_LOADS = 10;
const DEFAULT_NUM_PAGE_LOADS = 10;
const ALL_PAGES = Object.values(PAGES);

const ALL_TRACES = {
  uiStartup: 'UI Startup',
  load: 'navigation[0].load',
  domContentLoaded: 'navigation[0].domContentLoaded',
  domInteractive: 'navigation[0].domInteractive',
  firstPaint: 'paint["first-paint"]',
  backgroundConnect: 'Background Connect',
  firstReactRender: 'First Render',
  getState: 'Get State',
  initialActions: 'Initial Actions',
  loadScripts: 'Load Scripts',
  setupStore: 'Setup Store',
};

async function measurePage(pageName, pageLoads) {
  let metrics = [];
  await withFixtures(
    {
      fixtures: new FixtureBuilder().build(),
      disableServerMochaToBackground: true,
      title: 'benchmark-pageload',
    },
    async ({ driver }) => {
      await unlockWallet(driver);

      for (let i = 0; i < pageLoads; i++) {
        await driver.navigate(pageName);
        await driver.delay(1000);

        metrics.push(await driver.collectMetrics());
      }
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
const calculateMean = (array) => calculateSum(array) / array.length;
const minResult = calculateResult((array) => Math.min(...array));
const maxResult = calculateResult((array) => Math.max(...array));
const meanResult = calculateResult((array) => calculateMean(array));
const standardDeviationResult = calculateResult((array) => calculateStandardDeviation(array));

// Calculate the pth percentile of an array
function pResult(array, p) {
  return calculateResult((array) => {
    const index = Math.floor((p / 100.0) * array.length);
    return array[index];
  })(array);
}

async function profilePageLoad(pages, browserLoads, pageLoads, retries) {
  const results = {};
  for (const pageName of pages) {
    let runResults = [];
    for (let i = 0; i < browserLoads; i += 1) {
      let result;
      await retry({ retries }, async () => {
        result = await measurePage(pageName, pageLoads);
      });
      runResults = runResults.concat(result);
    }

    if (runResults.some((result) => result.navigation.length > 1)) {
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

    console.info(JSON.stringify(runResults, null, 2));

    const result = {};

    for (const [key, path] of Object.entries(ALL_TRACES)) {
      // Using lodash get to support nested properties like 'navigation[0].load'
      result[key] = runResults
        .map((metrics) => get(metrics, path))
        .sort((a, b) => a - b); // Sort the array as numbers, not strings
    }

    results[pageName] = {
      mean: meanResult(result),
      min: minResult(result),
      max: maxResult(result),
      stdDev: standardDeviationResult(result),
      p75: pResult(result, 75),
      p95: pResult(result, 95),
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
        .option('browserLoads', {
          default: DEFAULT_NUM_BROWSER_LOADS,
          description:
            'The number of times the browser should be fully reloaded to run the benchmark.',
          type: 'number',
        })
        .option('pageLoads', {
          default: DEFAULT_NUM_PAGE_LOADS,
          description:
            'The number of times the page should be loaded per browser load.',
          type: 'number',
        })
        .option('out', {
          description:
            'Output filename. Output printed to STDOUT if this is omitted.',
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

  const { pages, browserLoads, pageLoads, out, retries } = argv;

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

  const results = await profilePageLoad(
    pages,
    browserLoads,
    pageLoads,
    retries,
  );

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
