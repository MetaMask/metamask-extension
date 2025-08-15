import BN from 'bn.js';

export type Asset = {
  standard?: string;
  tokenURI?: string | undefined;
  symbol?: string | undefined;
  name?: string | undefined;
  decimals?: string | number | undefined;
  balance?: BN | undefined;
};
