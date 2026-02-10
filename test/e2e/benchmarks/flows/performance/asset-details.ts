/**
 * Benchmark: Asset details page load for power user (Eth on Ethereum)
 * Measures time to load price chart for Eth token
 */

import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { withFixtures } from '../../../helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../../page-objects/flows/network.flow';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import { Driver } from '../../../webdriver/driver';
import { performanceTracker } from '../../utils/performance-tracker';
import TimerHelper, { collectTimerResults } from '../../utils/timer-helper';
import { BENCHMARK_PERSONA, WITH_STATE_POWER_USER } from '../../utils';
import { BENCHMARK_TYPE } from '../../utils/constants';
import type { BenchmarkRunResult } from '../../utils/types';

const ETH_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';
export const testTitle = 'benchmark-asset-details-power-user';
export const persona = BENCHMARK_PERSONA.POWER_USER;

export async function runAssetDetailsBenchmark(): Promise<BenchmarkRunResult> {
  try {
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
        useMockingPassThrough: true,
        disableServerMochaToBackground: true,
        extendedTimeoutMultiplier: 3,
      },
      async ({ driver }: { driver: Driver }) => {
        const timer = new TimerHelper('assetClickToPriceChart');

        // Login flow
        await loginWithoutBalanceValidation(driver);

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

        // Switch to Ethereum Mainnet network
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Ethereum');

        // Wait for token list to update after network switch
        // Power user state has ETH + ERC20 tokens on Ethereum
        await assetListPage.checkTokenListIsDisplayed();

        await assetListPage.clickOnAsset('Ethereum');
        // Measure: Asset click to price chart loaded
        await timer.measure(async () => {
          await assetListPage.checkPriceChartIsShown();
          await assetListPage.checkPriceChartLoaded(ETH_TOKEN_ADDRESS);
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

export const run = runAssetDetailsBenchmark;
