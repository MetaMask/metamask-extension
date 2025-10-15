import { promises as fs } from 'fs';
import path from 'path';
import { capitalize } from 'lodash';
import get from 'lodash/get';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { generateWalletState } from '../../../app/scripts/fixtures/generate-wallet-state';
import { exitWithError } from '../../../development/lib/exit-with-error';
import { retry } from '../../../development/lib/retry';
import {
  getFirstParentDirectoryThatExists,
  isWritable,
} from '../../helpers/file';
import FixtureBuilder from '../fixture-builder';
import { unlockWallet, withFixtures } from '../helpers';
import AccountListPage from '../page-objects/pages/account-list-page';
import HeaderNavbar from '../page-objects/pages/header-navbar';
import { PAGES } from '../webdriver/driver';
import {
  BenchmarkArguments,
  BenchmarkResults,
  Metrics,
  StatisticalResult,
} from './types-generated';
import {
  ALL_TRACES,
  DEFAULT_NUM_BROWSER_LOADS,
  DEFAULT_NUM_PAGE_LOADS,
  WITH_STATE_POWER_USER,
} from './constants';

const ALL_PAGES = Object.values(PAGES);

async function measurePage(
  pageName: string,
  pageLoads: number,
): Promise<Metrics[]> {
  const metrics: Metrics[] = [];
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

async function measurePagePowerUser(
  pageName: string,
  pageLoads: number,
): Promise<Metrics[]> {
  const metrics: Metrics[] = [];
  await withFixtures(
    {
      title: 'measurePagePowerUser',
      fixtures: (
        await generateWalletState(WITH_STATE_POWER_USER, true)
      ).build(),
      manifestFlags: {
        testing: {
          disableSync: true,
          infuraProjectId: process.env.INFURA_PROJECT_ID,
        },
      },
      useMockingPassThrough: true,
      disableServerMochaToBackground: true,
    },

    async ({ driver }) => {
      await unlockWallet(driver);

      for (let i = 0; i < pageLoads; i++) {
        await driver.navigate(pageName);

        // Confirm the number of accounts in the account list
        new HeaderNavbar(driver).openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkNumberOfAvailableAccounts(
          WITH_STATE_POWER_USER.withAccounts,
        );

        // Confirm that the last account is displayed in the account list
        await accountListPage.checkAccountDisplayedInAccountList(
          `Account ${WITH_STATE_POWER_USER.withAccounts}`,
        );

        await driver.delay(1000);

        try {
          metrics.push(await driver.collectMetrics());
        } catch (error) {
          // This often errors in chrome-webpack-powerUser
          console.error(`Error collecting metrics for ${pageName}:`, error);
        }
      }
    },
  );
  return metrics;
}

function calculateResult(calc: (array: number[]) => number) {
  return (result: Record<string, number[]>): StatisticalResult => {
    const calculatedResult: StatisticalResult = {};
    for (const key of Object.keys(result)) {
      calculatedResult[key] = calc(result[key]);
    }
    return calculatedResult;
  };
}

const calculateSum = (array: number[]): number =>
  array.reduce((sum, val) => sum + val);
const calculateMean = (array: number[]): number =>
  calculateSum(array) / array.length;
const minResult = calculateResult((array: number[]) => Math.min(...array));
const maxResult = calculateResult((array: number[]) => Math.max(...array));
const meanResult = calculateResult((array: number[]) => calculateMean(array));
const standardDeviationResult = calculateResult((array: number[]) => {
  if (array.length === 1) {
    return 0;
  }
  const average = calculateMean(array);
  const squareDiffs = array.map((value) => Math.pow(value - average, 2));
  return Math.sqrt(calculateMean(squareDiffs));
});

// Calculate the pth percentile of an array
function pResult(
  array: Record<string, number[]>,
  p: number,
): StatisticalResult {
  return calculateResult((arr: number[]) => {
    const index = Math.floor((p / 100.0) * arr.length);
    return arr[index];
  })(array);
}

async function profilePageLoad(
  pages: string[],
  browserLoads: number,
  pageLoads: number,
  retries: number,
  isPowerUser: boolean,
): Promise<Record<string, BenchmarkResults>> {
  const results: Record<string, BenchmarkResults> = {};
  for (const pageName of pages) {
    let runResults: Metrics[] = [];

    for (let i = 0; i < browserLoads; i += 1) {
      const result = await retry({ retries }, () =>
        isPowerUser
          ? measurePagePowerUser(pageName, pageLoads)
          : measurePage(pageName, pageLoads),
      );
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
            ?.navigation[0].type
        } not supported`,
      );
    }

    console.info(JSON.stringify(runResults, null, 2));

    const result: Record<string, number[]> = {};

    for (const [key, tracePath] of Object.entries(ALL_TRACES)) {
      // Using lodash get to support nested properties like 'navigation[0].load'
      result[key] = runResults
        .map((metrics) => get(metrics, tracePath) as number)
        .sort((a, b) => a - b); // Sort the array as numbers, not strings
    }

    const reportingPageName = isPowerUser
      ? `powerUser${capitalize(pageName)}`
      : `standard${capitalize(pageName)}`;

    results[reportingPageName] = {
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

async function main(): Promise<void> {
  const { argv } = yargs(hideBin(process.argv)).usage(
    '$0 [options]',
    'Run a page load benchmark',
    (_yargs) =>
      _yargs
        .option('pages', {
          array: true,
          default: [PAGES.HOME],
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
        })
        .option('isPowerUser', {
          default: false,
          description:
            'Whether to run the benchmark as a power user with additional accounts, tokens, and transactions.',
          type: 'boolean',
        }),
  ) as unknown as { argv: BenchmarkArguments };

  const { pages, out, retries, isPowerUser } = argv;
  let { browserLoads, pageLoads } = argv;

  // Reduce the number of loads for webpack powerUser, since it takes longer and fails frequently
  if (isPowerUser && process.env.ARTIFACT_NAME === 'build-test-webpack') {
    browserLoads = 2;
    pageLoads = 2;
  }

  const results = await profilePageLoad(
    pages,
    browserLoads,
    pageLoads,
    retries,
    isPowerUser,
  );

  if (out) {
    const outputDirectory = path.dirname(out);
    const existingParentDirectory =
      await getFirstParentDirectoryThatExists(outputDirectory);
    if (!(await isWritable(existingParentDirectory))) {
      throw new Error('Specified output file directory is not writable');
    }

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
