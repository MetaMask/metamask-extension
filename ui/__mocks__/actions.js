const actions = require('../store/actions');

const ERC20_TOKEN_1_MOCK = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'; // WBTC
const ERC20_TOKEN_2_MOCK = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC
const mockTokenDetails = {
  [ERC20_TOKEN_1_MOCK]: {
    address: ERC20_TOKEN_1_MOCK,
    standard: 'ERC20',
    decimals: 8,
    name: 'Wrapped Bitcoin',
  },
  [ERC20_TOKEN_2_MOCK]: {
    address: ERC20_TOKEN_2_MOCK,
    standard: 'ERC20',
    decimals: 6,
    name: 'USD Coin',
  },
};

module.exports = {
  ...actions,
  getTokenStandardAndDetails: (address) => {
    if (!mockTokenDetails[address]) {
      return Promise.reject(new Error('Token not found'));
    }
    return Promise.resolve(mockTokenDetails[address]);
  },
  // eslint-disable-next-line no-empty-function
  trackMetaMetricsEvent: () => {},
};
