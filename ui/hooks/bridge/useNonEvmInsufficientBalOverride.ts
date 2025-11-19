import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import type {
  AddNetworkFields,
  NetworkConfiguration,
} from '@metamask/network-controller';
import {
  formatChainIdToCaip,
  getNativeAssetForChainId,
  isNativeAddress,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import { CaipChainId } from '@metamask/utils';
import { toAssetId } from '../../../shared/lib/asset-utils';
import { getMultichainBalances } from '../../selectors/multichain';
import type { BridgeToken } from '../../ducks/bridge/types';

type ChainLike =
  | AddNetworkFields
  | NetworkConfiguration
  | { chainId: string | number };

type Args = {
  fromAmount: string | null;
  fromChain: ChainLike | null | undefined;
  fromToken: BridgeToken | null;
  accountId?: string;
};

export const useNonEvmInsufficientBalOverride = ({
  fromAmount,
  fromChain,
  fromToken,
  accountId,
}: Args): boolean | undefined => {
  const multichainBalances = useSelector(getMultichainBalances);

  const nonEvmSourceBalance = useMemo(() => {
    if (
      !fromChain ||
      !isNonEvmChainId(fromChain.chainId) ||
      !accountId ||
      !fromToken
    ) {
      return null;
    }

    const balancesByAssetId = multichainBalances?.[accountId];
    if (!balancesByAssetId) {
      return null;
    }

    const fromTokenChainId = (
      typeof fromToken.chainId === 'string' && fromToken.chainId.includes(':')
        ? fromToken.chainId
        : formatChainIdToCaip(fromChain.chainId)
    ) as CaipChainId;

    const assetId =
      fromToken.assetId ??
      (isNativeAddress(fromToken.address)
        ? getNativeAssetForChainId(fromChain.chainId)?.assetId
        : toAssetId(fromToken.address ?? '', fromTokenChainId) ?? undefined);

    if (!assetId) {
      return null;
    }

    return balancesByAssetId[assetId]?.amount ?? null;
  }, [accountId, fromChain, fromToken, multichainBalances]);

  return useMemo(() => {
    if (
      !fromChain ||
      !isNonEvmChainId(fromChain.chainId) ||
      !fromToken ||
      !fromAmount ||
      !nonEvmSourceBalance
    ) {
      return undefined;
    }

    const sanitizedAmount = ['', '.'].includes(fromAmount) ? '0' : fromAmount;

    return new BigNumber(nonEvmSourceBalance).lt(sanitizedAmount);
  }, [fromAmount, fromChain, fromToken, nonEvmSourceBalance]);
};

