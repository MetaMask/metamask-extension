const ERC20_TOKEN_MOCK = '0x2234567890123456789012345678901234567890';
const ERC721_TOKEN_MOCK = '0x3234567890123456789012345678901234567890';
const ERC1155_TOKEN_MOCK = '0x4234567890123456789012345678901234567890';

module.exports = {
  getTokenStandardAndDetails: (address) => {
    if (address === ERC20_TOKEN_MOCK) {
      return Promise.resolve({
        standard: 'ERC20',
        symbol: 'USDC',
        decimals: '16',
      });
    }

    if (address === ERC721_TOKEN_MOCK) {
      return Promise.resolve({
        standard: 'ERC721',
        name: 'CryptoKitties',
      });
    }

    if (address === ERC1155_TOKEN_MOCK) {
      return Promise.resolve({
        standard: 'ERC1155',
        name: 'Bored Ape',
      });
    }

    return undefined;
  },
};
