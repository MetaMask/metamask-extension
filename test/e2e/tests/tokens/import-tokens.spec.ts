import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';

import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Mockttp } from '../../mock-e2e';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';

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

async function mockTokens(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet('https://token.api.cx.metamask.io/tokens/1')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: [
            {
              address: '0x06af07097c9eeb7fd685c692751d5c66db49c215',
              symbol: 'CHAI',
              decimals: 18,
              name: 'Chai',
              iconUrl: '',
              type: 'erc20',
              aggregators: [],
              occurrences: 1,
              erc20Permit: true,
              storage: {},
              fees: {},
            },
            {
              address: '0x7051faed0775f664a0286af4f75ef5ed74e02754',
              symbol: 'CHANGE',
              decimals: 18,
              name: 'Changex',
              iconUrl: '',
              type: 'erc20',
              aggregators: [],
              occurrences: 6,
              erc20Permit: false,
              storage: {},
              fees: {},
            },
            {
              address: '0xc4c2614e694cf534d407ee49f8e44d125e4681c4',
              symbol: 'CHAIN',
              decimals: 18,
              name: 'Chain Games',
              iconUrl: '',
              type: 'erc20',
              aggregators: [],
              occurrences: 1,
              erc20Permit: false,
            },
            {
              address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
              symbol: 'USDT',
              decimals: 6,
              name: 'Tether USD',
              iconUrl: '',
              type: 'erc20',
              aggregators: [],
              occurrences: 1,
              erc20Permit: false,
              storage: {},
              fees: {},
            },
            {
              address: '0x0a0e3bfd5a8ce610e735d4469bc1b3b130402267',
              symbol: 'ERP',
              decimals: 18,
              name: 'Entropyfi',
              iconUrl: '',
              type: 'erc20',
              aggregators: [],
              occurrences: 1,
              erc20Permit: false,
              storage: {},
              fees: {},
            },
          ],
        };
      }),
    await mockServer
      .forGet('https://token.api.cx.metamask.io/tokens/137')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: [
            {
              address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
              symbol: 'USDT',
              decimals: 6,
              name: 'Polygon Bridged USDT  Polygon ',
              iconUrl: '',
              type: 'erc20',
              aggregators: [],
              occurrences: 1,
              erc20Permit: false,
              storage: {},
            },
          ],
        };
      }),
  ];
}

async function mockTokensAndPrices(mockServer: Mockttp) {
  return [await mockPriceFetch(mockServer), ...(await mockTokens(mockServer))];
}
describe('Import flow', function () {
  it('allows importing multiple tokens from search', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
              [CHAIN_IDS.LINEA_MAINNET]: true,
              [CHAIN_IDS.BASE]: true,
            },
          })
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
        testSpecificMock: mockTokensAndPrices,
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);
        await homePage.checkPageIsLoaded();
        await assetListPage.importMultipleTokensBySearch([
          'CHAIN',
          'CHANGE',
          'CHAI',
        ]);

        const tokenList = new AssetListPage(driver);

        // Native Tokens: Ethereum ETH, Linea ETH, Base ETH, Polygon POL
        // ERC20 Tokens: Chain Games, Chai
        await tokenList.checkTokenItemNumber(6);
        await tokenList.checkTokenExistsInList('Ethereum');
        await tokenList.checkTokenExistsInList('Chain Games');
        // TODO: add back this check once we figure out why tokens name displayed when running the test locally is changex but on CI it is ChangeX
        // await tokenList.checkTokenExistsInList('Changex');
        await tokenList.checkTokenExistsInList('Chai');
      },
    );
  });

  it('allows importing multiple tokens from search across chains', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withNetworkControllerOnPolygon()
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
              [CHAIN_IDS.POLYGON]: true,
              [CHAIN_IDS.LINEA_MAINNET]: true,
              [CHAIN_IDS.BASE]: true,
            },
          })
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
        testSpecificMock: mockTokensAndPrices,
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const assetListPage = new AssetListPage(driver);

        await assetListPage.importMultipleTokensBySearch(['ERP', 'USDT']);

        const tokenList = new AssetListPage(driver);

        // Native Tokens: Ethereum ETH, Linea ETH, Base ETH, Polygon POL
        // ERC20 Tokens: Polygon USDT, Polygon ERP
        await tokenList.checkTokenItemNumber(6);

        await tokenList.checkTokenExistsInList('Ethereum');
        await tokenList.checkTokenExistsInList('ERP');
        await tokenList.checkTokenExistsInList('USDT');
        await tokenList.checkTokenExistsInList('POL');
      },
    );
  });

  it('allows importing using contract address and not current network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withNetworkControllerOnPolygon()
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
              [CHAIN_IDS.POLYGON]: true,
              [CHAIN_IDS.LINEA_MAINNET]: true,
              [CHAIN_IDS.BASE]: true,
            },
          })
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
        testSpecificMock: mockTokensAndPrices,
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const assetListPage = new AssetListPage(driver);

        // the token symbol is prefilled because of the mock
        await assetListPage.importCustomTokenByChain(
          '0x89',
          '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        );
        const tokenList = new AssetListPage(driver);

        // Native Tokens: Ethereum ETH, Linea ETH, Base ETH, Polygon POL
        // ERC20 Tokens: Polygon USDT
        await tokenList.checkTokenItemNumber(5);

        await tokenList.checkTokenExistsInList('Ethereum');
        await tokenList.checkTokenExistsInList('USDT');
        await tokenList.checkTokenExistsInList('POL');
      },
    );
  });
});
