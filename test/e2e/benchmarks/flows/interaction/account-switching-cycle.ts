/**
 * Benchmark: Account Switching Cycle
 * Switches between 5 accounts in rapid succession.
 * Each switch updates selectedAccount state, triggering MetaMetrics context
 * cascade (#39310) and approval selector recomputation (#39312) on baseline.
 */

import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import { withFixtures } from '../../../helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import { Driver } from '../../../webdriver/driver';
import { performanceTracker } from '../../utils/performance-tracker';
import TimerHelper, { collectTimerResults } from '../../utils/timer-helper';
import {
  getTestSpecificMock,
  shouldUseMockedRequests,
} from '../../utils/mock-config';
import {
  BENCHMARK_PERSONA,
  BENCHMARK_TYPE,
  WITH_STATE_POWER_USER,
} from '../../utils/constants';
import type { BenchmarkRunResult } from '../../utils/types';
import { collectWebVitals } from '../../utils/web-vitals-collector';

export const testTitle = 'benchmark-account-switching-cycle';
export const persona = BENCHMARK_PERSONA.POWER_USER;

const ACCOUNTS_TO_CYCLE = [
  'Account 5',
  'Account 10',
  'Account 15',
  'Account 20',
  'Account 1',
];

async function runAccountSwitchingCycleBenchmark(): Promise<BenchmarkRunResult> {
  try {
    let webVitals;

    await withFixtures(
      {
        title: testTitle,
        fixtures: (await generateWalletState(WITH_STATE_POWER_USER, true))
          .withEnabledNetworks(ALL_POPULAR_NETWORKS)
          .build(),
        manifestFlags: {
          testing: {
            disableSync: true,
            infuraProjectId: process.env.INFURA_PROJECT_ID,
          },
        },
        useMockingPassThrough: !shouldUseMockedRequests(),
        disableServerMochaToBackground: true,
        extendedTimeoutMultiplier: 3,
        testSpecificMock: getTestSpecificMock(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await assetListPage.checkTokenListIsDisplayed();
        await driver.delay(1000);

        for (let i = 0; i < ACCOUNTS_TO_CYCLE.length; i++) {
          const accountName = ACCOUNTS_TO_CYCLE[i];
          const timer = new TimerHelper(`switchToAccount_${i + 1}`);

          await timer.measure(async () => {
            await headerNavbar.openAccountMenu();
            const accountListPage = new AccountListPage(driver);
            await accountListPage.switchToAccount(accountName);
            await assetListPage.checkTokenListIsDisplayed();
          });
          performanceTracker.addTimer(timer);

          await driver.delay(500);
        }

        webVitals = await collectWebVitals(driver);
      },
    );

    return {
      timers: collectTimerResults(),
      webVitals,
      success: true,
      benchmarkType: BENCHMARK_TYPE.USER_ACTION,
    };
  } catch (error) {
    return {
      timers: collectTimerResults(),
      success: false,
      error: error instanceof Error ? error.message : String(error),
      benchmarkType: BENCHMARK_TYPE.USER_ACTION,
    };
  }
}

export const run = runAccountSwitchingCycleBenchmark;
