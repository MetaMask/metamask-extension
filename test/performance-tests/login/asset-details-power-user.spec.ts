import { generateWalletState } from '../../../app/scripts/fixtures/generate-wallet-state';
import { WITH_STATE_POWER_USER } from '../../e2e/benchmarks/constants';
import { withFixtures } from '../../e2e/helpers';
import AssetListPage from '../../e2e/page-objects/pages/home/asset-list';
import HomePage from '../../e2e/page-objects/pages/home/homepage';
import NetworkManager from '../../e2e/page-objects/pages/network-manager';
import { Driver } from '../../e2e/webdriver/driver';
import {
  setupPerformanceReporting,
  performanceTracker,
  TimerHelper,
} from '../utils/testSetup';
import LoginPage from '../../e2e/page-objects/pages/login-page';

const USDC_TOKEN_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

describe('Power user persona', function () {
  setupPerformanceReporting();

  it('Check asset details page load time', async function () {
    if (!process.env.INFURA_PROJECT_ID) {
      throw new Error(
        'Running this E2E test requires a valid process.env.INFURA_PROJECT_ID',
      );
    }

    await withFixtures(
      {
        title: this.test?.fullTitle(),
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

        // Filter to Ethereum network
        await assetListPage.openNetworksFilter();
        const networkManager = new NetworkManager(driver);
        await networkManager.selectNetworkByNameWithWait('Ethereum');
        await homePage.checkPageIsLoaded();
        await assetListPage.checkTokenListIsDisplayed();
        await assetListPage.checkConversionRateDisplayed();

        // Measure: Click on asset and wait for chart
        await assetListPage.clickOnAsset('USDC');
        await timerAssetDetails.measure(async () => {
          await assetListPage.checkPriceChartIsShown();
          await assetListPage.checkPriceChartLoaded(USDC_TOKEN_ADDRESS);
        });
        performanceTracker.addTimer(timerAssetDetails);
      },
    );
  });
});
