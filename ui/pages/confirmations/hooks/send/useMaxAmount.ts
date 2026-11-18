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
 * Max is the full balance, except for Tron, where the Snap computes the
 * amount that still leaves room for the network fees and, when the recipient
 * is unknown or inactive, the account activation reserve.
 *
 * For native EVM sends, the gas fee is subtracted on the confirmation by
 * `useMaxValueRefresher`, using the gas estimated by
 * `TransactionController`.
 */
export const useMaxAmount = () => {
  const { asset, fromAccount, toResolved } = useSendContext();
  const { isTronSendType } = useSendType();
  const { rawBalanceNumeric } = useBalance();

  const getMaxAmount = useCallback(async () => {
    if (isTronSendType && asset && fromAccount) {
      try {
        const { amount } = await getMaxSendableAmountMultichain(
          fromAccount as InternalAccount,
          {
            accountId: (fromAccount as InternalAccount).id,
            assetId: asset.assetId as CaipAssetType,
            ...(toResolved ? { toAddress: toResolved } : {}),
          },
        );
        return amount;
      } catch {
        // Fall back to the full balance if the Snap cannot quote a maximum.
      }
    }

    return getMaxAmountFn(asset, rawBalanceNumeric);
  }, [asset, fromAccount, isTronSendType, rawBalanceNumeric, toResolved]);

  return { getMaxAmount };
};

function getMaxAmountFn(asset: Asset | undefined, rawBalanceNumeric: Numeric) {
  if (!asset || rawBalanceNumeric.isZero() || rawBalanceNumeric.isNegative()) {
    return '0';
  }

  return toTokenMinimalUnit(rawBalanceNumeric.toString(), asset.decimals, 10);
}
