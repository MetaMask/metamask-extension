import contractMap from '@metamask/contract-metadata/contract-map.json';

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

export const DECIMAL_REGEX = /\.(\d*)/u;
