import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';

import { withFixtures, unlockWallet } from '../../helpers';
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
            tokensChainsCache: {
              '0x1': {
                data: {
                  '0xc4c2614e694cf534d407ee49f8e44d125e4681c4': {
                    name: 'Chain Games',
                    symbol: 'CHAIN',
                    address: '0xc4c2614e694cf534d407ee49f8e44d125e4681c4',
                  },
                  '0x7051faed0775f664a0286af4f75ef5ed74e02754': {
                    name: 'ChangeX',
                    symbol: 'CHANGE',
                    address: '0x7051faed0775f664a0286af4f75ef5ed74e02754',
                  },
                },
              },
            },
          })
          .build(),
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
        await tokenList.check_tokenExistsInList('Ethereum');
        await tokenList.check_tokenExistsInList('Chain Games');
        // TODO: add back this check once we figure out why tokens name displayed when running the test locally is changex but on CI it is ChangeX
        // await tokenList.check_tokenExistsInList('Changex');
        await tokenList.check_tokenExistsInList('Chai');
      },
    );
  });

  it('allows importing multiple tokens from search across chains', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withNetworkControllerOnPolygon()
          .withTokensController({
            tokenList: [],
            tokensChainsCache: {
              '0x1': {
                data: {
                  '0x0a0e3bfd5a8ce610e735d4469bc1b3b130402267': {
                    name: 'Entropy',
                    aggregators: ['Lifi', 'Coinmarketcap', 'Rango'],
                    address: '0x0a0e3bfd5a8ce610e735d4469bc1b3b130402267',
                    decimals: 18,
                    iconUrl:
                      'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0a0e3bfd5a8ce610e735d4469bc1b3b130402267.png',
                    occurrences: 3,
                    symbol: 'ERP',
                  },
                },
              },
              '0x89': {
                data: {
                  '0xc2132D05D31c914a87C6611C10748AEb04B58e8F': {
                    name: 'USDT',
                    aggregators: ['Lifi', 'Coinmarketcap', 'Rango'],
                    address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
                    decimals: 6,
                    iconUrl:
                      'https://static.cx.metamask.io/api/v1/tokenIcons/137/0xc2132D05D31c914a87C6611C10748AEb04B58e8F.png',
                    occurrences: 3,
                    symbol: 'USDT',
                  },
                },
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockPriceFetch,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();

        const assetListPage = new AssetListPage(driver);

        await assetListPage.importMultipleTokensBySearch(['ERP', 'USDT']);

        const tokenList = new AssetListPage(driver);
        await tokenList.check_tokenItemNumber(5); // Polygon, Eth, linea, USDT, ERP

        await tokenList.check_tokenExistsInList('Ethereum');
        await tokenList.check_tokenExistsInList('ERP');
        await tokenList.check_tokenExistsInList('USDT');
        await tokenList.check_tokenExistsInList('POL');
      },
    );
  });

  it('allows importing using contract address and not current network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withNetworkControllerOnPolygon()
          .withTokensController({
            tokenList: [],
            tokensChainsCache: {
              '0x1': {
                data: {
                  '0x0a0e3bfd5a8ce610e735d4469bc1b3b130402267': {
                    name: 'Entropy',
                    aggregators: ['Lifi', 'Coinmarketcap', 'Rango'],
                    address: '0x0a0e3bfd5a8ce610e735d4469bc1b3b130402267',
                    decimals: 18,
                    iconUrl:
                      'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0a0e3bfd5a8ce610e735d4469bc1b3b130402267.png',
                    symbol: 'ERP',
                  },
                },
              },
              '0x89': {
                data: {
                  '0xc2132D05D31c914a87C6611C10748AEb04B58e8F': {
                    name: 'USDT',
                    aggregators: ['Lifi', 'Coinmarketcap', 'Rango'],
                    address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
                    decimals: 6,
                    iconUrl:
                      'https://static.cx.metamask.io/api/v1/tokenIcons/137/0xc2132D05D31c914a87C6611C10748AEb04B58e8F.png',
                    occurrences: 3,
                    symbol: 'USDT',
                  },
                },
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockPriceFetch,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();

        const assetListPage = new AssetListPage(driver);
        await assetListPage.importCustomTokenByChain(
          '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
          'USDT',
          '0x89',
        );
        const tokenList = new AssetListPage(driver);
        await tokenList.check_tokenItemNumber(4); // Polygon, Eth, linea, USDT

        await tokenList.check_tokenExistsInList('Ethereum');
        await tokenList.check_tokenExistsInList('USDT');
        await tokenList.check_tokenExistsInList('POL');
      },
    );
  });
});
