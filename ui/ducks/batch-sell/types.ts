import { CaipChainId } from '@metamask/utils';

export type BatchSellAsset = {
  assetId: string;
  name: string;
  symbol: string;
  image: string;
  balance: string;
  fiatBalance?: number;
  tokenFiatPrice?: number;
  percentageChange?: number;
  isNative: boolean;
  chainId: CaipChainId;
  address?: string;
};
