import { generateWalletState } from '../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../app/scripts/fixtures/with-networks';
import { WITH_STATE_POWER_USER } from '../../e2e/benchmarks/constants';
import { withFixtures } from '../../e2e/helpers';
import HomePage from '../../e2e/page-objects/pages/home/homepage';
import { Driver } from '../../e2e/webdriver/driver';
import {
  setupPerformanceReporting,
  performanceTracker,
  TimerHelper,
} from '../utils/testSetup';
import LoginPage from '../../e2e/page-objects/pages/login-page';
import AssetListPage from '../../e2e/page-objects/pages/home/asset-list';
import SwapPage from '../../e2e/page-objects/pages/swap/swap-page';

describe('Unified Bridge & Swap Performance', function () {
  setupPerformanceReporting();

  it('measures swap flow performance with quote fetching', async function () {
    if (!process.env.INFURA_PROJECT_ID) {
      throw new Error(
        'Running this E2E test requires a valid process.env.INFURA_PROJECT_ID',
      );
    }

    await withFixtures(
      {
        title: this.test?.fullTitle(),
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
        const timerOpenSwapPage = new TimerHelper(
          'Time to open swap page from home',
          { chrome: 5000, firefox: 6000 },
        );
        const timerQuoteFetching = new TimerHelper(
          'Time to fetch and display swap quotes',
          { chrome: 10000, firefox: 12000 },
        );

        // Login flow
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenListIsDisplayed();
        await assetListPage.checkConversionRateDisplayed();
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
  });
});
