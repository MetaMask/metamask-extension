import { Mockttp } from 'mockttp';
import { toChecksumHexAddress } from '../../../../../shared/modules/hexstring-utils';

const getPriceUrl = (version: string, chainId: string, endpoint: string) =>
  `https://price.api.cx.metamask.io/${version}/chains/${chainId}/${endpoint}`;

export const mockEmptyPrices = async (mockServer: Mockttp, chainId: string) => {
  return mockServer
    .forGet(getPriceUrl('v2', parseInt(chainId, 16).toString(), 'spot-prices'))
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
  chainIdToMock: string,
  prices: Record<
    string,
    { price: number; pricePercentChange1d?: number; marketCap: number }
  >,
) => {
  return mockServer
    .forGet(
      getPriceUrl('v2', parseInt(chainIdToMock, 16).toString(), 'spot-prices'),
    )
    .thenCallback(() => ({
      statusCode: 200,
      json: prices,
    }));
};

export async function mockPriceApi(mockServer: Mockttp) {
  const spotPricesMockEth = await mockServer
    .forGet(
      /^https:\/\/price\.api\.cx\.metamask\.io\/v2\/chains\/\d+\/spot-prices/u,
    )

    .thenCallback(() => ({
      statusCode: 200,
      json: {
        '0x0000000000000000000000000000000000000000': {
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
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        eth: {
          name: 'Ether',
          ticker: 'eth',
          value: 1 / 3401,
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
