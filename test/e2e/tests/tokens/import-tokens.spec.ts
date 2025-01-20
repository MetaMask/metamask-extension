import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';

import {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Mockttp } from '../../mock-e2e';

describe('Import flow', function () {
  async function mockPriceFetch(mockServer: Mockttp) {
    return [
      await mockServer
        .forGet('https://price.api.cx.metamask.io/v2/chains/1/spot-prices')
        .withQuery({
          tokenAddresses:
            '0x06af07097c9eeb7fd685c692751d5c66db49c215,0x514910771af9ca656af840dff83e8264ecf986ca,0x7d4b8cce0591c9044a22ee543533b72e976e36c3',
          vsCurrency: 'ETH',
        })
        .thenCallback(() => {
          return {
            statusCode: 200,
            json: {
              '0x06af07097c9eeb7fd685c692751d5c66db49c215': {
                eth: 0.0002,
              },
              '0x514910771af9ca656af840dff83e8264ecf986ca': {
                eth: 0.0003,
              },
              '0x7d4b8cce0591c9044a22ee543533b72e976e36c3': {
                eth: 0.0001,
              },
            },
          };
        }),
    ];
  }
  it('allows importing multiple tokens from search', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withTokensController({
            tokenList: [
              {
                name: 'Chain Games',
                symbol: 'CHAIN',
                address: '0xc4c2614e694cf534d407ee49f8e44d125e4681c4',
              },
              {
                address: '0x7051faed0775f664a0286af4f75ef5ed74e02754',
                symbol: 'CHANGE',
                name: 'ChangeX',
              },
              {
                name: 'Chai',
                symbol: 'CHAI',
                address: '0x06af07097c9eeb7fd685c692751d5c66db49c215',
              },
            ],
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockPriceFetch,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);
        await homePage.check_pageIsLoaded();
        await assetListPage.importMultipleTokensBySearch([
          'CHAIN',
          'CHANGE',
          'CHAI',
        ]);

        const tokenList = new AssetListPage(driver);
        await tokenList.check_tokenItemNumber(5); // Linea & Mainnet Eth
        await tokenList.check_tokenIsDisplayed('Ethereum');
        await tokenList.check_tokenIsDisplayed('Chain Games');
        // TODO: add back this check once we figure out why tokens name displayed when running the test locally is changex but on CI it is ChangeX
        // await tokenList.check_tokenIsDisplayed('Changex');
        await tokenList.check_tokenIsDisplayed('Chai');
      },
    );
  });
});
