import { Mockttp } from 'mockttp';
import { toChecksumHexAddress } from '../../../../../shared/lib/hexstring-utils';

const PRICE_API_URL = 'https://price.api.cx.metamask.io';

/**
 * The ETH-to-USD conversion rate used by {@link mockPriceApi}.
 * Fixtures that rely on this mock must seed CurrencyController with the same
 * value to avoid race conditions between the initial render and the mock
 * response arriving.
 */
export const MOCK_ETH_CONVERSION_RATE = 3401;

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
  const resolvedEthPrice =
    ethPrice ??
    (process.env.ASSETS_UNIFIED_STATE_ENABLED === 'true'
      ? MOCK_ETH_CONVERSION_RATE
      : 1);
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
