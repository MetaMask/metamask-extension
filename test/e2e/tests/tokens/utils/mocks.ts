import { Mockttp } from 'mockttp';
import { toChecksumHexAddress } from '../../../../../shared/lib/hexstring-utils';
import { DEFAULT_FIXTURE_ACCOUNT_ID } from '../../../constants';

const PRICE_API_URL = 'https://price.api.cx.metamask.io';
const TOKENS_API_URL = 'https://tokens.api.cx.metamask.io';
const TOKEN_API_URL = 'https://token.api.cx.metamask.io';
const NATIVE_ASSET_ID_BY_CHAIN_ID: Record<number, string> = {
  1: 'eip155:1/slip44:60',
  56: 'eip155:56/slip44:714',
};

/**
 * The ETH-to-USD conversion rate used by {@link mockPriceApi}.
 * Fixtures that rely on this mock must seed CurrencyController with the same
 * value to avoid race conditions between the initial render and the mock
 * response arriving.
 */
export const MOCK_ETH_CONVERSION_RATE = 3401;

type MockTokenMetadata = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId?: number;
  balance?: string;
};

const DEFAULT_MAINNET_TEST_TOKEN: MockTokenMetadata = {
  address: '0x2EFA2Cb29C2341d8E5Ba7D3262C9e9d6f1Bf3711',
  symbol: 'foo',
  name: 'foo',
  decimals: 18,
  chainId: 1,
};

const getPriceUrl = (version: string, chainId: string, endpoint: string) =>
  `${PRICE_API_URL}/${version}/chains/${chainId}/${endpoint}`;

export const mockEmptyPrices = async (mockServer: Mockttp) => {
  return mockServer
    .forGet(`${PRICE_API_URL}/v3/spot-prices`)
    .thenCallback(() => ({
      statusCode: 200,
      json: {},
    }));
};

/**
 * Mocks token metadata APIs used by custom token import and Token Management.
 *
 * @param mockServer - Mockttp instance.
 * @param tokens - ERC-20 token metadata to expose from both token metadata APIs.
 * @param options0
 * @param options0.includeAssetsV3
 */
export async function mockTokenMetadataApis(
  mockServer: Mockttp,
  tokens: MockTokenMetadata[] = [DEFAULT_MAINNET_TEST_TOKEN],
  { includeAssetsV3 = true }: { includeAssetsV3?: boolean } = {},
) {
  const normalizedTokens = tokens.map((token) => ({
    ...token,
    address: token.address.toLowerCase(),
    chainId: token.chainId ?? 1,
  }));

  const assetsV3Mock = includeAssetsV3
    ? [
        await mockServer
          .forGet(new RegExp(`${TOKENS_API_URL}/v3/assets`, 'u'))
          .always()
          .thenCallback((request) => {
            const url = new URL(request.url);
            const assetIds = url.searchParams
              .getAll('assetIds')
              .join(',')
              .toLowerCase();

            const results = [
              ...(assetIds.includes('eip155:1')
                ? [
                    {
                      assetId: 'eip155:1/slip44:60',
                      name: 'Ethereum',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                  ]
                : []),
              ...normalizedTokens
                .filter((token) => {
                  const assetId = `eip155:${token.chainId}/erc20:${token.address}`;
                  return (
                    assetIds.includes(assetId) ||
                    assetIds.includes(token.address)
                  );
                })
                .map((token) => ({
                  assetId: `eip155:${token.chainId}/erc20:${token.address}`,
                  name: token.name,
                  symbol: token.symbol,
                  decimals: token.decimals,
                })),
            ];

            return { statusCode: 200, json: results };
          }),
      ]
    : [];

  const tokenListMocks = await Promise.all(
    [...new Set(normalizedTokens.map((token) => token.chainId))].map(
      async (chainId) =>
        mockServer
          .forGet(
            new RegExp(`${TOKEN_API_URL}/tokens/${chainId}(\\?.*)?$`, 'u'),
          )
          .always()
          .thenCallback(() => ({
            statusCode: 200,
            json: normalizedTokens
              .filter((token) => token.chainId === chainId)
              .map((token) => ({
                address: token.address,
                symbol: token.symbol,
                decimals: token.decimals,
                name: token.name,
                iconUrl: '',
                type: 'erc20',
                aggregators: [],
                occurrences: 1,
                erc20Permit: false,
                storage: {},
                fees: {},
              })),
          })),
    ),
  );

  const accountBalancesMock = await mockServer
    .forGet(
      `${TOKEN_API_URL.replace('token.api', 'accounts.api')}/v4/multiaccount/balances`,
    )
    .always()
    .thenCallback((request) => {
      const url = new URL(request.url);
      const accountAddressesParam =
        url.searchParams.get('accountAddresses') ?? '';
      const accountAddresses = accountAddressesParam
        .split(',')
        .map((accountAddress) => accountAddress.trim())
        .filter(Boolean);

      const chainIds = [
        ...new Set(normalizedTokens.map((token) => token.chainId)),
      ];
      const balances = accountAddresses.flatMap((accountId) => [
        ...chainIds
          .map((chainId) => NATIVE_ASSET_ID_BY_CHAIN_ID[chainId])
          .filter(Boolean)
          .map((assetId) => ({
            accountId,
            accountAddress: accountId,
            assetId,
            balance: '25',
          })),
        ...normalizedTokens.map((token) => ({
          accountId,
          accountAddress: accountId,
          assetId: `eip155:${token.chainId}/erc20:${token.address}`,
          balance: token.balance ?? '0',
        })),
      ]);

      return {
        statusCode: 200,
        json: {
          count: balances.length,
          balances,
          unprocessedNetworks: [],
        },
      };
    });

  return [...assetsV3Mock, ...tokenListMocks, accountBalancesMock];
}

export const mockEmptyHistoricalPrices = async (
  mockServer: Mockttp,
  address: string,
  chainId: string,
) => {
  return mockServer
    .forGet(getPriceUrl('v1', chainId, `historical-prices/${address}`))
    .thenCallback(() => ({
      statusCode: 200,
      json: {},
    }));
};

export const mockSpotPrices = async (
  mockServer: Mockttp,
  prices: Record<
    string,
    { price: number; pricePercentChange1d?: number; marketCap: number }
  >,
) => {
  return mockServer
    .forGet(`${PRICE_API_URL}/v3/spot-prices`)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: prices,
    }));
};

