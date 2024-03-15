import { Hex } from '@metamask/utils';
import { SimulationTokenStandard } from '@metamask/transaction-controller';
import { Numeric } from '../../../../shared/modules/Numeric';

/**
 * Specifies an asset.
 */
export type NativeAssetInfo = {
  isNative: true;
};

export type Erc20AssetInfo = {
  isNative: false;
  standard: SimulationTokenStandard.erc20;
  contractAddress: Hex;
};

export type Erc721AssetInfo = {
  isNative: false;
  standard: SimulationTokenStandard.erc721;
  contractAddress: Hex;
  tokenId: Hex;
};

export type Erc1155AssetInfo = {
  isNative: false;
  standard: SimulationTokenStandard.erc1155;
  contractAddress: Hex;
  tokenId: Hex;
};

export type AssetInfo =
  | NativeAssetInfo
  | Erc20AssetInfo
  | Erc721AssetInfo
  | Erc1155AssetInfo;

/**
 * A balance change for an asset.
 */
export interface BalanceChange {
  assetInfo: AssetInfo;
  isDecrease: boolean;
  absChange: Numeric;
}
