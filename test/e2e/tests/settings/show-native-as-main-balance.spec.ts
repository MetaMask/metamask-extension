import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixtures/fixture-builder';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import {
  loginWithBalanceValidation,
  loginWithoutBalanceValidation,
} from '../../page-objects/flows/login.flow';

async function mockPriceApi(mockServer: Mockttp) {
  const spotPricesMockEth = await mockServer
    .forGet(/^https:\/\/price\.api\.cx\.metamask\.io\/v3\/spot-prices/u)

    .thenCallback(() => ({
      statusCode: 200,
      json: {
        'eip155:1/slip44:60': {
          id: 'ethereum',
          price: 1,
          marketCap: 112500000,
          totalVolume: 4500000,
          dilutedMarketCap: 120000000,
          pricePercentChange1d: 0,
        },
      },
    }));
  const mockExchangeRates = await mockServer
    .forGet('https://price.api.cx.metamask.io/v1/exchange-rates')
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        eth: {
          name: 'Ether',
          ticker: 'eth',
          value: 1 / 1700,
          currencyType: 'crypto',
        },
        usd: {
          name: 'US Dollar',
          ticker: 'usd',
          value: 1,
          currencyType: 'fiat',
        },
      },
    }));

  return [spotPricesMockEth, mockExchangeRates];
}

describe('Settings: Show native token as main balance', function () {
  it('Should show balance in crypto when toggle is off', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withConversionRateDisabled().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockPriceApi(mockServer);
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenAmountIsDisplayed('25 ETH');
      },
    );
  });

  it('Should show balance in fiat when toggle is on', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withConversionRateEnabled()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockPriceApi(mockServer);
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('$42,500.00', 'USD');

        await homePage.headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.clickAdvancedTab();
        const advancedSettingsPage = new AdvancedSettings(driver);
        await advancedSettingsPage.checkPageIsLoaded();
        await advancedSettingsPage.toggleShowConversionOnTestnets();
        await settingsPage.closeSettingsPage();

        // assert amount displayed
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenFiatAmountIsDisplayed('$42,500.00');
      },
    );
  });

  it('Should not show popover twice', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withConversionRateEnabled()
          .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockPriceApi(mockServer);
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('$42,500.00', 'USD');

        await homePage.headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.clickAdvancedTab();
        const advancedSettingsPage = new AdvancedSettings(driver);
        await advancedSettingsPage.checkPageIsLoaded();
        await advancedSettingsPage.toggleShowConversionOnTestnets();
        await settingsPage.closeSettingsPage();

        // go to setting and back to home page and make sure popover is not shown again
        await homePage.headerNavbar.openSettingsPage();
        await settingsPage.checkPageIsLoaded();
        await settingsPage.closeSettingsPage();
        await homePage.checkPageIsLoaded();
      },
    );
  });
});
