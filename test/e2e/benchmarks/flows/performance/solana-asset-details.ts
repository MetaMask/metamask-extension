/**
 * Benchmark: Solana asset details page load for power user
 * Measures time to load price chart for SOL token
 */

import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import Timers from '../../../../timers/Timers';
import { withFixtures } from '../../../helpers';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import LoginPage from '../../../page-objects/pages/login-page';
import { Driver } from '../../../webdriver/driver';
import { collectTimerResults, WITH_STATE_POWER_USER } from '../../utils';
import type { BenchmarkRunResult } from '../../utils/types';

const SOL_TOKEN_ADDRESS = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';

export async function runSolanaAssetDetailsBenchmark(): Promise<BenchmarkRunResult> {
  Timers.resetTimers();

  try {
    await withFixtures(
      {
        title: 'benchmark-solana-asset-details-power-user',
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
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenListIsDisplayed();
        await assetListPage.checkConversionRateDisplayed();

        // Timer: Time since user clicks on the asset until the price chart is shown
        const timer = Timers.createTimer('solana_asset_click_to_price_chart');
        await assetListPage.clickOnAsset('Solana');
        timer.startTimer();
        await assetListPage.checkPriceChartIsShown();
        await assetListPage.checkPriceChartLoaded(SOL_TOKEN_ADDRESS);
        timer.stopTimer();
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

export const run = runSolanaAssetDetailsBenchmark;
