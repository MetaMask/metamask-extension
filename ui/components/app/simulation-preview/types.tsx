import { Hex } from '@metamask/utils';
import { Numeric } from '../../../../shared/modules/Numeric';

export type AssetInfo = {
  isNative: boolean;
  contractAddress?: Hex;
  tokenId?: Hex;
};

export interface BalanceChange {
  assetInfo: AssetInfo;
  isDecrease: boolean;
  absChange: Numeric;
}
