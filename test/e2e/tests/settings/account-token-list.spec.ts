import { MockttpServer, Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { mockServerJsonRpc } from '../ppom/mocks/mock-server-json-rpc';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import AccountListPage from '../../page-objects/pages/account-list-page';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import { mockEthPrices } from '../tokens/utils/mocks';
import { getMockAssetsPrice } from '../bridge/constants';
import { login } from '../../page-objects/flows/login.flow';

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
describe('Settings', function () {
  it('Should match the value of token list item and account list item for eth conversion', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withAssetsController({
            assetsPrice: getMockAssetsPrice(1700),
          })
          .build(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockEthPrices(mockServer, 1700, ['0x1']);
        },

        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver, { expectedBalance: '$42,500.00' });
        await new HeaderNavbar(driver).openAccountMenu();
        await new AccountListPage(
          driver,
        ).checkMultichainAccountBalanceDisplayed({ balance: '$42,500.00' });
      },
    );
  });

  it('Should match the value of token list item and account list item for fiat conversion', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .withPreferencesController({
            preferences: { showFiatInTestnets: true, showTestNetworks: true },
          })
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withAssetsController({
            assetsPrice: getMockAssetsPrice(1700),
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockEthPrices(mockServer, 1700, ['0x1']);
          await mockInfura(mockServer);
        },
      },
      async ({ driver }) => {
        await login(driver, { validateBalance: false });
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
        await switchToNetworkFromNetworkSelect(driver, 'Custom', 'Sepolia');

        await homePage.headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.toggleBalanceSetting();
        await settingsPage.clickBackButton();
        await homePage.checkExpectedBalanceIsDisplayed('25', 'SepoliaETH');
      },
    );
  });

  it('Should show crypto value when price checker setting is off', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withPreferencesController({
            preferences: { showFiatInTestnets: true },
          })
          .withAssetsController({
            assetsPrice: getMockAssetsPrice(1700),
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockEthPrices(mockServer, 1700);
          await mockInfura(mockServer);
        },
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkExpectedBalanceIsDisplayed('25', 'ETH');
      },
    );
  });
});
