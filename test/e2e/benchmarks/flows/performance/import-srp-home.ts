/**
 * Benchmark: Import SRP from home interface
 * Measures time to import an existing wallet from the home page
 */

import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import { withFixtures } from '../../../helpers';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import LoginPage from '../../../page-objects/pages/login-page';
import { Driver } from '../../../webdriver/driver';
import TimerHelper from '../../utils/TimerHelper';
import Timers from '../../utils/Timers';
import { collectTimerResults } from '../../utils/timer-utils';
import { WITH_STATE_POWER_USER } from '../../utils';
import type { BenchmarkRunResult } from '../../utils/types';

const SECOND_SRP = process.env.TEST_SRP_2 || '';

export const testTitle = 'benchmark-import-srp-home-power-user';
export const persona = 'powerUser';

export async function runImportSrpHomeBenchmark(): Promise<BenchmarkRunResult> {
  Timers.resetTimers();

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
        // Timer: Login flow
        const timerLogin = new TimerHelper('loginToHomePage', 10000);
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await timerLogin.measure(async () => {
          await loginPage.loginToHomepage();
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
        });

        // Timer: Open account menu
        const timerOpenAccountMenu = new TimerHelper('openAccountMenuAfterLogin', 3000);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        await timerOpenAccountMenu.measure(async () => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkPageIsLoaded();
        });

        // Timer: Import SRP and return to home
        const timerHomeAfterImport = new TimerHelper(
          'importWalletToHomeScreen',
          30000,
        );
        const accountListPage = new AccountListPage(driver);
        await accountListPage.startImportSecretPhrase(SECOND_SRP);
        await timerHomeAfterImport.measure(async () => {
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          const assetListPage = new AssetListPage(driver);
          await assetListPage.checkTokenListIsDisplayed();
          await assetListPage.checkConversionRateDisplayed();
          await assetListPage.checkTokenExistsInList('Ethereum');
          await assetListPage.waitForTokenToBeDisplayed('Solana', 60000);
        });
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

export const run = runImportSrpHomeBenchmark;
