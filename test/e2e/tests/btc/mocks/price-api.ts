import { Mockttp } from 'mockttp';
import { DEFAULT_BTC_CONVERSION_RATE } from '../../../constants';

const PRICE_API_URL = 'https://price.api.cx.metamask.io';

export const mockCurrencyExchangeRates = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${PRICE_API_URL}/v1/exchange-rates`)
    .withQuery({
      baseCurrency: 'usd',
    })
    .thenJson(200, {
      btc: {
        name: 'Bitcoin',
        ticker: 'btc',
        value: 0.0000108733338912803,
        currencyType: 'crypto',
      },
      eth: {
        name: 'Ether',
        ticker: 'eth',
        value: 0.000319654269735859,
        currencyType: 'crypto',
      },
      usd: {
        name: 'US Dollar',
        ticker: 'usd',
        value: 1,
        currencyType: 'fiat',
      },
      eur: {
        name: 'Euro',
        ticker: 'eur',
        value: 0.85707100459917,
        currencyType: 'fiat',
      },
    });

export const mockFiatExchangeRates = (mockServer: Mockttp) =>
  mockServer.forGet(`${PRICE_API_URL}/v1/exchange-rates/fiat`).thenJson(200, {
    usd: {
      name: 'US Dollar',
      ticker: 'usd',
      value: 1,
      currencyType: 'fiat',
    },
    eur: {
      name: 'Euro',
      ticker: 'eur',
      value: 0.857113000723512,
      currencyType: 'fiat',
    },
    gbp: {
      name: 'British Pound Sterling',
      ticker: 'gbp',
      value: 0.742282005695906,
      currencyType: 'fiat',
    },
    jpy: {
      name: 'Japanese Yen',
      ticker: 'jpy',
      value: 158.871251486357,
      currencyType: 'fiat',
    },
    cad: {
      name: 'Canadian Dollar',
      ticker: 'cad',
      value: 1.38828300232555,
      currencyType: 'fiat',
    },
  });

export const mockExchangeRates = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${PRICE_API_URL}/v1/spot-prices/bitcoin`)
    .withQuery({
      vsCurrency: 'usd',
    })
    .thenJson(200, {
      id: 'bitcoin',
      price: DEFAULT_BTC_CONVERSION_RATE,
      marketCap: 1836592437357,
      allTimeHigh: 126080,
      allTimeLow: 67.81,
      totalVolume: 45216146754,
      high1d: 92435,
      low1d: 90129,
      circulatingSupply: 19975290,
      dilutedMarketCap: 1836592437357,
      marketCapPercentChange1d: 1.72888,
      priceChange1d: 1535.29,
      pricePercentChange1h: -0.09840133404969334,
      pricePercentChange1d: 1.6980683447716627,
      pricePercentChange7d: -1.6285705945180806,
      pricePercentChange14d: 4.795747124043681,
      pricePercentChange30d: 2.1388997840239408,
      pricePercentChange200d: -14.088182161660676,
      pricePercentChange1y: -1.0484081200296924,
    });

