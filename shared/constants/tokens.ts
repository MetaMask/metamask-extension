import contractMap from '@metamask/contract-metadata/contract-map.json';
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
 * Details about a token asset.
 */
export type TokenDetails = {
  /** The address of the selected 'TOKEN' or 'NFT' contract. */
  address: string;
  /** The symbol of the token. */
  symbol?: string;
  /** The name of the token. */
  name?: string;
  /** The number of decimals of the selected 'ERC20' asset. */
  decimals?: number;
  /** The id of the selected 'NFT' asset. */
  tokenId?: number;
  /** A URL to the image of the NFT or ERC20 icon. */
  image?: string;
  /** The standard of the selected asset. */
  standard?: string;
  /** True when the asset is a ERC721 token. */
  isERC721?: boolean;
};

/**
 * Represents a single entry in the static mainnet token list.
 */
type StaticMainnetToken = {
  address: string;
  iconUrl: string;
  aggregators: string[];
  symbol?: string;
  decimals?: number;
  name?: string;
};

const STATIC_MAINNET_TOKEN_LIST: Record<string, StaticMainnetToken> = {};

for (const base of Object.keys(contractMap)) {
  const { logo, ...tokenMetadata } =
    contractMap[base as keyof typeof contractMap];
  STATIC_MAINNET_TOKEN_LIST[base.toLowerCase()] = {
    ...tokenMetadata,
    address: base.toLowerCase(),
    iconUrl: `images/contract/${logo}`,
    aggregators: [],
  };
}

export { STATIC_MAINNET_TOKEN_LIST };

export const TOKEN_API_METASWAP_CODEFI_URL =
  'https://token.api.cx.metamask.io/tokens/';
export const MAX_TOKEN_ALLOWANCE_AMOUNT = new BigNumber(2)
  .pow(256)
  .minus(1)
  .toString(10);
// number with optional decimal point using a comma or dot
export const NUM_W_OPT_DECIMAL_COMMA_OR_DOT_REGEX =
  /^[0-9]{1,}([,.][0-9]{1,})?$/u;
export const DECIMAL_REGEX = /\.(\d*)/u;
