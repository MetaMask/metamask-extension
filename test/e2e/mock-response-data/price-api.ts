import type {
  ApiConsumerTypes,
  PriceApiV3SpotPrice,
} from '../api-contracts/consumer-types';
import { DEFAULT_BTC_CONVERSION_RATE } from '../constants';

export const DEFAULT_ETH_USD_PRICE = 3010;

/** The live API also returns an `id`, which the wallet does not read. */
type SpotPriceMock = PriceApiV3SpotPrice & { id?: string };

const UNCHANGED_PRICE_PERCENTAGES = {
  marketCapPercentChange1d: 0,
  priceChange1d: 0,
  pricePercentChange1h: 0,
  pricePercentChange1d: 0,
  pricePercentChange7d: 0,
  pricePercentChange14d: 0,
  pricePercentChange30d: 0,
  pricePercentChange200d: 0,
  pricePercentChange1y: 0,
};

export const ETH_SPOT_PRICE: SpotPriceMock = {
  id: 'ethereum',
  price: DEFAULT_ETH_USD_PRICE,
  marketCap: 382623505141,
  dilutedMarketCap: 382623505141,
  circulatingSupply: 127117443,
  totalVolume: 16770757278,
  allTimeHigh: 4946.05,
  allTimeLow: 0.432979,
  high1d: DEFAULT_ETH_USD_PRICE,
  low1d: DEFAULT_ETH_USD_PRICE,
  ...UNCHANGED_PRICE_PERCENTAGES,
};

export const SOL_SPOT_PRICE: SpotPriceMock = {
  id: 'solana',
  price: 112.87,
  marketCap: 58245152246,
  allTimeHigh: 293.31,
  allTimeLow: 0.500801,
  totalVolume: 6991628445,
  high1d: 119.85,
  low1d: 105.87,
  circulatingSupply: 515615042.5147497,
  dilutedMarketCap: 67566552200,
  marketCapPercentChange1d: 6.43259,
  priceChange1d: 6.91,
  pricePercentChange1h: -0.10747351712871725,
  pricePercentChange1d: 6.517062579985171,
  pricePercentChange7d: -1.2651850097746231,
  pricePercentChange14d: -17.42211401987578,
  pricePercentChange30d: -7.317068682545842,
  pricePercentChange200d: -22.09390252653303,
  pricePercentChange1y: -31.856951873653344,
};

export const BTC_SPOT_PRICE: SpotPriceMock = {
  id: 'bitcoin',
  price: DEFAULT_BTC_CONVERSION_RATE,
  marketCap: 1910000000000,
  allTimeHigh: 124000,
  allTimeLow: 67.81,
  totalVolume: 45000000000,
  high1d: 96500,
  low1d: 94800,
  circulatingSupply: 19800000,
  dilutedMarketCap: 1910000000000,
  marketCapPercentChange1d: 0.5,
  priceChange1d: 120,
  pricePercentChange1h: 0.01,
  pricePercentChange1d: 0.12,
  pricePercentChange7d: 2.1,
  pricePercentChange14d: -1.2,
  pricePercentChange30d: 5.3,
  pricePercentChange200d: 40,
  pricePercentChange1y: 85,
};

type SpotPricesMock = {
  /** Exact `assetIds` query parameter the mock answers. */
  assetIds: string;
  response: Record<string, SpotPriceMock>;
};

/**
 * Default `/v3/spot-prices` responses, keyed by the exact `assetIds` query
 * the wallet sends for each native asset used in E2E fixtures.
 */
export const PRICE_API_V3_SPOT_PRICES_MOCKS: SpotPricesMock[] = [
  {
    assetIds: 'eip155:1/slip44:60',
    response: { 'eip155:1/slip44:60': ETH_SPOT_PRICE },
  },
  // TokenDataSource / Price API request Sepolia native as either slip44:60 or
  // the zero-address ERC-20 alias. Both must return the ETH fixture rate.
  {
    assetIds: 'eip155:11155111/slip44:60',
    response: { 'eip155:11155111/slip44:60': ETH_SPOT_PRICE },
  },
  {
    assetIds:
      'eip155:11155111/erc20:0x0000000000000000000000000000000000000000',
    response: {
      'eip155:11155111/erc20:0x0000000000000000000000000000000000000000':
        ETH_SPOT_PRICE,
      'eip155:11155111/slip44:60': ETH_SPOT_PRICE,
    },
  },
  // Localhost (chain 1337) native ETH — slip44:1 per nativeAssetIdentifiers in
  // fixtures. assets-unify requests this with cacheOnly=false; extra query
  // params are allowed by mockttp.
  {
    assetIds: 'eip155:1337/slip44:1',
    response: { 'eip155:1337/slip44:1': ETH_SPOT_PRICE },
  },
  // Monad native — slip44:268435779 (not ETH slip44:60).
  {
    assetIds: 'eip155:143/slip44:268435779',
    response: {
      'eip155:143/slip44:268435779': { ...ETH_SPOT_PRICE, id: 'monad' },
    },
  },
  // Native SOL + BTC (multichain portfolio / assets unify).
  {
    assetIds: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
    response: {
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': SOL_SPOT_PRICE,
    },
  },
  {
    assetIds: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
    response: {
      'bip122:000000000019d6689c085ae165831e93/slip44:0': BTC_SPOT_PRICE,
    },
  },
];

