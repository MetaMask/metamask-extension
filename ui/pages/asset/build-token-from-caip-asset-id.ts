import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import {
  type CaipAssetType,
  type CaipChainId,
  type Hex,
  isCaipAssetType,
  parseCaipAssetType,
} from '@metamask/utils';

import { decimalToPrefixedHex } from '../../../shared/lib/conversion.utils';
import {
  fetchAssetMetadataForAssetIds,
  getCaipAssetImageUrl,
  isEvmChainId,
} from '../../../shared/lib/asset-utils';
import { Token } from '../../components/app/assets/types';

/**
 * Builds a fungible token model from a CAIP-19 asset id, including assets
 * that are not present in the user's wallet.
 * @param assetId
 */
export const buildTokenFromCaipAssetId = async (
  assetId: CaipAssetType,
): Promise<Token | undefined> => {
  if (!isCaipAssetType(assetId)) {
    return undefined;
  }

  try {
    const parsed = parseCaipAssetType(assetId);
    const { chainId: caipChainId, assetNamespace, assetReference } = parsed;

    if (assetNamespace === 'slip44') {
      try {
        const native = getNativeAssetForChainId(caipChainId);
        const hexChainId = decimalToPrefixedHex(parsed.chain.reference) as Hex;

        return {
          symbol: native.symbol,
          name: native.name ?? native.symbol,
          address: '' as Hex,
          chainId: hexChainId,
          decimals: native.decimals,
          image: native.iconUrl ?? '',
          isNative: true,
        };
      } catch {
        return undefined;
      }
    }

    const metadataById = await fetchAssetMetadataForAssetIds([assetId]);
    const metadata =
      metadataById?.[assetId] ??
      metadataById?.[assetId.toLowerCase() as CaipAssetType];

    if (!metadata) {
      return undefined;
    }

    const image = getCaipAssetImageUrl(assetId) ?? '';
    const isEvm = isEvmChainId(caipChainId);

    if (!isEvm) {
      return {
        address: assetId,
        symbol: metadata.symbol,
        name: metadata.name,
        chainId: caipChainId as CaipChainId,
        decimals: metadata.decimals,
        image,
        isNative: assetNamespace === 'slip44',
      };
    }

    const hexChainId = decimalToPrefixedHex(parsed.chain.reference) as Hex;

    return {
      address: assetReference as Hex,
      symbol: metadata.symbol,
      name: metadata.name,
      chainId: hexChainId,
      decimals: metadata.decimals,
      image,
      isNative: false,
    };
  } catch {
    return undefined;
  }
};
