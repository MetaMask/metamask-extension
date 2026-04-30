import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';

import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { NETWORK_CLIENT_ID } from '../../constants';
import { Mockttp } from '../../mock-e2e';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { login } from '../../page-objects/flows/login.flow';
import { getMockAssetsPrice } from './utils/mocks';

const ETH_CONVERSION_RATE_USD = 1700;

const SPOT_PRICES_V3_URL =
  /^https:\/\/price\.api\.cx\.metamask\.io\/v3\/spot-prices/u;
const EXCHANGE_RATES_V1_URL =
  'https://price.api.cx.metamask.io/v1/exchange-rates';

/**
 * v1 exchange-rates for ETH/USD, aligned with {@link ETH_CONVERSION_RATE_USD}.
 *
 * @param mockServer - Mockttp instance.
 */
async function mockEthExchangeRates(mockServer: Mockttp) {
  return await mockServer
    .forGet(EXCHANGE_RATES_V1_URL)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        eth: {
          name: 'Ether',
          ticker: 'eth',
          value: 1 / ETH_CONVERSION_RATE_USD,
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
}

/**
 * Spot payload for native ETH when unified assets are on — USD price is normalized
 * against conversionRate in selectors (`shared/lib/selectors/assets-migration.ts`).
 */
const NATIVE_ETH_SPOT_ENTRY_USD = {
  id: 'ethereum',
  price: ETH_CONVERSION_RATE_USD,
  marketCap: 112500000,
  totalVolume: 4500000,
  dilutedMarketCap: 120000000,
  pricePercentChange1d: 0,
};

/**
 * Legacy path (unified assets off): `getEvmExchangeRates` multiplies
 * `currencyRates.conversionRate` × TokenRates `marketData[native].price`.
 * Fiat conversion already lives in CurrencyController (~1700 from exchange-rates),
 * so spot native `price` must be 1 — otherwise fiat shows as ~rate² (e.g. 1700×1700).
 * Same pattern as `show-native-as-main-balance.spec.ts` mockPriceApi.
 */
const NATIVE_ETH_SPOT_ENTRY_LEGACY = {
  ...NATIVE_ETH_SPOT_ENTRY_USD,
  price: 1,
};

/**
 * When unified assets state is off: mock v3 spot-prices + v1 exchange-rates only.
 *
 * @param mockServer - Mockttp instance.
 */
async function mockNonUnifiedStateSpotAndExchangeRates(mockServer: Mockttp) {
  const spotPricesMock = await mockServer
    .forGet(SPOT_PRICES_V3_URL)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        'eip155:1/slip44:60': NATIVE_ETH_SPOT_ENTRY_LEGACY,
        'eip155:59144/slip44:60': NATIVE_ETH_SPOT_ENTRY_LEGACY,
        'eip155:8453/slip44:60': NATIVE_ETH_SPOT_ENTRY_LEGACY,
        'eip155:42161/slip44:60': NATIVE_ETH_SPOT_ENTRY_LEGACY,
      },
    }));
  const exchangeRatesMock = await mockEthExchangeRates(mockServer);
  return [spotPricesMock, exchangeRatesMock];
}

/**
 * Shared HTTP mocks for all import-token tests (both unified and legacy price paths).
 * Token metadata (`tokens.api` v3 assets + token list + bridge) is required for both
 * branches so paste-by-address can resolve symbol/decimals via `fetchAssetMetadata`.
 *
 * @param mockServer - Mockttp instance.
 */
async function importTokensTestMock(mockServer: Mockttp) {
  const sharedTokenMocks = [
    await mockAssetsV3(mockServer),
    ...(await mockTokens(mockServer)),
    ...(await mockPolygonBridgeApi(mockServer)),
  ];

  if (process.env.ASSETS_UNIFIED_STATE_ENABLED !== 'true') {
    const priceMocks =
      await mockNonUnifiedStateSpotAndExchangeRates(mockServer);
    return [...priceMocks, ...sharedTokenMocks];
  }

  return [
    await mockPriceFetch(mockServer),
    ...sharedTokenMocks,
    await mockSpotPricesV3(mockServer),
  ];
}

async function mockPriceFetch(mockServer: Mockttp) {
  return [
    await mockServer.forGet(SPOT_PRICES_V3_URL).thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          'eip155:1/slip44:60': {
            price: ETH_CONVERSION_RATE_USD,
          },
          'eip155:59144/slip44:60': {
            price: ETH_CONVERSION_RATE_USD,
          },
          'eip155:1/erc20:0x06af07097c9eeb7fd685c692751d5c66db49c215': {
            price: 0.0002 * ETH_CONVERSION_RATE_USD,
          },
          'eip155:1/erc20:0x514910771af9ca656af840dff83e8264ecf986ca': {
            price: 0.0003 * ETH_CONVERSION_RATE_USD,
          },
          'eip155:1/erc20:0x7d4b8cce0591c9044a22ee543533b72e976e36c3': {
            price: 0.0001 * ETH_CONVERSION_RATE_USD,
          },
        },
      };
    }),
  ];
}