/**
 * Mocks Price API v3 spot-prices (native ETH for the given chain) and v1 exchange-rates.
 *
 * @param mockServer - Mockttp instance.
 * @param ethPrice - Spot price for native ETH on that chain (USD). Defaults to `MOCK_ETH_CONVERSION_RATE` when assets-unify is enabled, `1` otherwise.
 * @param chainId - EVM chain id in hex (e.g. `0x1`, `0x539`); used to build `eip155:<n>/slip44:60`.
 */
export async function mockPriceApi(
  mockServer: Mockttp,
  ethPrice?: number,
  chainId: `0x${string}` = '0x1',
) {
  const resolvedEthPrice = ethPrice ?? MOCK_ETH_CONVERSION_RATE;
  const chainIdDecimal = Number.parseInt(chainId, 16);
  const nativeAssetId = `eip155:${chainIdDecimal}/slip44:60`;

  const spotPricesMockEth = await mockServer
    .forGet(/^https:\/\/price\.api\.cx\.metamask\.io\/v3\/spot-prices/u)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        [nativeAssetId]: {
          id: 'ethereum',
          price: resolvedEthPrice,
          marketCap: 112500000,
          totalVolume: 4500000,
          dilutedMarketCap: 120000000,
          pricePercentChange1d: 0,
        },
      },
    }));
  const mockExchangeRates = await mockServer
    .forGet('https://price.api.cx.metamask.io/v1/exchange-rates')
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        eth: {
          name: 'Ether',
          ticker: 'eth',
          value: 1 / MOCK_ETH_CONVERSION_RATE,
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

/**
 * Mock both spot-prices and exchange-rates at the given ETH/USD price.
 *
 * @param mockServer - Mockttp instance.
 * @param ethPrice - ETH price in USD to use for both APIs.
 * @param chainIds - Hex chain ids to include in spot-prices (defaults to mainnet + localhost).
 */
export async function mockEthPrices(
  mockServer: Mockttp,
  ethPrice: number,
  chainIds: `0x${string}`[] = ['0x1', '0x539'],
) {
  const spotEntries: Record<
    string,
    { price: number; marketCap: number; pricePercentChange1d: number }
  > = {};
  for (const cid of chainIds) {
    const dec = Number.parseInt(cid, 16);
    spotEntries[`eip155:${dec}/slip44:60`] = {
      price: ethPrice,
      marketCap: 382623505141,
      pricePercentChange1d: 0,
    };
  }

  await mockSpotPrices(mockServer, spotEntries);

  await mockServer
    .forGet('https://price.api.cx.metamask.io/v1/exchange-rates')
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        eth: {
          name: 'Ether',
          ticker: 'eth',
          value: 1 / ethPrice,
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

type HistoricalPricesOptions = {
  address: string;
  chainId: string;
  historicalPrices?: {
    timestamp: number;
    price: number;
  }[];
};

export const mockHistoricalPrices = async (
  mockServer: Mockttp,
  { address, chainId, historicalPrices }: HistoricalPricesOptions,
) => {
  return mockServer
    .forGet(
      getPriceUrl(
        'v1',
        chainId,
        `historical-prices/${toChecksumHexAddress(address)}`,
      ),
    )
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        prices: historicalPrices,
      },
    }));
};

