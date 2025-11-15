import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { WITH_STATE_POWER_USER } from '../../../benchmarks/constants';
import { withFixtures } from '../../../helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import NetworkManager from '../../../page-objects/pages/network-manager';
import { Driver } from '../../../webdriver/driver';
import { setupTimerReporting } from '../utils/testSetup.js';
import Timers from '../../timers/Timers.js';

describe('Power user persona', function () {
  // Setup timer reporting for all tests in this describe block
  setupTimerReporting();

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
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkTokenListIsDisplayed();
        await homePage.checkTokenListPricesAreDisplayed();
        const assetListPage = new AssetListPage(driver);
        await assetListPage.openNetworksFilter();
        const networkManager = new NetworkManager(driver);
        await networkManager.selectNetworkByNameWithWait('Ethereum');
        await driver.delay(1000);
        await homePage.checkPageIsLoaded();
        await homePage.checkTokenListIsDisplayed();
        await homePage.checkTokenListPricesAreDisplayed();
        await assetListPage.clickOnAsset('USDC');
        const timer1 = Timers.createTimer(
          'Time since the user clicks on the asset until the price chart is shown',
        );
        await driver.delay(1000); // workaround to avoid race condition
        timer1.startTimer();
        await assetListPage.checkPriceChartIsShown();
        await assetListPage.checkPriceChartLoaded(
          '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        ); // USDC address
        timer1.stopTimer();
        console.log(`Timer 1:  ${timer1.getDurationInSeconds()} s`);
      },
    );
  });
});