/**
 * Response for any `/v3/spot-prices` request no other mock answers: every
 * requested asset is known but worth nothing.
 *
 * @param assetIds - The requested CAIP asset IDs.
 * @returns The spot prices response.
 */
export function buildFallbackSpotPricesResponse(
  assetIds: string[],
): ApiConsumerTypes['priceApiV3SpotPrices'] {
  return Object.fromEntries(
    assetIds.map((assetId) => [
      assetId,
      {
        price: 0,
        marketCap: 0,
        dilutedMarketCap: 0,
        circulatingSupply: 0,
        totalVolume: 0,
        allTimeHigh: 0,
        allTimeLow: 0,
        high1d: 0,
        low1d: 0,
        ...UNCHANGED_PRICE_PERCENTAGES,
      },
    ]),
  );
}

// The price API client only caches the supported networks response when it
// contains both `fullSupport` and `partialSupport`; anything else makes it
// silently fall back to its hardcoded list without caching, so every later
// price fetch re-requests the endpoint. The lists below are that same
// hardcoded fallback (`SPOT_PRICES_SUPPORT_INFO` in @metamask/assets-controllers),
// so supported chains are unchanged and only the repeated requests go away.
const SPOT_PRICES_SUPPORTED_CHAINS = [
  'eip155:1',
  'eip155:10',
  'eip155:25',
  'eip155:30',
  'eip155:42',
  'eip155:50',
  'eip155:56',
  'eip155:57',
  'eip155:82',
  'eip155:88',
  'eip155:100',
  'eip155:106',
  'eip155:122',
  'eip155:128',
  'eip155:137',
  'eip155:143',
  'eip155:146',
  'eip155:196',
  'eip155:232',
  'eip155:250',
  'eip155:252',
  'eip155:288',
  'eip155:321',
  'eip155:324',
  'eip155:336',
  'eip155:361',
  'eip155:747',
  'eip155:988',
  'eip155:999',
  'eip155:1088',
  'eip155:1101',
  'eip155:1284',
  'eip155:1285',
  'eip155:1329',
  'eip155:1776',
  'eip155:1868',
  'eip155:2525',
  'eip155:2741',
  'eip155:4217',
  'eip155:4326',
  'eip155:5000',
  'eip155:5031',
  'eip155:5042',
  'eip155:7000',
  'eip155:8453',
  'eip155:4663',
  'eip155:9745',
  'eip155:10000',
  'eip155:33139',
  'eip155:41923',
  'eip155:42161',
  'eip155:42220',
  'eip155:42262',
  'eip155:42431',
  'eip155:42793',
  'eip155:43111',
  'eip155:43114',
  'eip155:57073',
  'eip155:59144',
  'eip155:60808',
  'eip155:68414',
  'eip155:73115',
  'eip155:80094',
  'eip155:81457',
  'eip155:88888',
  'eip155:97741',
  'eip155:98866',
  'eip155:167000',
  'eip155:333999',
  'eip155:534352',
  'eip155:747474',
  'eip155:984122',
  'eip155:1440000',
  'eip155:1313161554',
  'eip155:1666600000',
  'eip155:16661',
];

export const PRICE_API_V2_SUPPORTED_NETWORKS_RESPONSE: ApiConsumerTypes['priceApiV2SupportedNetworks'] =
  {
    fullSupport: SPOT_PRICES_SUPPORTED_CHAINS.slice(0, 11),
    partialSupport: {
      spotPricesV2: SPOT_PRICES_SUPPORTED_CHAINS,
      spotPricesV3: SPOT_PRICES_SUPPORTED_CHAINS,
    },
  };
