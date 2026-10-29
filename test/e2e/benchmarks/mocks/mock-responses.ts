import { PRICES, POWER_USER_PRICES, type PriceData } from './price-data';

export function jsonRpcResponse(result: unknown) {
  return {
    statusCode: 200,
    json: { jsonrpc: '2.0', id: 1, result },
  };
}

function buildFullMarketData(
  assetId: string,
  price: number,
  marketCap: number,
) {
  return {
    id: assetId,
    price,
    marketCap,
    allTimeHigh: price * 1.5,
    allTimeLow: price * 0.1,
    totalVolume: marketCap * 0.1,
    high1d: price * 1.02,
    low1d: price * 0.98,
    circulatingSupply: marketCap / price,
    dilutedMarketCap: marketCap * 1.2,
    marketCapPercentChange1d: 2.5,
    priceChange1d: price * 0.025,
    pricePercentChange1h: 0.5,
    pricePercentChange1d: 2.5,
    pricePercentChange7d: 5.0,
    pricePercentChange14d: 8.0,
    pricePercentChange30d: 12.0,
    pricePercentChange200d: 50.0,
    pricePercentChange1y: 100.0,
  };
}

/**
 * Builds spot prices response from requested asset IDs in the URL.
 * Parses assetIds, vsCurrency, and includeMarketData from query params.
 *
 * @param url
 * @param priceMap
 */
export function buildSpotPricesResponse(
  url: string,
  priceMap: Record<string, PriceData> = POWER_USER_PRICES,
): { statusCode: number; json: Record<string, unknown> } {
  try {
    const urlObj = new URL(url);
    const assetIdsParam = urlObj.searchParams.get('assetIds') || '';
    const includeMarketData =
      urlObj.searchParams.get('includeMarketData') === 'true';
    const vsCurrency = urlObj.searchParams.get('vsCurrency');
    const assetIds = assetIdsParam
      .split(',')
      .map((id) => {
        try {
          return decodeURIComponent(id);
        } catch {
          return id;
        }
      })
      .filter((id) => id.length > 0);

    const prices: Record<string, unknown> = {};

    if (assetIds.length > 0) {
      for (const assetId of assetIds) {
        const priceData =
          priceMap[assetId] ||
          priceMap[assetId.toLowerCase()] ||
          priceMap[assetId.replace(/%3A/giu, ':').replace(/%2F/giu, '/')];

        const price = priceData?.price ?? 1.0;
        const marketCapVal = priceData?.marketCap ?? 1_000_000;

        if (vsCurrency) {
          prices[assetId] = includeMarketData
            ? buildFullMarketData(assetId, price, marketCapVal)
            : { [vsCurrency]: price, [`${vsCurrency}_24h_change`]: 2.5 };
        } else {
          prices[assetId] = includeMarketData
            ? buildFullMarketData(assetId, price, marketCapVal)
            : {
                id: assetId,
                price,
                marketCap: marketCapVal,
                pricePercentChange1d: 2.5,
              };
        }
      }
    } else {
      for (const [key, value] of Object.entries(priceMap)) {
        if (vsCurrency) {
          prices[key] = {
            [vsCurrency]: value.price,
            [`${vsCurrency}_24h_change`]: 2.5,
          };
        } else {
          prices[key] = includeMarketData
            ? buildFullMarketData(key, value.price, value.marketCap)
            : {
                id: key,
                price: value.price,
                marketCap: value.marketCap,
                pricePercentChange1d: 2.5,
              };
        }
      }
    }

    return { statusCode: 200, json: prices };
  } catch {
    const prices: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(priceMap)) {
      prices[key] = {
        id: key,
        price: value.price,
        marketCap: value.marketCap,
        pricePercentChange1d: 2.5,
      };
    }
    return { statusCode: 200, json: prices };
  }
}

/** Builds 7 days of hourly historical price data */
export function buildHistoricalPricesResponse(): {
  statusCode: number;
  json: { prices: [number, number][] };
} {
  const now = Date.now();
  const prices: [number, number][] = [];
  for (let i = 0; i < 168; i++) {
    prices.push([now - i * 3600000, 1.0 + Math.random() * 0.02 - 0.01]);
  }
  return { statusCode: 200, json: { prices } };
}

/**
 * Returns a cryptocompare single-price response based on the requested symbol
 *
 * @param url
 */
export function buildCryptocomparePrice(url: string) {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('fsym=sol')) {
    return { statusCode: 200, json: { USD: PRICES.SOL } };
  }
  if (lowerUrl.includes('fsym=btc')) {
    return { statusCode: 200, json: { USD: PRICES.BTC } };
  }
  return { statusCode: 200, json: { USD: PRICES.ETH } };
}

