/**
 * Benchmark: Asset details page load for power user (USDC on Ethereum)
 * Measures time to load price chart for USDC token
 */

import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import Timers from '../../../../timers/Timers';
import { withFixtures } from '../../../helpers';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import LoginPage from '../../../page-objects/pages/login-page';
import NetworkManager from '../../../page-objects/pages/network-manager';
import { Driver } from '../../../webdriver/driver';
import { collectTimerResults, WITH_STATE_POWER_USER } from '../../utils';
import type { BenchmarkRunResult } from '../../utils/types';

const USDC_TOKEN_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

export async function runAssetDetailsBenchmark(): Promise<BenchmarkRunResult> {
  // Reset timers at start of each benchmark run
  Timers.resetTimers();

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

        // Verify power user accounts are loaded correctly
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkNumberOfAvailableAccounts(
          WITH_STATE_POWER_USER.withAccounts,
        );
        await accountListPage.checkAccountDisplayedInAccountList(
          `Account ${WITH_STATE_POWER_USER.withAccounts}`,
        );
        // Close account menu using the back button
        await accountListPage.closeMultichainAccountsPage();

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
        const timer = Timers.createTimer('asset_click_to_price_chart');
        await assetListPage.clickOnAsset('USDC');
        timer.startTimer();
        await assetListPage.checkPriceChartIsShown();
        await assetListPage.checkPriceChartLoaded(USDC_TOKEN_ADDRESS);
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

export const run = runAssetDetailsBenchmark;