const ETH_ASSET_PRICE_ENTRY = (ethConversionRate: number) => ({
  allTimeHigh: 4946.05,
  allTimeLow: 0.432979,
  assetPriceType: 'fungible' as const,
  circulatingSupply: 120691953.6332311,
  dilutedMarketCap: 254092339264,
  high1d: 2200.03,
  id: 'ethereum',
  lastUpdated: 1773438429871,
  low1d: 2056.83,
  marketCap: 254092339264,
  marketCapPercentChange1d: 2.18596,
  price: ethConversionRate,
  priceChange1d: 43.82,
  pricePercentChange14d: 9.421731338592206,
  pricePercentChange1d: 2.126621077867312,
  pricePercentChange1h: -0.3841700831496128,
  pricePercentChange1y: 13.959581118344246,
  pricePercentChange200d: -51.8482496460765,
  pricePercentChange30d: 7.7834713430167195,
  pricePercentChange7d: 6.25337717882139,
  totalVolume: 29988506301,
  usdPrice: ethConversionRate,
});

export const getMockAssetsPrice = (
  ethConversionRate: number = MOCK_ETH_CONVERSION_RATE,
) => ({
  'eip155:1/slip44:60': ETH_ASSET_PRICE_ENTRY(ethConversionRate),
  'eip155:59144/slip44:60': ETH_ASSET_PRICE_ENTRY(ethConversionRate),
  'eip155:8453/slip44:60': ETH_ASSET_PRICE_ENTRY(ethConversionRate),
  'eip155:42161/slip44:60': ETH_ASSET_PRICE_ENTRY(ethConversionRate),
});

export const MAINNET_NATIVE_ASSET_ID = 'eip155:1/slip44:60';

export const LOCALHOST_NATIVE_ASSET_ID = 'eip155:1337/slip44:1';

export const DEFAULT_MAINNET_ETH_HUMAN_BALANCE = '25';

/**
 * Seeds AssetsController native balances for unified-assets E2E fixtures.
 *
 * @param conversionRate - ETH/USD rate used for {@link getMockAssetsPrice}.
 * @param accountId - Internal account id to seed (defaults to fixture account 1).
 * @param amount - Native ETH balance in human-readable units (defaults to 25).
 */
export const getMainnet25EthAssetsControllerPatch = (
  conversionRate: number = MOCK_ETH_CONVERSION_RATE,
  accountId: string = DEFAULT_FIXTURE_ACCOUNT_ID,
  amount: string = DEFAULT_MAINNET_ETH_HUMAN_BALANCE,
) => ({
  assetsBalance: {
    [accountId]: {
      [MAINNET_NATIVE_ASSET_ID]: { amount },
    },
  },
  assetsPrice: getMockAssetsPrice(conversionRate),
});

/**
 * Seeds localhost native ETH for unified-assets E2E fixtures on chain 1337.
 *
 * @param accountId - Internal account id to seed (defaults to fixture account 1).
 */
export const getLocalhost25EthAssetsControllerPatch = (
  accountId: string = DEFAULT_FIXTURE_ACCOUNT_ID,
) => ({
  assetsBalance: {
    [accountId]: {
      [LOCALHOST_NATIVE_ASSET_ID]: {
        amount: DEFAULT_MAINNET_ETH_HUMAN_BALANCE,
      },
    },
  },
});

/**
 * Mocks the v3 historical prices endpoint used by `useHistoricalPrices`.
 *
 * The v3 endpoint path is `/v3/historical-prices/{caipChainId}/{assetType}`,
 * e.g. `https://price.api.cx.metamask.io/v3/historical-prices/eip155:1/slip44:60`
 * for native ETH on mainnet.
 *
 * @param mockServer - Mockttp instance.
 * @param caipChainId - CAIP-2 chain id (e.g. `eip155:1`).
 * @param assetType - CAIP asset type segment (e.g. `slip44:60` or `erc20:0xABC…`).
 * @param prices - Price data points as `[timestamp, price]` tuples. Defaults to empty array.
 */
export const mockHistoricalPricesV3 = async (
  mockServer: Mockttp,
  caipChainId: string,
  assetType: string,
  prices: [number, number][] = [],
) => {
  return mockServer
    .forGet(`${PRICE_API_URL}/v3/historical-prices/${caipChainId}/${assetType}`)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: { prices },
    }));
};
