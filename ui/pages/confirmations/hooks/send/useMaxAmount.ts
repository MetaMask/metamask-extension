import { useCallback } from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipAssetType } from '@metamask/utils';

import { Numeric } from '../../../../../shared/lib/Numeric';
import { Asset } from '../../types/send';
import { toTokenMinimalUnit } from '../../utils/send';
import { getMaxSendableAmountMultichain } from '../../utils/multichain-snaps';
import { useSendContext } from '../../context/send';
import { useBalance } from './useBalance';
import { useSendType } from './useSendType';

/**
 * Returns the Max amount for the selected asset.
 *
 * Max is the full balance. For native EVM sends, the gas fee is subtracted on
 * the confirmation by `useMaxValueRefresher`, using the gas estimated by
 * `TransactionController`.
 *
 * For non-EVM sends the Snap computes the maximum. Tron subtracts the network
 * fees and, when the recipient is unknown or inactive, the account activation
 * reserve.
 */
export const useMaxAmount = () => {
  const { asset, fromAccount, toResolved } = useSendContext();
  const { isNonEvmSendType } = useSendType();
  const { rawBalanceNumeric } = useBalance();

  const getMaxAmount = useCallback(async () => {
    if (isNonEvmSendType && asset && fromAccount) {
      try {
        const { amount } = await getMaxSendableAmountMultichain(
          fromAccount as InternalAccount,
          {
            accountId: (fromAccount as InternalAccount).id,
            assetId: asset.assetId as CaipAssetType,
            // `toResolved` is the resolved destination address for when there
            // is a name service like ENS.
            ...(toResolved ? { toAddress: toResolved } : {}),
          },
        );
        return amount;
      } catch {
        // Fall back to the full balance if the Snap cannot quote a maximum.
      }
    }

    return getMaxAmountFn(asset, rawBalanceNumeric);
  }, [asset, fromAccount, isNonEvmSendType, rawBalanceNumeric, toResolved]);

  return { getMaxAmount };
};

function getMaxAmountFn(asset: Asset | undefined, rawBalanceNumeric: Numeric) {
  if (!asset || rawBalanceNumeric.isZero() || rawBalanceNumeric.isNegative()) {
    return '0';
  }

  return toTokenMinimalUnit(rawBalanceNumeric.toString(), asset.decimals, 10);
}
