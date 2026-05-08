import { CaipChainId } from '@metamask/utils';
import { getAssetsBySelectedAccountGroup } from '../../selectors/assets';

export type BatchSellAsset = {
  assetId: string;
  name: string;
  symbol: string;
  image: string | undefined;
  balance: string;
  fiatBalance?: number;
  tokenFiatPrice?: number;
  percentageChange?: number;
  isNative: boolean;
  chainId: CaipChainId;
  address?: string;
};

export type ChainAsset = ReturnType<
  typeof getAssetsBySelectedAccountGroup
>[string][number];
