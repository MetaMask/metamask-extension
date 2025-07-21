import { MockttpServer } from 'mockttp';
import { withFixtures } from '../../helpers';
import { mockServerJsonRpc } from '../ppom/mocks/mock-server-json-rpc';
import FixtureBuilder from '../../fixture-builder';
import AccountListPage from '../../page-objects/pages/account-list-page';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import { switchToNetworkFromSendFlow } from '../../page-objects/flows/network.flow';
import {
  loginWithBalanceValidation,
  loginWithoutBalanceValidation,
} from '../../page-objects/flows/login.flow';
import { CHAIN_IDS } from '../../../../shared/constants/network';

const infuraSepoliaUrl =
  'https://sepolia.infura.io/v3/00000000000000000000000000000000';

async function mockInfura(mockServer: MockttpServer): Promise<void> {
  await mockServerJsonRpc(mockServer, [
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

async function mockInfuraResponses(mockServer: MockttpServer): Promise<void> {
  await mockInfura(mockServer);
}

describe('Settings', function () {
  it('Should match the value of token list item and account list item for eth conversion', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withConversionRateDisabled().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await new AssetListPage(driver).check_tokenAmountIsDisplayed('25 ETH');
        await new HeaderNavbar(driver).openAccountMenu();
        await new AccountListPage(driver).check_accountBalanceDisplayed(
          '25 ETH',
        );
      },
    );
  });

  it('Should match the value of token list item and account list item for fiat conversion', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withConversionRateEnabled()
          .withShowFiatTestnetEnabled()
          .withPreferencesController({
            preferences: { showTestNetworks: true },
          })
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.SEPOLIA]: true,
              [CHAIN_IDS.LOCALHOST]: true,
            },
          })
          .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockInfuraResponses,
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed('42,500.00', 'USD');
        await new AssetListPage(driver).check_tokenFiatAmountIsDisplayed(
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

        await new HeaderNavbar(driver).openAccountMenu();
        await new AccountListPage(driver).check_accountValueAndSuffixDisplayed(
          '$42,500.00',
        );
      },
    );
  });

  it('Should show crypto value when price checker setting is off', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withConversionRateEnabled()
          .withShowFiatTestnetEnabled()
          .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
          .withConversionRateDisabled()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockInfuraResponses,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await new HeaderNavbar(driver).openAccountMenu();
        await new AccountListPage(driver).check_accountBalanceDisplayed(
          '25 ETH',
        );
      },
    );
  });
});
