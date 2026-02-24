/**
 * Benchmark: Extended Idle Soak
 * Loads home page, then idles for 30s measuring intermediate checkpoints.
 * On baseline, MetaMetrics context cascade (#39310) fires continuously on
 * background state updates even when idle. With the fix, memoized context
 * prevents cascade re-renders during idle.
 *
 * Measures responsiveness at 5s, 15s, and 30s by timing account menu open.
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

export const testTitle = 'benchmark-extended-idle-soak';
export const persona = BENCHMARK_PERSONA.POWER_USER;

async function measureAccountMenuResponse(
  driver: Driver,
  headerNavbar: HeaderNavbar,
  label: string,
): Promise<void> {
  const timer = new TimerHelper(label);
  await timer.measure(async () => {
    await headerNavbar.openAccountMenu();
    const accountListPage = new AccountListPage(driver);
    await accountListPage.checkNumberOfAvailableAccounts(
      WITH_STATE_POWER_USER.withAccounts,
    );
  });
  performanceTracker.addTimer(timer);

  await driver.clickElement('[data-testid="popover-close"]');
  await driver.delay(500);
}

async function runExtendedIdleSoakBenchmark(): Promise<BenchmarkRunResult> {
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
        extendedTimeoutMultiplier: 5,
        testSpecificMock: getTestSpecificMock(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await assetListPage.checkTokenListIsDisplayed();

        // Checkpoint at 5s idle
        await driver.delay(5000);
        await measureAccountMenuResponse(
          driver,
          headerNavbar,
          'accountMenuAfter5sIdle',
        );

        // Checkpoint at 15s idle (10s more)
        await driver.delay(10000);
        await measureAccountMenuResponse(
          driver,
          headerNavbar,
          'accountMenuAfter15sIdle',
        );

        // Checkpoint at 30s idle (15s more)
        await driver.delay(15000);
        await measureAccountMenuResponse(
          driver,
          headerNavbar,
          'accountMenuAfter30sIdle',
        );

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

export const run = runExtendedIdleSoakBenchmark;
