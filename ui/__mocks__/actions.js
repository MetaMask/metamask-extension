const actions = require('../store/actions');

const ERC20_TOKEN_1_MOCK = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'; // WBTC
const ERC20_TOKEN_2_MOCK = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'; // USDC
const TOKEN_DETAILS_MOCK = {
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
    if (!TOKEN_DETAILS_MOCK[address]) {
      return Promise.reject(new Error(`Token not found: ${address}`));
    }
    return Promise.resolve(TOKEN_DETAILS_MOCK[address]);
  },
  // eslint-disable-next-line no-empty-function
  trackMetaMetricsEvent: () => {},
};
