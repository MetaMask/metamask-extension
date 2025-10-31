import { generateWalletState } from "../../../../../app/scripts/fixtures/generate-wallet-state";
import { ALL_POPULAR_NETWORKS } from "../../../../../app/scripts/fixtures/with-networks";
import { WITH_STATE_POWER_USER } from "../../../benchmarks/constants";
import { withFixtures } from "../../../helpers";
import { loginWithoutBalanceValidation } from "../../../page-objects/flows/login.flow";
import AssetListPage from "../../../page-objects/pages/home/asset-list";
import HomePage from "../../../page-objects/pages/home/homepage";
import NetworkManager from "../../../page-objects/pages/network-manager";
import { Driver } from "../../../webdriver/driver";
import TimerHelper from "../utils/TimersHelper";

describe.skip('Power user persona', function () {
  it('Check Solana asset details page load time', async function () {
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
        ).withEnabledNetworks(ALL_POPULAR_NETWORKS).build(),
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
        await networkManager.selectNetworkByNameWithWait("Solana");
        await driver.delay(1000);
        await homePage.checkPageIsLoaded();
        await homePage.checkTokenListIsDisplayed();
        await homePage.checkTokenListPricesAreDisplayed();
        await driver.delay(10000000);
        await assetListPage.clickOnAsset("SOL");
        const timer1 = new TimerHelper("Time since the user clicks on the asset until the price chart is shown");
        timer1.start();
        await driver.delay(1000); // workaround to avoid race condition
        await assetListPage.checkPriceChartIsShown();
        await assetListPage.checkPriceChartLoaded("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"); //USDC address
        timer1.stop();
        console.log(`Timer 1:  ${timer1.getDurationInSeconds()} s`);
      },
    );
  });
});
