import { useCallback } from 'react';
import { TrxScope } from '@metamask/keyring-api';
import { CaipAssetType, CaipChainId } from '@metamask/utils';

import { useSendContext } from '../../../context/send';
import { useBalance } from '../useBalance';
import { getTronMaxSendableAmount } from './getTronMaxSendableAmount';
import type { GetMaxSendableAmount } from './types';

const MAX_SENDABLE_AMOUNT_GETTERS: Partial<
  Record<CaipChainId, GetMaxSendableAmount>
> = {
  [TrxScope.Mainnet]: getTronMaxSendableAmount,
  [TrxScope.Nile]: getTronMaxSendableAmount,
  [TrxScope.Shasta]: getTronMaxSendableAmount,
};

/**
 * Returns the maximum amount a non-EVM network allows to be sent, routing each
 * network to its own getter. Returns undefined when the network has no getter,
 * leaving the caller to fall back to the full balance.
 */
export const useNonEvmMaxAmount = () => {
  const { asset, fromAccount, toResolved } = useSendContext();
  const { rawBalanceNumeric } = useBalance();
  const getMaxSendableAmount = asset?.chainId
    ? MAX_SENDABLE_AMOUNT_GETTERS[asset.chainId as CaipChainId]
    : undefined;

  const getNonEvmMaxAmount = useCallback(async () => {
    if (!getMaxSendableAmount || !asset?.assetId || !fromAccount) {
      return undefined;
    }

    return await getMaxSendableAmount({
      fromAccount,
      assetId: asset.assetId as CaipAssetType,
      toAddress: toResolved,
      balance: {
        rawBalanceNumeric,
        decimals: asset.decimals ?? 0,
        isNative: Boolean(asset.isNative),
      },
    });
  }, [asset, fromAccount, getMaxSendableAmount, rawBalanceNumeric, toResolved]);

  return {
    getNonEvmMaxAmount,
    isNonEvmMaxSupported: Boolean(getMaxSendableAmount),
  };
};
