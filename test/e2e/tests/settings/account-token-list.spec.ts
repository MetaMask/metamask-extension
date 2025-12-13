import { MockttpServer, Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { mockServerJsonRpc } from '../ppom/mocks/mock-server-json-rpc';
import FixtureBuilder from '../../fixtures/fixture-builder';
import AccountListPage from '../../page-objects/pages/account-list-page';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import { switchToNetworkFromSendFlow } from '../../page-objects/flows/network.flow';
import { mockSpotPrices } from '../tokens/utils/mocks';
import {
  loginWithBalanceValidation,
  loginWithoutBalanceValidation,
} from '../../page-objects/flows/login.flow';

const infuraSepoliaUrl =
  'https://sepolia.infura.io/v3/00000000000000000000000000000000';

async function mockInfura(mockServer: Mockttp): Promise<void> {
  await mockServerJsonRpc(mockServer as MockttpServer, [
    ['eth_blockNumber'],
    ['eth_getBlockByNumber'],
  ]);
  await mockServer
    .forPost(infuraSepoliaUrl)
    .withJsonBodyIncluding({ method: 'eth_getBalance' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        jsonrpc: '2.0',
        id: '6857940763865360',
        result: '0x15af1d78b58c40000',
      },
    }));
}

async function mockInfuraResponses(mockServer: Mockttp): Promise<void> {
  await mockInfura(mockServer);
  await mockSpotPrices(mockServer, {
    'eip155:1/slip44:60': {
      price: 1700,
      marketCap: 382623505141,
      pricePercentChange1d: 0,
    },
  });
}

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
describe('Settings', function () {
  it('Should match the value of token list item and account list item for eth conversion', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockPriceApi(mockServer);
        },

        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(
          driver,
          undefined,
          undefined,
          '$42,500.00',
        );
        await new HeaderNavbar(driver).openAccountMenu();
        await new AccountListPage(
          driver,
        ).checkMultichainAccountBalanceDisplayed('$42,500.00');
      },
    );
  });

  it('Should match the value of token list item and account list item for fiat conversion', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
          .withShowFiatTestnetEnabled()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withPreferencesController({
            preferences: { showTestNetworks: true },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockPriceApi(mockServer);
          await mockInfuraResponses(mockServer);
        },
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkExpectedBalanceIsDisplayed('42,500.00', 'USD');
        await new AssetListPage(driver).checkTokenFiatAmountIsDisplayed(
          '$42,500.00',
        );

        // switch to Sepolia
        // the account list item used to always show account.balance as long as its EVM network.
        // Now we are showing aggregated fiat balance on non testnetworks; but if it is a testnetwork we will show account.balance.
        // The current test was running initially on localhost
        // which is not a testnetwork resulting in the code trying to calculate the aggregated total fiat balance which shows 0.00$
        // If this test switches to mainnet then switches back to localhost; the test will pass because switching to mainnet
        // will make the code calculate the aggregate fiat balance on mainnet+Linea mainnet and because this account in this test
        // has 42,500.00 native Eth on mainnet then the aggregated total fiat would be 42,500.00. When the user switches back to localhost
        // it will show the total that the test is expecting.

        // I think we can slightly modify this test to switch to Sepolia network before checking the account List item value
        await switchToNetworkFromSendFlow(driver, 'Sepolia');

        await homePage.headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.toggleBalanceSetting();
        await settingsPage.closeSettingsPage();
        await homePage.checkExpectedBalanceIsDisplayed('25', 'SepoliaETH');
      },
    );
  });

  it('Should show crypto value when price checker setting is off', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withShowFiatTestnetEnabled().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockPriceApi(mockServer);
          await mockInfuraResponses(mockServer);
        },
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkExpectedBalanceIsDisplayed('25', 'ETH');
      },
    );
  });
});
