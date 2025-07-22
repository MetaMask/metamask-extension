import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import {
  isNativeAddress,
  getNativeAssetForChainId,
  ChainId,
} from '@metamask/bridge-controller';
import type { Hex } from '@metamask/utils';
import { BRIDGE_CHAINID_COMMON_TOKEN_PAIR } from '../../../shared/constants/bridge';
import {
  getFromChain,
  getToChain,
  getFromToken,
} from '../../ducks/bridge/selectors';
import type { TokenPayload } from '../../ducks/bridge/types';

type UseBridgeDefaultToTokenReturnType = {
  defaultToChainId: ChainId | Hex | null;
  defaultToToken: TokenPayload['payload'] | null;
};

const createBridgeTokenPayload = (
  tokenData: {
    address: string;
    symbol: string;
    decimals: number;
    name?: string;
    assetId?: string;
  },
  chainId: ChainId | Hex,
): TokenPayload['payload'] | null => {
  return {
    address: tokenData.address,
    symbol: tokenData.symbol,
    decimals: tokenData.decimals,
    chainId,
  };
};

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
        return createBridgeTokenPayload(commonPair, targetChainId);
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
        return createBridgeTokenPayload(nativeAsset, targetChainId);
      }
    }

    // For any other token, default to USDC
    if (commonPair) {
      return createBridgeTokenPayload(commonPair, targetChainId);
    }

    // Last resort: native token
    const nativeAsset = getNativeAssetForChainId(targetChainId);
    if (nativeAsset) {
      return createBridgeTokenPayload(nativeAsset, targetChainId);
    }

    return null;
  }, [fromToken, toChain?.chainId, defaultToChainId]);

  return { defaultToChainId, defaultToToken };
}

export default useBridgeDefaultToToken;
