const { DEFAULT_BTC_CONVERSION_RATE } = require('../constants');
const fixtures = require('./api-fixtures.fixture.json');

/**
 * Copies `pin` onto `base`. Nested objects merge. Pin arrays and scalars win,
 * and fields the fixture gained from a shape sync are kept.
 *
 * @param {object} base - Fixture value.
 * @param {object} pin - Values tests assert.
 * @returns {object} The merged value.
 */
function overlay(base, pin) {
  if (pin && typeof pin === 'object' && !Array.isArray(pin)) {
    const source =
      base && typeof base === 'object' && !Array.isArray(base) ? base : {};
    const merged = { ...source };
    for (const [key, value] of Object.entries(pin)) {
      merged[key] = overlay(source[key], value);
    }
    return merged;
  }
  return pin;
}

const SUGGESTED_GAS_FEE_PIN = {
  low: {
    suggestedMaxPriorityFeePerGas: '1',
    suggestedMaxFeePerGas: '20.44436136',
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 30000,
  },
  medium: {
    suggestedMaxPriorityFeePerGas: '1.5',
    suggestedMaxFeePerGas: '25.80554517',
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 45000,
  },
  high: {
    suggestedMaxPriorityFeePerGas: '2',
    suggestedMaxFeePerGas: '27.277766977',
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 60000,
  },
  estimatedBaseFee: '19.444436136',
  networkCongestion: 0.14685,
  latestPriorityFeeRange: ['0.378818859', '6.555563864'],
  historicalPriorityFeeRange: ['0.1', '248.262969261'],
  historicalBaseFeeRange: ['14.146999781', '28.825256275'],
  priorityFeeTrend: 'down',
  baseFeeTrend: 'up',
};

const TOKEN_ASSET_PINS = [
  { assetId: 'eip155:1/slip44:60', name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  {
    assetId: 'eip155:11155111/slip44:60',
    name: 'Sepolia Ether',
    symbol: 'SepoliaETH',
    decimals: 18,
  },
  {
    assetId: 'eip155:11155111/erc20:0x0000000000000000000000000000000000000000',
    name: 'Sepolia Ether',
    symbol: 'SepoliaETH',
    decimals: 18,
  },
  { assetId: 'eip155:1337/slip44:1', name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  {
    assetId: 'eip155:143/slip44:268435779',
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
  {
    assetId: 'eip155:1/erc20:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
  },
  {
    assetId: 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
  },
  {
    assetId: 'eip155:1/erc20:0xdAC17F958D2ee523a2206206994597C13D831ec7',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
  },
  {
    assetId: 'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F',
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
  },
];

/**
 * Gas fee mock the bridge tests read by field.
 *
 * @typedef {object} MockSuggestedGasFees
 * @property {string} estimatedBaseFee - Base fee the bridge quote uses.
 * @property {{ suggestedMaxFeePerGas: string }} medium - Medium fee tier.
 */

/**
 * Fixture for one catalog id, with values the E2E tests assert re-applied.
 *
 * @param {string} id - Catalog id.
 * @returns {object} The fixture.
 */
function apiFixture(id) {
  const value = fixtures[id];
  switch (id) {
    case 'gas-prices':
      return { ...value, SafeGasPrice: '1', ProposeGasPrice: '2', FastGasPrice: '3' };
    case 'suggested-gas-fees':
      return overlay(value, SUGGESTED_GAS_FEE_PIN);
    case 'geolocation-v2':
      return { ...value, country: 'US', region: 'TX', timezone: 'America/Chicago' };
    case 'swaps-token':
      return {
        ...value,
        symbol: 'AGLT',
        type: 'erc20',
        decimals: '18',
        address: '0x72c9fb7ed19d3ce51cea5c56b3e023cd918baadf',
      };
    case 'price-v1-btc':
      return { ...value, id: 'bitcoin', price: DEFAULT_BTC_CONVERSION_RATE };
    case 'money-positions':
      return overlay(value, {
        balance: {
          musd_balance: '0',
          vmusd_value_in_musd: '0',
          total_balance: '0',
          by_asset: [],
          total_balance_usd: '0',
        },
        positions: [],
      });
    case 'sevenseas-performance':
      return overlay(value, { Response: { apy: 0.045 } });
    case '4byte-signatures':
      return {
        ...value,
        results: value.results.map((result, index) =>
          index === 0 ? { ...result, text_signature: 'deposit()' } : result,
        ),
      };
    case 'token-list':
      return value.map((token, index) =>
        index === 0
          ? {
              ...token,
              address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
              symbol: 'BAT',
              name: 'Basic Attention Token',
              decimals: 18,
            }
          : token,
      );
    case 'token-asset-templates':
      return value.map((token) => {
        const pin = TOKEN_ASSET_PINS.find((item) => item.assetId === token.assetId);
        return pin ? { ...token, ...pin, occurrences: 100 } : token;
      });
    case 'client-config-networks':
    case 'client-config-events':
      return overlay(value, { data: { version: '0', timestamp: 0 } });
    case 'accounts-transactions':
      return overlay(value, { data: [], pageInfo: { hasNextPage: false, count: 0 } });
    case 'tx-sentinel-network':
      return {
        ...value,
        chainID: 1,
        name: 'Mainnet',
        network: 'ethereum-mainnet',
        confirmations: true,
        smartTransactions: true,
      };
    case 'tx-sentinel-networks':
      return { ...value, 1: apiFixture('tx-sentinel-network') };
    default:
      return value;
  }
}

/** @type {MockSuggestedGasFees} */
const MOCK_SUGGESTED_GAS_FEES = apiFixture('suggested-gas-fees');

module.exports = {
  apiFixture,
  MOCK_SUGGESTED_GAS_FEES,
};
