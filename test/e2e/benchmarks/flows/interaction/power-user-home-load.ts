/**
 * Benchmark: Power User Home Page Load (interaction style)
 * Measures login-to-home-loaded time with power user state (30 accounts, etc.)
 * Uses runUserActionBenchmark for fresh browser per iteration (avoids reload issues).
 */

import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
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

export const testTitle = 'benchmark-power-user-home-load';
export const persona = BENCHMARK_PERSONA.POWER_USER;

async function runPowerUserHomeLoadBenchmark(): Promise<BenchmarkRunResult> {
  try {
    let webVitals;

    await withFixtures(
      {
        title: testTitle,
        fixtures: (
          await generateWalletState(WITH_STATE_POWER_USER, true)
        ).build(),
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
        const timerLogin = new TimerHelper('loginToHomeLoaded');
        const timerAccountMenu = new TimerHelper('openAccountMenuToListLoaded');

        // Measure: Login to home page fully loaded
        await timerLogin.measure(async () => {
          await loginWithoutBalanceValidation(driver);
          const assetListPage = new AssetListPage(driver);
          await assetListPage.checkTokenListIsDisplayed();
        });
        performanceTracker.addTimer(timerLogin);

        // 2s soak to let background state settle
        await driver.delay(2000);

        // Measure: Open account menu with 30 accounts
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        await timerAccountMenu.measure(async () => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkNumberOfAvailableAccounts(
            WITH_STATE_POWER_USER.withAccounts,
          );
          await accountListPage.checkAccountDisplayedInAccountList(
            `Account ${WITH_STATE_POWER_USER.withAccounts}`,
          );
        });
        performanceTracker.addTimer(timerAccountMenu);

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

export const run = runPowerUserHomeLoadBenchmark;
