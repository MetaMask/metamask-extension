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

export async function mockPriceApi(mockServer: Mockttp) {
  const spotPricesMockEth = await mockServer
    .forGet(/^https:\/\/price\.api\.cx\.metamask\.io\/v3\/spot-prices/u)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        'eip155:1/slip44:60': {
          id: 'ethereum',
          price: 1,
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
    const entry = {
      price: ethPrice,
      marketCap: 382623505141,
      pricePercentChange1d: 0,
    };
    // Chain 1337 (0x539 / localhost): native CAIP is slip44:1 per nativeAssetIdentifiers
    // and test/e2e/mock-e2e.js. Other EVM chains use slip44:60 for ETH.
    if (dec === 1337) {
      spotEntries[`eip155:${dec}/slip44:1`] = entry;
      spotEntries[`eip155:${dec}/slip44:60`] = { ...entry };
    } else {
      spotEntries[`eip155:${dec}/slip44:60`] = entry;
    }
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
