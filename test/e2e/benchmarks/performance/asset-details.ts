/**
 * Benchmark: Asset details page load for power user (USDC on Ethereum)
 * Measures time to load price chart for USDC token
 */

import { generateWalletState } from '../../../../app/scripts/fixtures/generate-wallet-state';
import { withFixtures } from '../../helpers';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import NetworkManager from '../../page-objects/pages/network-manager';
import { Driver } from '../../webdriver/driver';
import { WITH_STATE_POWER_USER } from '../utils/constants';
import type { BenchmarkRunResult, TimerResult } from '../utils/types';

const USDC_TOKEN_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

export async function runAssetDetailsBenchmark(): Promise<BenchmarkRunResult> {
  const timers: TimerResult[] = [];

  try {
    await withFixtures(
      {
        title: 'benchmark-asset-details-power-user',
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

        // Filter to Ethereum network
        await assetListPage.openNetworksFilter();
        const networkManager = new NetworkManager(driver);
        await networkManager.selectNetworkByNameWithWait('Ethereum');
        await homePage.checkPageIsLoaded();
        await assetListPage.checkTokenListIsDisplayed();
        await assetListPage.checkConversionRateDisplayed();

        // Timer: Time since user clicks on the asset until the price chart is shown
        await assetListPage.clickOnAsset('USDC');
        const timerStart = Date.now();
        await assetListPage.checkPriceChartIsShown();
        await assetListPage.checkPriceChartLoaded(USDC_TOKEN_ADDRESS);
        timers.push({
          id: 'asset_click_to_price_chart',
          duration: Date.now() - timerStart,
        });
      },
    );

    return { timers, success: true };
  } catch (error) {
    return {
      timers,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