async function mockSpotPricesV3(mockServer: Mockttp) {
  const nativeAssets: Record<string, string> = {
    'eip155:1/slip44:60': 'ethereum',
    'eip155:59144/slip44:60': 'ethereum',
    'eip155:8453/slip44:60': 'ethereum',
  };

  const erc20Assets: Record<string, { symbol: string; usdPrice: number }> = {
    'eip155:1/erc20:0xc4c2614e694cf534d407ee49f8e44d125e4681c4': {
      symbol: 'chain',
      usdPrice: 0.01,
    },
    'eip155:1/erc20:0x7051faed0775f664a0286af4f75ef5ed74e02754': {
      symbol: 'changex',
      usdPrice: 0.05,
    },
    'eip155:1/erc20:0x06af07097c9eeb7fd685c692751d5c66db49c215': {
      symbol: 'chai',
      usdPrice: 0.02,
    },
  };

  return await mockServer.forGet(SPOT_PRICES_V3_URL).thenCallback((request) => {
    const url = new URL(request.url);
    const assetIds = (url.searchParams.get('assetIds') ?? '').toLowerCase();

    const json: Record<string, Record<string, unknown>> = {};

    for (const [id, name] of Object.entries(nativeAssets)) {
      if (assetIds.includes(id)) {
        json[id] = {
          ...NATIVE_ETH_SPOT_ENTRY_USD,
          id: name,
        };
      }
    }

    for (const [id, { symbol }] of Object.entries(erc20Assets)) {
      if (assetIds.includes(id)) {
        json[id] = {
          id: symbol,
          price: 0,
          marketCap: 0,
          pricePercentChange1d: 0,
        };
      }
    }

    return { statusCode: 200, json };
  });
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

async function mockPolygonBridgeApi(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet('https://bridge.api.cx.metamask.io/networks/137/topAssets')
      .thenCallback(() => ({
        statusCode: 200,
        json: [
          {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'POL',
          },
          {
            address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
            symbol: 'USDT',
          },
        ],
      })),
    await mockServer
      .forGet('https://bridge.api.cx.metamask.io/networks/137/tokens')
      .thenCallback(() => ({
        statusCode: 200,
        json: [],
      })),
    await mockServer
      .forGet(
        'https://bridge.api.cx.metamask.io/networks/137/aggregatorMetadata',
      )
      .thenCallback(() => ({
        statusCode: 200,
        json: {},
      })),
  ];
}

async function mockAssetsV3(mockServer: Mockttp) {
  return mockServer
    .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v3\/assets/u)
    .always()
    .thenCallback((request) => {
      const url = new URL(request.url);
      const assetIds = url.searchParams.getAll('assetIds').join(',');

      const assetMap: Record<
        string,
        { assetId: string; name: string; symbol: string; decimals: number }
      > = {
        'eip155:1': {
          assetId: 'eip155:1/slip44:60',
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
        },
        'eip155:59144': {
          assetId: 'eip155:59144/slip44:60',
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
        },
        'eip155:8453': {
          assetId: 'eip155:8453/slip44:60',
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
        },
        '0x06af07097c9eeb7fd685c692751d5c66db49c215': {
          assetId: 'eip155:1/erc20:0x06af07097c9eeb7fd685c692751d5c66db49c215',
          name: 'Chai',
          symbol: 'CHAI',
          decimals: 18,
        },
        '0x7051faed0775f664a0286af4f75ef5ed74e02754': {
          assetId: 'eip155:1/erc20:0x7051faed0775f664a0286af4f75ef5ed74e02754',
          name: 'Changex',
          symbol: 'CHANGE',
          decimals: 18,
        },
        '0xc4c2614e694cf534d407ee49f8e44d125e4681c4': {
          assetId: 'eip155:1/erc20:0xc4c2614e694cf534d407ee49f8e44d125e4681c4',
          name: 'Chain Games',
          symbol: 'CHAIN',
          decimals: 18,
        },
        '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': {
          assetId:
            'eip155:137/erc20:0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
          name: 'Polygon Bridged USDT (Polygon)',
          symbol: 'USDT',
          decimals: 6,
        },
      };

      const results = Object.entries(assetMap)
        .filter(([key]) => assetIds.includes(key))
        .map(([, value]) => value);

      return { statusCode: 200, json: results };
    });
}

