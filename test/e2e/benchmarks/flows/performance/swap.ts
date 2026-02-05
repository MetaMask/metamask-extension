/**
 * Benchmark: Swap flow performance
 * Measures time for swap flow including quote fetching
 */

import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import { withFixtures } from '../../../helpers';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import LoginPage from '../../../page-objects/pages/login-page';
import SwapPage from '../../../page-objects/pages/swap/swap-page';
import { Driver } from '../../../webdriver/driver';
import { performanceTracker } from '../../utils/performance-tracker';
import TimerHelper, { collectTimerResults } from '../../utils/timer-helper';
import { WITH_STATE_POWER_USER } from '../../utils';
import type { BenchmarkRunResult } from '../../utils/types';

export const testTitle = 'benchmark-swap-power-user';
export const persona = 'powerUser';

export async function runSwapBenchmark(): Promise<BenchmarkRunResult> {
  try {
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
        useMockingPassThrough: true,
        disableServerMochaToBackground: true,
        extendedTimeoutMultiplier: 3,
      },
      async ({ driver }: { driver: Driver }) => {
        const timerOpenSwapPage = new TimerHelper('openSwapPageFromHome');
        const timerQuoteFetching = new TimerHelper('fetchAndDisplaySwapQuotes');

        // Login flow
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenListIsDisplayed();
        await assetListPage.waitForTokenToBeDisplayed('Ethereum');
        await assetListPage.waitForTokenToBeDisplayed('Solana', 60000);

        // Measure: Open swap page
        await homePage.startSwapFlow();
        await timerOpenSwapPage.measure(async () => {
          const swapPage = new SwapPage(driver);
          await swapPage.checkPageIsLoaded();
          await swapPage.waitForMaxButtonToBeDisplayed();
        });
        performanceTracker.addTimer(timerOpenSwapPage);

        // Measure: Fetch quotes
        const swapPage = new SwapPage(driver);
        await swapPage.enterSwapAmount('1');
        await timerQuoteFetching.measure(async () => {
          await swapPage.checkQuoteIsDisplayed();
        });
        performanceTracker.addTimer(timerQuoteFetching);
      },
    );

    return { timers: collectTimerResults(), success: true };
  } catch (error) {
    return {
      timers: collectTimerResults(),
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export const run = runSwapBenchmark;
