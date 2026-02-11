/**
 * Benchmark: Swap flow performance
 * Measures time for swap flow including quote fetching
 */

import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import { withFixtures } from '../../../helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import SwapPage from '../../../page-objects/pages/swap/swap-page';
import { Driver } from '../../../webdriver/driver';
import { performanceTracker } from '../../utils/performance-tracker';
import TimerHelper, { collectTimerResults } from '../../utils/timer-helper';
import {
  getTestSpecificMock,
  shouldUseMockedRequests,
} from '../../utils/mock-config';
import { BENCHMARK_PERSONA, WITH_STATE_POWER_USER } from '../../utils';
import { BENCHMARK_TYPE } from '../../utils/constants';
import type { BenchmarkRunResult } from '../../utils/types';

export const testTitle = 'benchmark-swap-power-user';
export const persona = BENCHMARK_PERSONA.POWER_USER;

export async function runSwapBenchmark(): Promise<BenchmarkRunResult> {
  try {
    await withFixtures(
      {
        title: testTitle,
        fixtures: (await generateWalletState(WITH_STATE_POWER_USER, true))
          .withEnabledNetworks(ALL_POPULAR_NETWORKS)
          .build(),
        manifestFlags: {
          remoteFeatureFlags: {
            bridgeConfig: {
              refreshRate: 30000,
              maxRefreshCount: 5,
              support: true,
              sse: {
                enabled: true,
                minimumVersion: '13.2.0',
              },
              chains: {
                '1': { isActiveSrc: true, isActiveDest: true },
                '10': { isActiveSrc: true, isActiveDest: true },
                '137': { isActiveSrc: true, isActiveDest: true },
                '42161': { isActiveSrc: true, isActiveDest: true },
                '8453': { isActiveSrc: true, isActiveDest: true },
                '59144': { isActiveSrc: true, isActiveDest: true },
                '1151111081099710': {
                  isActiveSrc: true,
                  isActiveDest: true,
                },
              },
            },
          },
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
        const timerOpenSwapPage = new TimerHelper('openSwapPageFromHome');
        const timerQuoteFetching = new TimerHelper('fetchAndDisplaySwapQuotes');

        // Login flow
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenListIsDisplayed();
        await assetListPage.waitForTokenToBeDisplayed('Ethereum');
        await assetListPage.waitForTokenToBeDisplayed('Solana', 60000);
        // Wait for Solana balance to load before starting the swap flow
        // In mocked mode, balance is 50 SOL; in real server mode skip this wait
        if (shouldUseMockedRequests()) {
          await assetListPage.checkTokenAmountIsDisplayed('50 SOL');
        }

        // Measure: Open swap page
        await homePage.startSwapFlow();
        await timerOpenSwapPage.measure(async () => {
          const swapPage = new SwapPage(driver);
          await swapPage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerOpenSwapPage);
        // Measure: Fetch quotes (longer timeout in CI where quote fetching can be slow)
        const swapPage = new SwapPage(driver);
        await swapPage.createSolanaSwap({
          amount: 1,
          swapTo: 'USDC',
          swapFrom: 'SOL',
        });

        await timerQuoteFetching.measure(async () => {
          await swapPage.checkQuoteIsDisplayed({ timeout: 60000 });
        });
        performanceTracker.addTimer(timerQuoteFetching);
      },
    );

    return {
      timers: collectTimerResults(),
      success: true,
      benchmarkType: BENCHMARK_TYPE.PERFORMANCE,
    };
  } catch (error) {
    return {
      timers: collectTimerResults(),
      success: false,
      error: error instanceof Error ? error.message : String(error),
      benchmarkType: BENCHMARK_TYPE.PERFORMANCE,
    };
  }
}

export const run = runSwapBenchmark;
