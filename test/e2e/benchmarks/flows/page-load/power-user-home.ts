/**
 * Benchmark: Power User Home Page Load
 * Measures home page load time with power user state (30 accounts, transactions, etc.)
 */

import { Mockttp } from 'mockttp';
import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { withFixtures } from '../../../helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import { mockNotificationServices } from '../../../tests/notifications/mocks';
import type {
  BenchmarkResults,
  Metrics,
  PageLoadBenchmarkOptions,
} from '../../utils/types';
import {
  BENCHMARK_PERSONA,
  WITH_STATE_POWER_USER,
} from '../../utils/constants';
import { runPageLoadBenchmark, type MeasurePageResult } from '../../utils';

async function measurePagePowerUser(
  pageName: string,
  pageLoads: number,
): Promise<MeasurePageResult> {
  const metrics: Metrics[] = [];
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
      await loginWithoutBalanceValidation(driver);

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

export async function run(
  options: PageLoadBenchmarkOptions,
): Promise<BenchmarkResults> {
  return runPageLoadBenchmark(measurePagePowerUser, options);
}
