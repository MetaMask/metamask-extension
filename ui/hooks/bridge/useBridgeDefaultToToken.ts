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
import { getToChain, getFromToken } from '../../ducks/bridge/selectors';
import type { TokenPayload } from '../../ducks/bridge/types';
import {
  AddNetworkFields,
  NetworkConfiguration,
} from '@metamask/network-controller';

type UseBridgeDefaultToTokenReturnType = {
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

const getDefaultToToken = (
  toChain?: NetworkConfiguration | AddNetworkFields,
  fromToken?: TokenPayload['payload'],
) => {
  // Use the explicitly selected chain, or the default (which is same as source)
  const targetChainId = toChain?.chainId;

  if (!fromToken || !targetChainId) {
    return null;
  }

  const commonPair =
    BRIDGE_CHAINID_COMMON_TOKEN_PAIR[
      targetChainId as keyof typeof BRIDGE_CHAINID_COMMON_TOKEN_PAIR
    ];

  if (commonPair) {
    // If source is native token, default to USDC on same chain
    if (isNativeAddress(fromToken.address)) {
      return createBridgeTokenPayload(commonPair, targetChainId);
    }

    // If source is USDC (or other common pair token), default to native token
    if (fromToken.address?.toLowerCase() === commonPair.address.toLowerCase()) {
      const nativeAsset = getNativeAssetForChainId(targetChainId);
      if (nativeAsset) {
        return createBridgeTokenPayload(nativeAsset, targetChainId);
      }
    }

    // For any other token, default to USDC
    return createBridgeTokenPayload(commonPair, targetChainId);
  }

  // Last resort: native token
  const nativeAsset = getNativeAssetForChainId(targetChainId);
  if (nativeAsset) {
    return createBridgeTokenPayload(nativeAsset, targetChainId);
  }

  return null;
};

function useBridgeDefaultToToken(): UseBridgeDefaultToTokenReturnType {
  const toChain = useSelector(getToChain);
  const fromToken = useSelector(getFromToken, isEqual);

  const defaultToToken = useMemo(() => {
    return getDefaultToToken(toChain, fromToken);
  }, [fromToken, toChain?.chainId]);

  return { defaultToToken };
}

export default useBridgeDefaultToToken;
