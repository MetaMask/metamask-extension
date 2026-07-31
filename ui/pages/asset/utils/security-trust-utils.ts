import {
  type CaipAssetType,
  type CaipChainId,
  type Hex,
  isCaipChainId,
  parseCaipAssetType,
} from '@metamask/utils';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { isEvmChainId } from '../../../../shared/lib/asset-utils';

/**
 * Normalize chain ids to CAIP-2 for Security & Trust analytics and routing.
 * @param chainId
 */
export const toSecurityTrustChainId = (
  chainId?: string,
): CaipChainId | undefined => {
  if (!chainId) {
    return undefined;
  }

  if (isCaipChainId(chainId)) {
    return chainId;
  }

  if (isEvmChainId(chainId)) {
    return toEvmCaipChainId(chainId as Hex);
  }

  return undefined;
};

export const getSecurityTrustTokenTypeLabel = (
  assetId: CaipAssetType | undefined,
  isNative: boolean,
): string => {
  if (isNative) {
    return 'Native';
  }

  if (!assetId) {
    return 'Token';
  }

  try {
    const { assetNamespace } = parseCaipAssetType(assetId);
    if (assetNamespace === 'erc20') {
      return 'ERC-20';
    }
    if (assetNamespace === 'spl') {
      return 'SPL';
    }
    return assetNamespace.toUpperCase();
  } catch {
    return 'Token';
  }
};
