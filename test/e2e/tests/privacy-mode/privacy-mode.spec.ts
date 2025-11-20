import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import { mockEtherumSpotPrices } from '../tokens/utils/mocks';
import {
  loginWithBalanceValidation,
  loginWithoutBalanceValidation,
} from '../../page-objects/flows/login.flow';

async function mockPriceApi(mockServer: Mockttp) {
  const spotPricesMockEth = await mockServer
    .forGet(
      /^https:\/\/price\.api\.cx\.metamask\.io\/v2\/chains\/\d+\/spot-prices/u,
    )

    .thenCallback(() => ({
      statusCode: 200,
      json: {
        '0x0000000000000000000000000000000000000000': {
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

describe('Privacy Mode', function () {
  it('should hide fiat balance and token balance when privacy mode is activated', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockPriceApi,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.togglePrivacyBalance();
        await homePage.checkExpectedBalanceIsDisplayed('••••••', '••••••');

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountList = new AccountListPage(driver);
        await accountList.checkPageIsLoaded();
        await accountList.checkAccountBalanceIsPrivate();
      },
    );
  });

  it('should show fiat balance and token balance when privacy mode is deactivated', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
          .withPreferencesController({
            preferences: {
              privacyMode: true,
            },
          })
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockPriceApi(mockServer);
          return mockEtherumSpotPrices(mockServer);
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.togglePrivacyBalance();
        await homePage.checkExpectedBalanceIsDisplayed('$42,500');

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountList = new AccountListPage(driver);
        await accountList.checkPageIsLoaded();

        await accountList.checkMultichainAccountBalanceDisplayed('$42,500');
      },
    );
  });
});
