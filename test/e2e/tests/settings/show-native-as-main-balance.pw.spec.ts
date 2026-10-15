import { test as pwTest } from '@playwright/test';
import { Mockttp } from 'mockttp';
import { E2E_DRIVER } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import HomePage from '../../page-objects/pages/home/homepage';
import PreferencesAndDisplaySettings from '../../page-objects/pages/settings/preferences-and-display-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { login } from '../../page-objects/flows/login.flow';
import { closeSettings } from '../../page-objects/flows/settings.flow';
import {
  getLocalhost25EthAssetsControllerPatch,
  getMainnet25EthAssetsControllerPatch,
} from '../tokens/utils/mocks';

async function mockPriceApi(mockServer: Mockttp) {
  const spotPricesMockEth = await mockServer
    .forGet(/^https:\/\/price\.api\.cx\.metamask\.io\/v3\/spot-prices/u)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        'eip155:1/slip44:60': {
          id: 'ethereum',
          price: 1700,
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

pwTest.describe('Settings: Show native token as main balance', () => {
  pwTest(
    'Should show balance in crypto when toggle is off',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2()
            .withConversionRateDisabled()
            .withEnabledNetworks({ eip155: { '0x1': true } })
            .withAssetsController(getLocalhost25EthAssetsControllerPatch())
            .build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
          testSpecificMock: async (mockServer: Mockttp) => {
            await mockPriceApi(mockServer);
          },
        },
        async ({ driver }) => {
          await login(driver);
          const tokensTab = new TokensTab(driver);
          await tokensTab.checkTokenAmountIsDisplayed('25 ETH');
        },
      );
    },
  );

  pwTest(
    'Should show balance in fiat when toggle is on',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2()
            .withEnabledNetworks({ eip155: { '0x1': true } })
            .withShowNativeTokenAsMainBalanceDisabled()
            .withAssetsController(getMainnet25EthAssetsControllerPatch(1700))
            .build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
          testSpecificMock: async (mockServer: Mockttp) => {
            await mockPriceApi(mockServer);
          },
        },
        async ({ driver }) => {
          await login(driver, { validateBalance: false });
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.checkExpectedBalanceIsDisplayed('$42,500.00', 'USD');

          await homePage.headerNavbar.openSettingsPage();
          const assetsSettings = new PreferencesAndDisplaySettings(driver);
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToAssetsSettings();
          await assetsSettings.checkAssetsPageIsLoaded();
          await assetsSettings.toggleShowNativeTokenAsMainBalance();
          await closeSettings(driver);

          // assert amount displayed
          const tokensTab = new TokensTab(driver);
          await tokensTab.checkTokenFiatAmountIsDisplayed('$42,500.00');
        },
      );
    },
  );

  pwTest(
    'Should not show popover twice',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2()
            .withEnabledNetworks({ eip155: { '0x1': true } })
            .withShowNativeTokenAsMainBalanceDisabled()
            .withAssetsController(getMainnet25EthAssetsControllerPatch(1700))
            .build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
          testSpecificMock: async (mockServer: Mockttp) => {
            await mockPriceApi(mockServer);
          },
        },
        async ({ driver }) => {
          await login(driver, { validateBalance: false });
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.checkExpectedBalanceIsDisplayed('$42,500.00', 'USD');

          await homePage.headerNavbar.openSettingsPage();
          const assetsSettings = new PreferencesAndDisplaySettings(driver);
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToAssetsSettings();
          await assetsSettings.checkAssetsPageIsLoaded();
          await assetsSettings.toggleShowNativeTokenAsMainBalance();
          await closeSettings(driver);

          // go to setting and back to home page and make sure popover is not shown again
          await homePage.headerNavbar.openSettingsPage();
          await settingsPage.checkPageIsLoaded();
          await closeSettings(driver);
          await homePage.checkPageIsLoaded();
        },
      );
    },
  );
});