// Mock para precios de Solana (usado cuando se tienen cuentas multichain habilitadas)
export const mockSolanaSpotPrices = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${PRICE_API_URL}/v3/spot-prices`)
    .withQuery({
      vsCurrency: 'usd',
      assetIds:
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501,solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/slip44:501',
      includeMarketData: 'true',
    })
    .thenJson(200, {
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
        id: 'solana',
        price: 144.79,
        marketCap: 81850220844,
        allTimeHigh: 293.31,
        allTimeLow: 0.500801,
        totalVolume: 7680099194,
        high1d: 147.08,
        low1d: 140.57,
        circulatingSupply: 565201039.9002427,
        dilutedMarketCap: 89529368319,
        marketCapPercentChange1d: 3.02678,
        priceChange1d: 4.23,
        pricePercentChange1h: 0.20259102989009956,
        pricePercentChange1d: 3.0070132766913273,
        pricePercentChange7d: 4.284782829913777,
        pricePercentChange14d: 15.149184041598888,
        pricePercentChange30d: 9.262763662422305,
        pricePercentChange200d: 0.0639022122733646,
        pricePercentChange1y: -22.35901619638736,
      },
      'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/slip44:501': null,
    });

// USD spot prices keyed by CAIP-19 asset id for the assets involved in BTC swaps.
const BTC_SWAP_SPOT_PRICES_USD: Record<string, number> = {
  // BTC (native)
  'bip122:000000000019d6689c085ae165831e93/slip44:0':
    DEFAULT_BTC_CONVERSION_RATE,
  // ETH (native) — destination for BTC → ETH
  'eip155:1/slip44:60': 3000,
  // USDC — destination for BTC → USDC
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 1,
};

// Rich market-data payload for BTC, consumed by the assets controller when it
// requests `includeMarketData=true`.
const BTC_MARKET_DATA = {
  id: 'bitcoin',
  price: DEFAULT_BTC_CONVERSION_RATE,
  marketCap: 1836592437357,
  allTimeHigh: 126080,
  allTimeLow: 67.81,
  totalVolume: 45216146754,
  high1d: 92435,
  low1d: 90129,
  circulatingSupply: 19975290,
  dilutedMarketCap: 1836592437357,
  marketCapPercentChange1d: 1.72888,
  priceChange1d: 1535.29,
  pricePercentChange1h: -0.09840133404969334,
  pricePercentChange1d: 1.6980683447716627,
  pricePercentChange7d: -1.6285705945180806,
  pricePercentChange14d: 4.795747124043681,
  pricePercentChange30d: 2.1388997840239408,
  pricePercentChange200d: -14.088182161660676,
  pricePercentChange1y: -1.0484081200296924,
};

const BTC_ASSET_ID = 'bip122:000000000019d6689c085ae165831e93/slip44:0';

/**
 * Mock for the v3 spot-prices endpoint used across BTC swap flows.
 *
 * The real API returns two different shapes depending on `includeMarketData`.
 * With `includeMarketData=true` (assets controller) it returns a rich
 * market-data object keyed by asset id (`{ id, price, marketCap, ... }`).
 * Otherwise (bridge controller `fetchAssetPrices`) it returns prices keyed by
 * the requested currency (`{ [assetId]: { usd: <price> } }`).
 *
 * Returning only the market-data shape breaks the bridge controller's price
 * parser, leaving the BTC exchange rate empty so the non-EVM network fee has no
 * fiat value and the `network-fees` row never renders. Mirror the real API by
 * branching on `includeMarketData`.
 *
 * @param mockServer - The Mockttp server instance.
 */
export const mockBtcSpotPrices = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${PRICE_API_URL}/v3/spot-prices`)
    .always()
    .thenCallback((request) => {
      const url = new URL(request.url);
      const vsCurrency =
        url.searchParams.get('vsCurrency')?.toLowerCase() ?? 'usd';
      const includeMarketData =
        url.searchParams.get('includeMarketData') === 'true';
      const requestedAssetIds = (url.searchParams.get('assetIds') ?? '')
        .split(',')
        .map((assetId) => assetId.trim())
        .filter(Boolean);
      const assetIdsToReturn =
        requestedAssetIds.length > 0
          ? requestedAssetIds
          : Object.keys(BTC_SWAP_SPOT_PRICES_USD);

      if (includeMarketData) {
        const json: Record<string, unknown> = {};
        for (const assetId of assetIdsToReturn) {
          if (assetId === BTC_ASSET_ID) {
            json[assetId] = BTC_MARKET_DATA;
          } else if (BTC_SWAP_SPOT_PRICES_USD[assetId] !== undefined) {
            json[assetId] = {
              assetPriceType: 'fungible',
              id: assetId,
              price: BTC_SWAP_SPOT_PRICES_USD[assetId],
              pricePercentChange1d: 0.1,
            };
          }
        }
        return { statusCode: 200, json };
      }

      // Without `includeMarketData` the API answers with prices keyed by the
      // requested currency, which is the shape the bridge controller parses.
      const json: Record<string, Record<string, number>> = {};
      for (const assetId of assetIdsToReturn) {
        const price = BTC_SWAP_SPOT_PRICES_USD[assetId];
        if (price !== undefined) {
          json[assetId] = { [vsCurrency]: price };
        }
      }
      return { statusCode: 200, json };
    });

// Mock for supported vs currencies (main currencies only)
export const mockSupportedVsCurrencies = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${PRICE_API_URL}/v1/supportedVsCurrencies`)
    .thenJson(200, [
      'btc',
      'eth',
      'usd',
      'eur',
      'gbp',
      'jpy',
      'cad',
      'aud',
      'chf',
      'cny',
    ]);

// Mock for price API supported networks (/v2/supportedNetworks)
export const mockPriceApiSupportedNetworks = (mockServer: Mockttp) =>
  mockServer.forGet(`${PRICE_API_URL}/v2/supportedNetworks`).thenJson(200, {
    fullSupport: [
      'eip155:1',
      'eip155:10',
      'eip155:56',
      'eip155:100',
      'eip155:137',
      'eip155:250',
      'eip155:324',
      'eip155:8453',
      'eip155:42161',
      'eip155:43114',
      'eip155:59144',
    ],
    partialSupport: {
      spotPricesV2: [
        'eip155:1284',
        'eip155:1285',
        'eip155:42220',
        'eip155:534352',
        'eip155:81457',
        'eip155:1313161554',
        'eip155:1666600000',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        'bip122:000000000019d6689c085ae165831e93',
        'tron:728126428',
      ],
      spotPricesV3: [
        'eip155:1284',
        'eip155:1285',
        'eip155:42220',
        'eip155:534352',
        'eip155:81457',
        'eip155:1313161554',
        'eip155:1666600000',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        'bip122:000000000019d6689c085ae165831e93',
        'tron:728126428',
      ],
    },
  });
