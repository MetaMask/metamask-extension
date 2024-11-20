const actions = require('../store/actions');
const {
  CONTRACT_ADDRESS_UNISWAP,
  CONTRACT_ADDRESS_SOURCIFY,
  CONTRACT_ADDRESS_FOUR_BYTE,
  TRANSACTION_DECODE_UNISWAP,
  TRANSACTION_DECODE_SOURCIFY,
  TRANSACTION_DECODE_FOUR_BYTE,
} = require('../../test/data/confirmations/transaction-decode');

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
      console.log('Token not found:', address);

      return Promise.resolve({
        address,
        standard: 'ERC20',
        decimals: 18,
        name: 'Missing Mock',
      });
    }

    return Promise.resolve(TOKEN_DETAILS_MOCK[address]);
  },

  // eslint-disable-next-line no-empty-function
  trackMetaMetricsEvent: () => {},

  decodeTransactionData: async (request) => {
    const { contractAddress } = request;

    if (contractAddress === CONTRACT_ADDRESS_UNISWAP) {
      return TRANSACTION_DECODE_UNISWAP;
    } else if (contractAddress === CONTRACT_ADDRESS_SOURCIFY) {
      return TRANSACTION_DECODE_SOURCIFY;
    } else if (contractAddress === CONTRACT_ADDRESS_FOUR_BYTE) {
      return TRANSACTION_DECODE_FOUR_BYTE;
    }

    return undefined;
  },
};
