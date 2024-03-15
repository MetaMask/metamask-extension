const ERC20_TOKEN_MOCK = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';

const mockTokenDetails = {
  [ERC20_TOKEN_MOCK]: {
    address: ERC20_TOKEN_MOCK,
    standard: 'ERC20',
    decimals: 8,
    name: 'Wrapped Bitcoin',
  },
};

module.exports = {
  getTokenStandardAndDetails: (address) => {
    if (!mockTokenDetails[address]) {
      return Promise.reject(new Error('Token not found'));
    }
    return Promise.resolve(mockTokenDetails[address]);
  },
};
