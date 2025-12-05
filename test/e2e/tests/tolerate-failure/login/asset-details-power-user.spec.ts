import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { WITH_STATE_POWER_USER } from '../../../benchmarks/constants';
import { withFixtures } from '../../../helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import NetworkManager from '../../../page-objects/pages/network-manager';
import { Driver } from '../../../webdriver/driver';
import { setupTimerReporting } from '../utils/testSetup';
import Timers from '../../../../timers/Timers';

const USDC_TOKEN_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
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
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenListIsDisplayed();
        await assetListPage.checkConversionRateDisplayed();
        await assetListPage.openNetworksFilter();
        const networkManager = new NetworkManager(driver);
        await networkManager.selectNetworkByNameWithWait('Ethereum');
        await homePage.checkPageIsLoaded();
        await assetListPage.checkTokenListIsDisplayed();
        await assetListPage.checkConversionRateDisplayed();
        await assetListPage.clickOnAsset('USDC');
        const timer1 = Timers.createTimer(
          'Time since the user clicks on the asset until the price chart is shown',
        );
        timer1.startTimer();
        await assetListPage.checkPriceChartIsShown();
        await assetListPage.checkPriceChartLoaded(USDC_TOKEN_ADDRESS);
        timer1.stopTimer();
      },
    );
  });
});
