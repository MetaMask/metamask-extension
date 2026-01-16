/**
 * Benchmark: Power User Home Page Load
 * Measures home page load time with power user state (30 accounts, transactions, etc.)
 */

import { capitalize } from 'lodash';
import get from 'lodash/get';
import { Mockttp } from 'mockttp';
import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { retry } from '../../../../../development/lib/retry';
import { withFixtures } from '../../../helpers';
import { unlockWallet } from '../../../helpers';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import { mockNotificationServices } from '../../../tests/notifications/mocks';
import type { BenchmarkResults, Metrics, StatisticalResult } from '../../utils/types';
import {
  ALL_METRICS,
  DEFAULT_NUM_BROWSER_LOADS,
  DEFAULT_NUM_PAGE_LOADS,
  WITH_STATE_POWER_USER,
} from '../../utils/constants';
import {
  calculateMean,
  calculateStdDev,
  calculatePercentile,
} from '../../utils/statistics';

async function measurePagePowerUser(
  pageName: string,
  pageLoads: number,
): Promise<{ metrics: Metrics[]; title: string; persona: string }> {
  const metrics: Metrics[] = [];
  const title = 'measurePagePowerUser';
  const persona = 'powerUser';
  await withFixtures(
    {
      title,
      fixtures: (await generateWalletState(WITH_STATE_POWER_USER, true)).build(),
      manifestFlags: {
        testing: {
          disableSync: true,
          infuraProjectId: process.env.INFURA_PROJECT_ID,
        },
      },
      useMockingPassThrough: true,
      disableServerMochaToBackground: true,
      extendedTimeoutMultiplier: 3,
      testSpecificMock: async (server: Mockttp) => {
        await mockNotificationServices(server);
      },
    },
    async ({ driver, getNetworkReport, clearNetworkReport }) => {
      await unlockWallet(driver);

      for (let i = 0; i < pageLoads; i++) {
        clearNetworkReport();
        await driver.navigate(pageName);

        // Confirm the number of accounts in the account list
        await new HeaderNavbar(driver).openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkNumberOfAvailableAccounts(
          WITH_STATE_POWER_USER.withAccounts,
        );
        await accountListPage.checkAccountDisplayedInAccountList(
          `Account ${WITH_STATE_POWER_USER.withAccounts}`,
        );

        await driver.delay(1000);

        try {
          const metricsThisLoad = await driver.collectMetrics();
          metricsThisLoad.numNetworkReqs = getNetworkReport().numNetworkReqs;
          metrics.push(metricsThisLoad);
        } catch (error) {
          console.error(`Error collecting metrics for ${pageName}:`, error);
        }
      }
    },
  );
  return { metrics, title, persona };
}

// Helper to apply a calculation across all metrics
function calculateResult(calc: (array: number[]) => number) {
  return (result: Record<string, number[]>): StatisticalResult => {
    const calculatedResult: StatisticalResult = {};
    for (const key of Object.keys(result)) {
      if (result[key].length > 0) {
        calculatedResult[key] = calc(result[key]);
      }
    }
    return calculatedResult;
  };
}

const minResult = calculateResult((array: number[]) => Math.min(...array));
const maxResult = calculateResult((array: number[]) => Math.max(...array));
const meanResult = calculateResult((array: number[]) => calculateMean(array));
const stdDevResult = calculateResult((array: number[]) => calculateStdDev(array));

function pResult(array: Record<string, number[]>, p: number): StatisticalResult {
  return calculateResult((arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b);
    return calculatePercentile(sorted, p);
  })(array);
}

export async function run(options: {
  browserLoads?: number;
  pageLoads?: number;
  retries?: number;
}): Promise<Record<string, BenchmarkResults>> {
  const {
    browserLoads = DEFAULT_NUM_BROWSER_LOADS,
    pageLoads = DEFAULT_NUM_PAGE_LOADS,
    retries = 0,
  } = options;

  const results: Record<string, BenchmarkResults> = {};
  const pageName = 'home';
  let runResults: Metrics[] = [];
  let testTitle = '';
  let resultPersona = '';

  for (let i = 0; i < browserLoads; i += 1) {
    console.log('Starting browser load', i + 1, 'of', browserLoads);
    const { metrics, title, persona } = await retry({ retries }, () =>
      measurePagePowerUser(pageName, pageLoads),
    );
    runResults = runResults.concat(metrics);
    testTitle = title;
    resultPersona = persona;
  }

  if (runResults.some((result) => result.navigation.length > 1)) {
    throw new Error(`Multiple navigations not supported`);
  }

  const result: Record<string, number[]> = {};
  for (const [key, tracePath] of Object.entries(ALL_METRICS)) {
    result[key] = runResults
      .map((m) => get(m, tracePath) as number)
      .sort((a, b) => a - b);
  }

  const reportingPageName = `${resultPersona}${capitalize(pageName)}`;
  results[reportingPageName] = {
    testTitle,
    persona: resultPersona,
    mean: meanResult(result),
    min: minResult(result),
    max: maxResult(result),
    stdDev: stdDevResult(result),
    p75: pResult(result, 75),
    p95: pResult(result, 95),
  };

  return results;
}
