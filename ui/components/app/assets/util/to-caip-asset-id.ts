import type { Asset } from '@metamask/assets-controllers';
import {
  type CaipAssetType,
  type Hex,
  isCaipAssetType,
  isStrictHexString,
} from '@metamask/utils';
import {
  getNativeAssetId,
  normalizeTokenAssetId,
} from '../../../../../shared/lib/asset-utils';
import { buildEvmCaip19AssetId } from '../../../../../shared/lib/multichain/buildEvmCaip19AssetId';

/**
 * CAIP-19 id for an asset row, matching the key live prices are stored under.
 *
 * @param asset - Asset row from the account group list.
 * @returns Normalized CAIP-19 id, or undefined when the row has no asset id.
 */
export const toCaipAssetId = (asset: Asset): CaipAssetType | undefined => {
  const { assetId, chainId, isNative } = asset;

  if (assetId && isCaipAssetType(assetId)) {
    return normalizeTokenAssetId(assetId);
  }

  if (isNative) {
    const nativeAssetId = getNativeAssetId(chainId as Hex | undefined);
    return nativeAssetId ? normalizeTokenAssetId(nativeAssetId) : undefined;
  }

  const evmAddress = 'address' in asset ? asset.address : assetId;
  if (evmAddress && isStrictHexString(chainId)) {
    return buildEvmCaip19AssetId(evmAddress, chainId) as CaipAssetType;
  }

  return undefined;
};
