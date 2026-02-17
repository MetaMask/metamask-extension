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

const SECOND_SRP = process.env.TEST_SRP_2;

export const testTitle = 'benchmark-import-srp-home-power-user';
export const persona = BENCHMARK_PERSONA.POWER_USER;

export async function runImportSrpHomeBenchmark(): Promise<BenchmarkRunResult> {
  try {
    // Validate required environment variable
    if (!SECOND_SRP) {
      throw new Error(
        'TEST_SRP_2 environment variable is required for import-srp-home benchmark. ' +
          'Please set TEST_SRP_2 with a valid 12-word seed phrase.',
      );
    }
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
        const timerLogin = new TimerHelper('loginToHomeScreen');
        const timerOpenAccountMenu = new TimerHelper(
          'openAccountMenuAfterLogin',
        );
        const timerHomeAfterImport = new TimerHelper(
          'homeAfterImportWithNewWallet',
        );

        // Measure: Login flow (includes triggering action)
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await timerLogin.measure(async () => {
          await loginPage.loginToHomepage();
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerLogin);

        // Measure: Open account menu
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        await timerOpenAccountMenu.measure(async () => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerOpenAccountMenu);

        // Measure: Import SRP and return to home
        const accountListPage = new AccountListPage(driver);
        await accountListPage.startImportSecretPhrase(SECOND_SRP);
        await timerHomeAfterImport.measure(async () => {
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          const assetListPage = new AssetListPage(driver);
          await assetListPage.checkTokenListIsDisplayed();
          await assetListPage.checkTokenExistsInList('Ethereum');
          await assetListPage.waitForTokenToBeDisplayed('Solana', 60000);
        });
        performanceTracker.addTimer(timerHomeAfterImport);
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

export const run = runImportSrpHomeBenchmark;