describe('Import flow', function () {
  it('allows importing multiple tokens from search', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
              [CHAIN_IDS.LINEA_MAINNET]: true,
              [CHAIN_IDS.BASE]: true,
            },
          })
          .withTokenListController({
            tokensChainsCache: {
              '0x1': {
                timestamp: Date.now(),
                data: {
                  '0xc4c2614e694cf534d407ee49f8e44d125e4681c4': {
                    name: 'Chain Games',
                    symbol: 'CHAIN',
                    address: '0xc4c2614e694cf534d407ee49f8e44d125e4681c4',
                    decimals: 18,
                    occurrences: 1,
                    aggregators: [],
                    iconUrl: '',
                  },
                  '0x7051faed0775f664a0286af4f75ef5ed74e02754': {
                    name: 'ChangeX',
                    symbol: 'CHANGE',
                    address: '0x7051faed0775f664a0286af4f75ef5ed74e02754',
                    decimals: 18,
                    occurrences: 6,
                    aggregators: [],
                    iconUrl: '',
                  },
                  '0x06af07097c9eeb7fd685c692751d5c66db49c215': {
                    name: 'Chai',
                    symbol: 'CHAI',
                    address: '0x06af07097c9eeb7fd685c692751d5c66db49c215',
                    decimals: 18,
                    occurrences: 1,
                    aggregators: [],
                    iconUrl: '',
                  },
                },
              },
            },
          })
          .withAssetsController({
            assetsBalance: {
              'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4': {
                'eip155:1/slip44:60': { amount: '25' },
                'eip155:59144/slip44:60': { amount: '25' },
              },
            },
            assetsPrice: getMockAssetsPrice(ETH_CONVERSION_RATE_USD),
            assetsInfo: {
              'eip155:1/slip44:60': {
                type: 'native',
                decimals: 18,
                symbol: 'ETH',
                name: 'Ethereum',
              },
              'eip155:59144/slip44:60': {
                type: 'native',
                decimals: 18,
                symbol: 'ETH',
                name: 'Ethereum',
              },
              'eip155:8453/slip44:60': {
                type: 'native',
                decimals: 18,
                symbol: 'ETH',
                name: 'Ethereum',
              },
              'eip155:1/erc20:0xc4c2614e694cf534d407ee49f8e44d125e4681c4': {
                type: 'erc20',
                decimals: 18,
                symbol: 'CHAIN',
                name: 'Chain Games',
              },
              'eip155:1/erc20:0x7051faed0775f664a0286af4f75ef5ed74e02754': {
                type: 'erc20',
                decimals: 18,
                symbol: 'CHANGE',
                name: 'ChangeX',
              },
              'eip155:1/erc20:0x06af07097c9eeb7fd685c692751d5c66db49c215': {
                type: 'erc20',
                decimals: 18,
                symbol: 'CHAI',
                name: 'Chai',
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: importTokensTestMock,
      },
      async ({ driver }) => {
        await login(driver, { validateBalance: false });

        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);
        await homePage.checkPageIsLoaded();
        await assetListPage.importMultipleTokensBySearch([
          'CHAIN',
          'CHANGE',
          'CHAI',
        ]);

        const tokenList = new AssetListPage(driver);

        // Native Tokens: Ethereum ETH, Linea ETH, Base ETH
        // ERC20 Tokens: Chain Games, Chai, ChangeX
        await tokenList.checkTokenItemNumber(6);
        await tokenList.checkTokenExistsInList('Ethereum');
        await tokenList.checkTokenExistsInList('Chain Games');
        await tokenList.checkTokenExistsInList('ChangeX');
        await tokenList.checkTokenExistsInList('Chai');
      },
    );
  });

  it('allows importing using contract address and not current network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
              [CHAIN_IDS.POLYGON]: true,
              [CHAIN_IDS.LINEA_MAINNET]: true,
              [CHAIN_IDS.BASE]: true,
            },
          })
          .withTokenListController({
            tokensChainsCache: {
              '0x1': {
                timestamp: Date.now(),
                data: {
                  '0x0a0e3bfd5a8ce610e735d4469bc1b3b130402267': {
                    name: 'Entropy',
                    aggregators: ['Lifi', 'Coinmarketcap', 'Rango'],
                    address: '0x0a0e3bfd5a8ce610e735d4469bc1b3b130402267',
                    decimals: 18,
                    iconUrl:
                      'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0a0e3bfd5a8ce610e735d4469bc1b3b130402267.png',
                    occurrences: 1,
                    symbol: 'ERP',
                  },
                },
              },
              '0x89': {
                timestamp: Date.now(),
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
          .withAssetsController({
            assetsBalance: {
              'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4': {
                'eip155:1/slip44:60': { amount: '25' },
                'eip155:59144/slip44:60': { amount: '25' },
              },
            },
            assetsPrice: getMockAssetsPrice(ETH_CONVERSION_RATE_USD),
            assetsInfo: {
              'eip155:1/slip44:60': {
                type: 'native',
                decimals: 18,
                symbol: 'ETH',
                name: 'Ethereum',
              },
              'eip155:59144/slip44:60': {
                type: 'native',
                decimals: 18,
                symbol: 'ETH',
                name: 'Ethereum',
              },
              'eip155:8453/slip44:60': {
                type: 'native',
                decimals: 18,
                symbol: 'ETH',
                name: 'Ethereum',
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: importTokensTestMock,
      },
      async ({ driver }) => {
        await login(driver, { validateBalance: false });

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

        await tokenList.checkTokenExistsInList('Ether');
        await tokenList.checkTokenExistsInList('USDT');
        await tokenList.checkTokenExistsInList('POL');
      },
    );
  });
});
