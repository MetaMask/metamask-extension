import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { parseCaipAssetType } from '@metamask/utils';
import { BatchSellAsset } from '../../../../../ducks/batch-sell/types';

const EVM_NATIVE_ASSET_ADDRESS = '0x0000000000000000000000000000000000000000';

export const getSourceTokenAddress = (asset: BatchSellAsset): string => {
  const isNative =
    getNativeAssetForChainId(asset.chainId)?.assetId.toLowerCase() ===
    asset.assetId.toLowerCase();
  if (isNative) {
    return EVM_NATIVE_ASSET_ADDRESS;
  }
  const { assetReference } = parseCaipAssetType(asset.assetId);
  return assetReference;
};
