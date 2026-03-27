import { Mockttp, MockedEndpoint } from 'mockttp';
import { toChecksumHexAddress } from '../../../../../shared/lib/hexstring-utils';

const PRICE_API_URL = 'https://price.api.cx.metamask.io';

/** Mainnet native SOL CAIP asset id (Price API v3 `spot-prices`). */
export const SOLANA_MAINNET_NATIVE_ASSET_ID =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';

/** Mainnet USDC (mint) CAIP asset id for Solana swap / bridge E2E. */
export const SOLANA_MAINNET_USDC_ASSET_ID =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const V3_SPOT_PRICES_URL_PATTERN =
  /^https:\/\/price\.api\.cx\.metamask\.io\/v3\/spot-prices/u;

const PRICE_API_V2_SUPPORTED_NETWORKS_URL_PATTERN =
  /^https:\/\/price\.api\.cx\.metamask\.io\/v2\/supportedNetworks/u;

/**
 * Default JSON body for Price API `GET /v2/supportedNetworks` (CAIP chain IDs).
 *
 * Served from the same host as `/v3/spot-prices`. Includes non-EVM chains in
 * `fullSupport` so token metadata flows still see BTC / Solana / Tron; `eip155:25`
 * stays in `partialSupport` for bridge-style partial support.
 */
export const MOCK_PRICE_API_V2_SUPPORTED_NETWORKS = {
  fullSupport: [
    'bip122:000000000019d6689c085ae165831e93',
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    'tron:728126428',
    'eip155:1',
    'eip155:10',
    'eip155:56',
    'eip155:137',
    'eip155:1337',
    'eip155:42161',
    'eip155:8453',
  ],
  partialSupport: ['eip155:25'],
};

/**
 * Mocks Price API `GET /v2/supportedNetworks` (same base URL as spot-prices).
 *
 * Bridge and unified-assets code call this to know which chains have full vs partial
 * price support; token metadata paths use the same endpoint in current clients.
 *
 * @param mockServer - Mockttp instance.
 * @returns Mocked endpoint handle.
 */
export async function mockPriceApiV2SupportedNetworks(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(PRICE_API_V2_SUPPORTED_NETWORKS_URL_PATTERN)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: MOCK_PRICE_API_V2_SUPPORTED_NETWORKS,
    }));
}

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
 * @param ethPrice - Spot price for native ETH on that chain (USD).
 * @param chainId - EVM chain id in hex (e.g. `0x1`, `0x539`); used to build `eip155:<n>/slip44:60`.
 */
export async function mockPriceApi(
  mockServer: Mockttp,
  ethPrice: number = 1,
  chainId: `0x${string}` = '0x1',
) {
  const chainIdDecimal = Number.parseInt(chainId, 16);
  const nativeAssetId = `eip155:${chainIdDecimal}/slip44:60`;

  const spotPricesMockEth = await mockServer
    .forGet(V3_SPOT_PRICES_URL_PATTERN)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        [nativeAssetId]: {
          id: 'ethereum',
          price: ethPrice,
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
 * Mocks Price API v3 `spot-prices` for Solana mainnet native SOL and USDC (mainnet mint).
 *
 * Use when a test needs a configurable SOL USD price (e.g. Solana swap E2E). Registers
 * after other mocks so it can override default `mock-e2e` spot handlers for the same URL.
 *
 * Each asset includes `price` and `usd` so AssetsController / bridge flows that read
 * `vsCurrency` (typically `usd`) receive a rate.
 *
 * @param mockServer - Mockttp instance.
 * @param solPrice - Spot price for native SOL in USD.
 * @param usdcPrice - Spot price for USDC in USD (defaults to ~1).
 * @returns Mocked endpoint handle.
 */
export async function mockPriceApiSolana(
  mockServer: Mockttp,
  solPrice: number = 168.88,
  usdcPrice: number = 0.999761,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(V3_SPOT_PRICES_URL_PATTERN)
    .withQuery({ vsCurrency: 'usd' })
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        [SOLANA_MAINNET_USDC_ASSET_ID]: {
          id: 'usd-coin',
          price: usdcPrice,
          usd: usdcPrice,
          marketCap: 59878237545,
          totalVolume: 0,
          dilutedMarketCap: 59878237545,
          pricePercentChange1d: 0,
        },
        [SOLANA_MAINNET_NATIVE_ASSET_ID]: {
          id: 'solana',
          price: solPrice,
          usd: solPrice,
          marketCap: 58245152246,
          totalVolume: 6991628445,
          dilutedMarketCap: 67566552200,
          pricePercentChange1d: 0,
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
