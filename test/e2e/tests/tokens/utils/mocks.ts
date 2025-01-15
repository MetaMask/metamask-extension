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
