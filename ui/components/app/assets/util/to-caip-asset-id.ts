import type { Asset } from '@metamask/assets-controllers';
import {
  type CaipAssetType,
  type Hex,
  isCaipAssetType,
  isStrictHexString,
} from '@metamask/utils';
import {
  getNativeAssetId,
  toAssetId,
} from '../../../../../shared/lib/asset-utils';

/**
 * CAIP-19 id for an asset row, matching the key live prices are stored under.
 *
 * @param asset - Asset row from the account group list.
 * @returns The row's CAIP-19 id, or undefined when the row has no asset id.
 */
export const toCaipAssetId = (asset: Asset): CaipAssetType | undefined => {
  const { assetId, chainId, isNative } = asset;

  if (assetId && isCaipAssetType(assetId)) {
    return assetId;
  }

  if (isNative) {
    return getNativeAssetId(chainId as Hex | undefined);
  }

  const evmAddress = 'address' in asset ? asset.address : assetId;
  if (evmAddress && isStrictHexString(chainId)) {
    return toAssetId(evmAddress, chainId);
  }

  return undefined;
};
