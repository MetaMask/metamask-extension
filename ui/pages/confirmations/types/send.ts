import BN from 'bn.js';

export type Asset = {
  address?: string;
  balance?: BN | string | undefined;
  chainId?: string | number;
  decimals?: string | number | undefined;
  name?: string | undefined;
  standard?: string;
  symbol?: string | undefined;
  tokenId?: string;
  tokenURI?: string | undefined;
};
