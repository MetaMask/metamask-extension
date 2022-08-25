import contractMap from '@metamask/contract-metadata';

/**
 * A normalized list of addresses exported as part of the contractMap in
 * `@metamask/contract-metadata`. Used primarily to validate if manually entered
 * contract addresses do not match one of our listed tokens
 */
export const LISTED_CONTRACT_ADDRESSES = Object.keys(contractMap).map(
  (address) => address.toLowerCase(),
);

/**
 * @typedef {object} TokenDetails
 * @property {string} address - The address of the selected 'TOKEN' or
 *  'COLLECTIBLE' contract.
 * @property {string} [symbol] - The symbol of the token.
 * @property {number} [decimals] - The number of decimals of the selected
 *  'ERC20' asset.
 * @property {number} [tokenId] - The id of the selected 'COLLECTIBLE' asset.
 * @property {TokenStandardStrings} [standard] - The standard of the selected
 *  asset.
 * @property {boolean} [isERC721] - True when the asset is a ERC721 token.
 */
export const STATIC_MAINNET_TOKEN_LIST = Object.keys(contractMap).reduce(
  (acc, base) => {
    const { logo, ...tokenMetadata } = contractMap[base];
    return {
      ...acc,
      [base.toLowerCase()]: {
        ...tokenMetadata,
        address: base.toLowerCase(),
        iconUrl: `images/contract/${logo}`,
        aggregators: [],
      },
    };
  },
  {},
);

export const TOKEN_API_METASWAP_CODEFI_URL =
  'https://token-api.metaswap.codefi.network/tokens/';
