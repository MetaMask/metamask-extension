import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import {
  isNativeAddress,
  getNativeAssetForChainId,
  formatChainIdToCaip,
  formatChainIdToHex,
  isSolanaChainId,
  ChainId,
} from '@metamask/bridge-controller';
import type { Hex } from '@metamask/utils';
import { BRIDGE_CHAINID_COMMON_TOKEN_PAIR } from '../../../shared/constants/bridge';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../shared/constants/network';
import { getAssetImageUrl, toAssetId } from '../../../shared/lib/asset-utils';
import {
  getFromChain,
  getToChain,
  getFromToken,
} from '../../ducks/bridge/selectors';
import type { BridgeToken } from '../../ducks/bridge/types';
import { MULTICHAIN_TOKEN_IMAGE_MAP } from '../../../shared/constants/multichain/networks';

type UseBridgeDefaultToTokenReturnType = {
  defaultToChainId: ChainId | Hex | null;
  defaultToToken: BridgeToken | null;
};

/**
 * Gets the image for a token based on chain and address
 */
const getTokenImage = (
  chainId: ChainId | Hex,
  address?: string,
  assetId?: string,
): string => {
  const caipChainId = formatChainIdToCaip(chainId);

  // Native asset images
  if (!address || isNativeAddress(address)) {
    if (isSolanaChainId(chainId)) {
      return MULTICHAIN_TOKEN_IMAGE_MAP[caipChainId] || '';
    }
    const hexChainId = formatChainIdToHex(chainId);
    return (
      CHAIN_ID_TOKEN_IMAGE_MAP[
        hexChainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
      ] || ''
    );
  }

  // Non-native asset images
  const assetIdToUse = assetId ?? toAssetId(address, caipChainId);
  return (assetIdToUse && getAssetImageUrl(assetIdToUse, caipChainId)) ?? '';
};

/**
 * Creates a properly typed BridgeToken
 */
const createBridgeToken = (
  tokenData: {
    address: string;
    symbol: string;
    decimals: number;
    name?: string;
    assetId?: string;
  },
  chainId: ChainId | Hex,
): BridgeToken => {
  return {
    address: tokenData.address,
    symbol: tokenData.symbol,
    decimals: tokenData.decimals,
    // name: tokenData.name || tokenData.symbol,
    chainId,
    image: getTokenImage(chainId, tokenData.address, tokenData.assetId),
    balance: '0',
    string: '0',
  };
};

/**
 * UseBridgeDefaultToToken - Determines default destination chain and token
 *
 * Logic:
 * 1. Default destination chain = source chain (same-chain swap by default)
 * 2. If source is native token -> default to USDC
 * 3. If source is USDC (or other stablecoin) -> default to native token
 * 4. Otherwise -> default to common pair (usually USDC)
 *
 * @returns UseBridgeDefaultToTokenReturnType
 */
function useBridgeDefaultToToken(): UseBridgeDefaultToTokenReturnType {
  const fromChain = useSelector(getFromChain);
  const toChain = useSelector(getToChain);
  const fromToken = useSelector(getFromToken, isEqual);

  const defaultToChainId = useMemo(() => {
    // If destination chain already selected, or no source chain, return null
    if (toChain?.chainId || !fromChain?.chainId) {
      return null;
    }

    // Default to same chain as source (swap, not bridge)
    return fromChain.chainId;
  }, [fromChain?.chainId, toChain?.chainId]);

  const defaultToToken = useMemo(() => {
    // Use the explicitly selected chain, or the default (which is same as source)
    const targetChainId = toChain?.chainId || defaultToChainId;

    if (!fromToken || !targetChainId) {
      return null;
    }

    // If source is native token, default to USDC on same chain
    if (isNativeAddress(fromToken.address)) {
      const commonPair =
        BRIDGE_CHAINID_COMMON_TOKEN_PAIR[
          targetChainId as keyof typeof BRIDGE_CHAINID_COMMON_TOKEN_PAIR
        ];

      if (commonPair) {
        return createBridgeToken(commonPair, targetChainId);
      }
    }

    // If source is USDC (or other common pair token), default to native token
    const commonPair =
      BRIDGE_CHAINID_COMMON_TOKEN_PAIR[
        targetChainId as keyof typeof BRIDGE_CHAINID_COMMON_TOKEN_PAIR
      ];

    if (
      commonPair &&
      fromToken.address?.toLowerCase() === commonPair.address.toLowerCase()
    ) {
      const nativeAsset = getNativeAssetForChainId(targetChainId);
      if (nativeAsset) {
        return createBridgeToken(nativeAsset, targetChainId);
      }
    }

    // For any other token, default to USDC
    if (commonPair) {
      return createBridgeToken(commonPair, targetChainId);
    }

    // Last resort: native token
    const nativeAsset = getNativeAssetForChainId(targetChainId);
    if (nativeAsset) {
      return createBridgeToken(nativeAsset, targetChainId);
    }

    return null;
  }, [fromToken, toChain?.chainId, defaultToChainId]);

  return { defaultToChainId, defaultToToken };
}

export default useBridgeDefaultToToken;
