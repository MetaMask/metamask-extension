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