export const FIAT_EXCHANGE_RATES = {
  statusCode: 200,
  json: {
    usd: 1,
    eur: 0.92,
    gbp: 0.79,
    jpy: 149.5,
    cny: 7.24,
    krw: 1320,
    inr: 83.12,
    aud: 1.53,
    cad: 1.36,
    chf: 0.88,
  },
} as const;

export const CRYPTO_EXCHANGE_RATES = {
  statusCode: 200,
  json: {
    eth: {
      name: 'Ether',
      ticker: 'eth',
      value: 1 / PRICES.ETH,
      currencyType: 'crypto',
    },
    usd: {
      name: 'US Dollar',
      ticker: 'usd',
      value: 1,
      currencyType: 'fiat',
    },
    btc: {
      name: 'Bitcoin',
      ticker: 'btc',
      value: 1 / PRICES.BTC,
      currencyType: 'crypto',
    },
    sol: {
      name: 'Solana',
      ticker: 'sol',
      value: 1 / PRICES.SOL,
      currencyType: 'crypto',
    },
  },
};

export const SUPPORTED_VS_CURRENCIES = {
  statusCode: 200,
  json: ['usd', 'eur', 'gbp', 'jpy', 'cny', 'krw', 'inr', 'aud', 'cad', 'chf'],
};

export const SUPPORTED_NETWORKS = {
  statusCode: 200,
  json: [1, 10, 137, 42161, 8453, 59144, 56, 43114, 324],
};

export const BITCOIN_SPOT_PRICES = {
  statusCode: 200,
  json: { bitcoin: { usd: PRICES.BTC } },
};

export const SOLANA_SPOT_PRICES = {
  statusCode: 200,
  json: {
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
      id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
      price: PRICES.SOL,
      marketCap: 70_000_000_000,
      pricePercentChange1d: 2.5,
    },
  },
};

export const CRYPTOCOMPARE_MULTI_PRICES = {
  statusCode: 200,
  json: {
    BTC: { USD: PRICES.BTC },
    SOL: { USD: PRICES.SOL },
    ETH: { USD: PRICES.ETH },
  },
};

export const PHISHING_DETECTION = {
  statusCode: 200,
  json: {
    blocklist: [],
    fuzzylist: [],
    allowlist: [],
    c2DomainBlocklist: [],
  },
};

export const SUBSCRIPTION_ELIGIBILITY = {
  statusCode: 200,
  json: [
    {
      canSubscribe: true,
      canViewEntryModal: true,
      minBalanceUSD: 1000,
      product: 'shield',
    },
  ],
};

const BRIDGE_CHAINS = {
  '1': { isActiveSrc: true, isActiveDest: true },
  '10': { isActiveSrc: true, isActiveDest: true },
  '137': { isActiveSrc: true, isActiveDest: true },
  '42161': { isActiveSrc: true, isActiveDest: true },
  '8453': { isActiveSrc: true, isActiveDest: true },
  '59144': { isActiveSrc: true, isActiveDest: true },
  '1151111081099710': { isActiveSrc: true, isActiveDest: true },
};

export const BRIDGE_FEATURE_FLAGS = {
  statusCode: 200,
  json: {
    'extension-config': {
      refreshRate: 30000,
      maxRefreshCount: 5,
      support: true,
      chains: BRIDGE_CHAINS,
    },
  },
};

export const CLIENT_CONFIG_FLAGS = {
  statusCode: 200,
  json: [
    {
      bridgeConfig: {
        refreshRate: 30000,
        maxRefreshCount: 5,
        support: true,
        sse: { enabled: true, minimumVersion: '13.2.0' },
        chains: BRIDGE_CHAINS,
      },
    },
  ],
};

export const SECURITY_ALERTS = {
  statusCode: 200,
  json: {
    resultType: 'Benign',
    reason: '',
    description: '',
    features: [],
  },
};

export const SUGGESTED_GAS_FEES = {
  statusCode: 200,
  json: {
    low: {
      suggestedMaxPriorityFeePerGas: '0.05',
      suggestedMaxFeePerGas: '15',
      minWaitTimeEstimate: 15000,
      maxWaitTimeEstimate: 30000,
    },
    medium: {
      suggestedMaxPriorityFeePerGas: '0.1',
      suggestedMaxFeePerGas: '20',
      minWaitTimeEstimate: 10000,
      maxWaitTimeEstimate: 20000,
    },
    high: {
      suggestedMaxPriorityFeePerGas: '0.2',
      suggestedMaxFeePerGas: '25',
      minWaitTimeEstimate: 5000,
      maxWaitTimeEstimate: 10000,
    },
    estimatedBaseFee: '14',
    networkCongestion: 0.5,
    latestPriorityFeeRange: ['0.01', '1'],
    historicalPriorityFeeRange: ['0.01', '5'],
    historicalBaseFeeRange: ['10', '20'],
    priorityFeeTrend: 'up',
    baseFeeTrend: 'down',
  },
};

