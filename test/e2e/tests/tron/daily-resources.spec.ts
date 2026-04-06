import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import HomePage from '../../page-objects/pages/home/homepage';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import NetworkManager from '../../page-objects/pages/network-manager';
import { mockTronApis } from './mocks/common-tron';

describe('Tron daily resources', function (this: Suite) {
  it('Daily resource section shows energy and bandwidth on TRX asset page', async function () {
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

        // Open the native TRX asset details page
        const assetListPage = new AssetListPage(driver);
        await assetListPage.clickOnAsset('Tron');

        // Verify the "Daily resource" heading is present
        // (i18n key tronDailyResources = "Daily resource")
        await driver.waitForSelector({ text: 'Daily resource', tag: 'p' });

        // Verify Energy and Bandwidth resource labels are shown
        await driver.waitForSelector({ text: 'Energy', tag: 'p' });
        await driver.waitForSelector({ text: 'Bandwidth', tag: 'p' });
      },
    );
  });
});
