import { Context } from 'mocha';
import { MockttpServer } from 'mockttp';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { NETWORK_CLIENT_ID } from '../../constants';
import { withFixtures, largeDelayMs } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/home/homepage';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { mockSpotPrices } from './utils/mocks';

describe('Token List Sorting', function () {
  const mainnetChainId = CHAIN_IDS.MAINNET;
  const customTokenAddress = '0x2EFA2Cb29C2341d8E5Ba7D3262C9e9d6f1Bf3711';
  const customTokenSymbol = 'ABC';

  const testFixtures = {
    fixtures: new FixtureBuilderV2()
      .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
      .withEnabledNetworks({ eip155: { [mainnetChainId]: true } })
      .build(),
    localNodeOptions: {
      chainId: parseInt(mainnetChainId, 16),
    },
  };

  it('should sort tokens alphabetically and by decreasing balance', async function () {
    await withFixtures(
      {
        ...testFixtures,
        title: (this as Context).test?.fullTitle(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockSpotPrices(mockServer, {
            'eip155:1/slip44:60': {
              price: 1700,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          });
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);

        await homePage.checkPageIsLoaded();
        await assetListPage.importCustomTokenByChain(
          CHAIN_IDS.MAINNET,
          customTokenAddress,
          customTokenSymbol,
        );

        await assetListPage.checkTokenExistsInList('Ethereum');
        await assetListPage.sortTokenList('alphabetically');

        await driver.waitUntil(
          async () => {
            const sortedTokenList = await assetListPage.getTokenListNames();
            return sortedTokenList[0].includes(customTokenSymbol);
          },
          { timeout: largeDelayMs, interval: 100 },
        );

        await assetListPage.sortTokenList('decliningBalance');
        await driver.waitUntil(
          async () => {
            const sortedTokenListByBalance =
              await assetListPage.getTokenListNames();
            return sortedTokenListByBalance[0].includes('Ethereum');
          },
          { timeout: largeDelayMs, interval: 100 },
        );
      },
    );
  });
});
