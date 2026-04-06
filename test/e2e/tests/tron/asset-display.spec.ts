import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import HomePage from '../../page-objects/pages/home/homepage';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import NetworkManager from '../../page-objects/pages/network-manager';
import { mockTronApis } from './mocks/common-tron';

describe('Tron asset display', function (this: Suite) {
  it('TRC20 token balances are displayed in the token list', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '6.072 TRX' });

        const assetListPage = new AssetListPage(driver);
        // Verify TRC20 tokens are visible in the token list
        await assetListPage.checkTokenExistsInList('Tether');
        await assetListPage.checkTokenExistsInList('SEED');
        await assetListPage.checkTokenExistsInList('USDD');
        await assetListPage.checkTokenExistsInList('HTX DAO');
      },
    );
  });

  it('Native TRX asset details page shows correct information', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '6.072 TRX' });

        // Click on the native TRX asset to open asset details
        const assetListPage = new AssetListPage(driver);
        await assetListPage.clickOnAsset('Tron');

        // Verify the TRX balance is shown on the asset details page
        await assetListPage.checkTokenAmountIsDisplayed('6.072 TRX');

        // Verify the price is shown (~$0.29 per TRX)
        await assetListPage.checkTokenPrice('$0.29');
      },
    );
  });

  it('TRC20 USDT asset details page shows correct information', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) => mockTronApis(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '6.072 TRX' });

        // Click on USDT token to open asset details
        const assetListPage = new AssetListPage(driver);
        await assetListPage.clickOnAsset('Tether');

        // Verify USDT token name is shown on the asset details page
        await driver.waitForSelector({ text: 'Tether', tag: 'span' });

        // Verify the USDT balance (2804595 with 6 decimals = 2.804595 USDT)
        await assetListPage.checkTokenAmountIsDisplayed('2.8046 USDT');

        // Verify the USDT contract address is shown
        await assetListPage.checkTokenSymbolAndAddressDetails(
          'Tether',
          'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        );
      },
    );
  });
});
