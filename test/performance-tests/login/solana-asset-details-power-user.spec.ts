import { generateWalletState } from '../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../app/scripts/fixtures/with-networks';
import { WITH_STATE_POWER_USER } from '../../e2e/benchmarks/constants';
import { withFixtures } from '../../e2e/helpers';
import AssetListPage from '../../e2e/page-objects/pages/home/asset-list';
import HomePage from '../../e2e/page-objects/pages/home/homepage';
import { Driver } from '../../e2e/webdriver/driver';
import {
  setupPerformanceReporting,
  performanceTracker,
  TimerHelper,
} from '../utils/testSetup';
import LoginPage from '../../e2e/page-objects/pages/login-page';

const SOL_TOKEN_ADDRESS = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';

describe('Power user persona', function () {
  setupPerformanceReporting();

  it('Check Solana asset details page load time', async function () {
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
        const timerAssetDetails = new TimerHelper(
          'Time since the user clicks on the asset until the price chart is shown',
          { chrome: 5000, firefox: 6000 },
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

        // Measure: Click on Solana asset and wait for chart
        await assetListPage.clickOnAsset('Solana');
        await timerAssetDetails.measure(async () => {
          await assetListPage.checkPriceChartIsShown();
          await assetListPage.checkPriceChartLoaded(SOL_TOKEN_ADDRESS);
        });
        performanceTracker.addTimer(timerAssetDetails);
      },
    );
  });
});
