/**
 * Benchmark: Power User Home Page Load
 * Measures home page load time with power user state (30 accounts, transactions, etc.)
 */

import { Mockttp } from 'mockttp';
import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { withFixtures } from '../../../helpers';
import { login } from '../../../page-objects/flows/login.flow';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import { mockNotificationServices } from '../../../tests/notifications/mocks';
import {
  BENCHMARK_PERSONA,
  type BenchmarkResults,
  type WebVitalsMetrics,
} from '../../../../../shared/constants/benchmarks';
import {
  WITH_STATE_POWER_USER,
  POWER_USER_NUM_BROWSER_LOADS,
} from '../../utils/constants';
import { runPageLoadBenchmark, collectWebVitals } from '../../utils';
import type {
  Metrics,
  PageLoadBenchmarkOptions,
  MeasurePageResult,
} from '../../utils/types';

async function measurePagePowerUser(
  pageName: string,
  pageLoads: number,
): Promise<MeasurePageResult> {
  const metrics: Metrics[] = [];
  const webVitalsRuns: WebVitalsMetrics[] = [];
  const title = 'measurePagePowerUser';
  const persona = BENCHMARK_PERSONA.POWER_USER;
  await withFixtures(
    {
      title,
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
      extendedTimeoutMultiplier: 3,
      testSpecificMock: async (server: Mockttp) => {
        await mockNotificationServices(server);
      },
    },
    async ({ driver, getNetworkReport, clearNetworkReport }) => {
      await login(driver, { validateBalance: false });

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

        const metricsThisLoad = await driver.collectMetrics();
        metricsThisLoad.numNetworkReqs = getNetworkReport().numNetworkReqs;
        metrics.push(metricsThisLoad);

        try {
          webVitalsRuns.push(await collectWebVitals(driver));
        } catch (error) {
          console.error(`Error collecting web vitals for ${pageName}:`, error);
        }
      }
    },
  );
  return { metrics, title, persona, webVitalsRuns };
}

export async function run(
  options: PageLoadBenchmarkOptions,
): Promise<BenchmarkResults> {
  return runPageLoadBenchmark(measurePagePowerUser, {
    ...options,
    browserLoads: options.browserLoads ?? POWER_USER_NUM_BROWSER_LOADS,
  });
}
