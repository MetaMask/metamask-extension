import contractMap from '@metamask/contract-metadata/contract-map.json';

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
export const DECIMAL_REGEX = /\.(\d*)/u;