export const GAS_PRICES = {
  statusCode: 200,
  json: {
    SafeGasPrice: '30',
    ProposeGasPrice: '30',
    FastGasPrice: '30',
  },
};

export const TOP_ASSETS = {
  statusCode: 200,
  json: [
    { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH' },
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC' },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT' },
    { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI' },
  ],
};

export const AGGREGATOR_METADATA = {
  statusCode: 200,
  json: {
    lifi: {
      title: 'LiFi',
      icon: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    },
    socket: {
      title: 'Socket',
      icon: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    },
  },
};

export const ACCOUNTS_TRANSACTIONS = {
  statusCode: 200,
  json: {
    transactions: [],
    pagination: { next: null, prev: null },
  },
};

export const ACCOUNTS_BALANCES = {
  statusCode: 200,
  json: {
    balances: [
      {
        address: '0x0000000000000000000000000000000000000000',
        balance: '1000000000000000000',
      },
    ],
  },
};

/** 50 SOL in lamports (1 SOL = 1,000,000,000 lamports) */
const SOL_BALANCE_LAMPORTS = 50_000_000_000;

export function solanaGetBalanceResponse(id: string | number = '1337') {
  return {
    statusCode: 200,
    json: {
      id,
      jsonrpc: '2.0',
      result: {
        context: { apiVersion: '2.0.18', slot: 308460925 },
        value: SOL_BALANCE_LAMPORTS,
      },
    },
  };
}

export function solanaGetAccountInfoResponse(id: string | number = '1337') {
  return {
    statusCode: 200,
    json: {
      id,
      jsonrpc: '2.0',
      result: {
        context: { apiVersion: '2.0.21', slot: 317161313 },
        value: {
          data: ['', 'base58'],
          executable: false,
          lamports: SOL_BALANCE_LAMPORTS,
          owner: '11111111111111111111111111111111',
          rentEpoch: Number.MAX_SAFE_INTEGER,
          space: 0,
        },
      },
    },
  };
}

export const SOLANA_GET_LATEST_BLOCKHASH = {
  statusCode: 200,
  json: {
    id: '1337',
    jsonrpc: '2.0',
    result: {
      context: { apiVersion: '2.0.18', slot: 308460925 },
      value: {
        blockhash: '6E9FiVcuvavWyKTfYC7N9ezJWkNgJVQsroDTHvqApncg',
        lastValidBlockHeight: 341034515,
      },
    },
  },
};

export const SOLANA_GET_FEE_FOR_MESSAGE = {
  statusCode: 200,
  json: {
    id: '1337',
    jsonrpc: '2.0',
    result: { context: { slot: 5068 }, value: 5000 },
  },
};

export const SOLANA_GET_MIN_BALANCE_RENT_EXEMPTION = {
  statusCode: 200,
  json: {
    id: '1337',
    jsonrpc: '2.0',
    result: 890880,
  },
};

export const SOLANA_GET_TOKEN_ACCOUNTS_BY_OWNER = {
  statusCode: 200,
  json: {
    id: '1337',
    jsonrpc: '2.0',
    result: {
      context: { slot: 137568828 },
      value: [],
    },
  },
};

export const SOLANA_SIMULATE_TRANSACTION = {
  statusCode: 200,
  json: {
    id: '1337',
    jsonrpc: '2.0',
    result: {
      context: { apiVersion: '2.0.21', slot: 318191894 },
      value: {
        accounts: null,
        err: null,
        innerInstructions: null,
        logs: [
          'Program 11111111111111111111111111111111 invoke [1]',
          'Program 11111111111111111111111111111111 success',
        ],
        replacementBlockhash: {
          blockhash: '2xWVC3snr4U29m8Rhio9HMmPaYNAQPrRn1bXjB1BJFuM',
          lastValidBlockHeight: 296475563,
        },
        returnData: null,
        unitsConsumed: 150,
      },
    },
  },
};

export const SOLANA_GET_SIGNATURES_FOR_ADDRESS = {
  statusCode: 200,
  json: {
    id: '1337',
    jsonrpc: '2.0',
    result: [],
  },
};

export function solanaCatchAllResponse(id: string | number = '1337') {
  return {
    statusCode: 200,
    json: {
      id,
      jsonrpc: '2.0',
      result: { context: { slot: 250000000 }, value: null },
    },
  };
}
