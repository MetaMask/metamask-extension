/**
 * Benchmark: Solana asset details page load for power user
 * Measures time to load price chart for SOL token
 */

import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import { withFixtures } from '../../../helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
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
} from '../../utils';
import type { BenchmarkRunResult } from '../../utils/types';

const SOL_TOKEN_ADDRESS = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';

export const testTitle = 'benchmark-solana-asset-details-power-user';
export const persona = BENCHMARK_PERSONA.POWER_USER;

export async function runSolanaAssetDetailsBenchmark(): Promise<BenchmarkRunResult> {
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
        useMockingPassThrough: !shouldUseMockedRequests(),
        disableServerMochaToBackground: true,
        extendedTimeoutMultiplier: 3,
        testSpecificMock: getTestSpecificMock(),
      },
      async ({ driver }: { driver: Driver }) => {
        const timer = new TimerHelper('assetClickToPriceChart');

        // Login flow
        await loginWithoutBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenListIsDisplayed();

        // Measure: Asset click to price chart loaded
        await timer.measure(async () => {
          await assetListPage.clickOnAsset('Solana');
          await assetListPage.checkPriceChartIsShown();
          await assetListPage.checkPriceChartLoaded(SOL_TOKEN_ADDRESS);
        });
        performanceTracker.addTimer(timer);
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

export const run = runSolanaAssetDetailsBenchmark;
