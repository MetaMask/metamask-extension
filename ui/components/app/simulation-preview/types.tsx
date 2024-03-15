import { Hex } from '@metamask/utils';
import { Numeric } from '../../../../shared/modules/Numeric';

/**
 * Specifies an asset.
 */
export type AssetInfo = {
  isNative: boolean;
  contractAddress?: Hex;
  tokenId?: Hex;
};

/**
 * A balance change for an asset.
 */
export type BalanceChange = {
  assetInfo: AssetInfo;
  isDecrease: boolean;
  absChange: Numeric;
};
