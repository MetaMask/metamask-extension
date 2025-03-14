import {
  withFixtures,
} from '../../helpers';
import { mockServerJsonRpc } from '../ppom/mocks/mock-server-json-rpc';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { DEFAULT_GANACHE_ETH_BALANCE_DEC } from '../../constants';

const infuraSepoliaUrl =
  'https://sepolia.infura.io/v3/00000000000000000000000000000000';

async function mockInfura(mockServer: any) {
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

async function mockInfuraResponses(mockServer: any) {
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

        // check that the token amount is displayed in the asset list
        await new AssetListPage(driver).check_tokenAmountIsDisplayed(
          DEFAULT_GANACHE_ETH_BALANCE_DEC + ' ETH',
        );

        // check that the token amount is displayed in the account list
        await new HeaderNavbar(driver).openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_firstCurrencyBalanceIsDisplayed(
          DEFAULT_GANACHE_ETH_BALANCE_DEC + ' ETH',
        );
      },
    );
  });
});
