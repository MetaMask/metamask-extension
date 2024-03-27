import contractMap from '@metamask/contract-metadata';
import BigNumber from 'bignumber.js';

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
 *  'NFT' contract.
 * @property {string} [symbol] - The symbol of the token.
 * @property {number} [decimals] - The number of decimals of the selected
 *  'ERC20' asset.
 * @property {number} [tokenId] - The id of the selected 'NFT' asset.
 * @property {string} [image] - A URL to the image of the NFT or ERC20 icon.
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
export const MAX_TOKEN_ALLOWANCE_AMOUNT = new BigNumber(2)
  .pow(256)
  .minus(1)
  .toString(10);
// number with optional decimal point using a comma or dot
export const NUM_W_OPT_DECIMAL_COMMA_OR_DOT_REGEX =
  /^[0-9]{1,}([,.][0-9]{1,})?$/u;
export const DECIMAL_REGEX = /\.(\d*)/u;
