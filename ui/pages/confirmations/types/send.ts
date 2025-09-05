import BN from 'bn.js';
import { Hex } from '@metamask/utils';

export type Asset = {
  address?: string;
  assetId?: string;
  balance?: BN | string | undefined;
  chainId?: string | number;
  decimals?: number | undefined;
  name?: string | undefined;
  standard?: string;
  symbol?: string | undefined;
  tokenId?: string;
  tokenURI?: string | undefined;
  primary?: string;
  rawBalance?: Hex;
  fiat?: {
    balance?: number;
    currency?: string;
    conversionRate?: number;
  };
};
