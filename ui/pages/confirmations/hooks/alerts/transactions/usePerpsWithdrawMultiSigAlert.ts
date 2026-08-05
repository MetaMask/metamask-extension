'use no memo';

import { useMemo } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import type { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { isPerpsWithdrawTransaction } from '../../../../../../shared/lib/transactions.utils';
import { HYPERLIQUID_INFO_API_URL } from '../../../../../../shared/constants/defi-referrals';
import { useAsyncResult } from '../../../../../hooks/useAsync';
import { useConfirmContext } from '../../../context/confirm';
import { AlertsName } from '../constants';

/**
 * Blocking alert when the account is a HyperLiquid multi-sig user.
 *
 * HyperLiquid rejects every single-signature action from an account that was
 * converted to a multi-sig user (`Multi-sig required`), so the withdrawal
 * would always fail at the final `sendAsset` step. MetaMask cannot produce
 * HyperLiquid multi-sig signatures, so block the confirmation up front with a
 * clear reason instead.
 */
export function usePerpsWithdrawMultiSigAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const isPerpsWithdraw = isPerpsWithdrawTransaction(currentConfirmation);
  const from = currentConfirmation?.txParams?.from as Hex | undefined;

  // This hook runs for every confirmation type, so only query HyperLiquid
  // when the confirmation actually is a perps withdrawal.
  const { value: isMultiSigAccount } = useAsyncResult(async () => {
    if (!isPerpsWithdraw || !from) {
      return false;
    }

    return await isHyperliquidMultiSigUser(from);
  }, [isPerpsWithdraw, from]);

  return useMemo(() => {
    if (!isMultiSigAccount) {
      return [];
    }

    return [
      {
        key: AlertsName.PerpsWithdrawMultiSig,
        field: RowAlertKey.PayWith,
        reason: t('alertPerpsWithdrawMultiSigTitle'),
        message: t('alertPerpsWithdrawMultiSigMessage'),
        severity: Severity.Danger,
        isBlocking: true,
      },
    ];
  }, [isMultiSigAccount, t]);
}

async function isHyperliquidMultiSigUser(address: Hex): Promise<boolean> {
  try {
    const response = await fetch(HYPERLIQUID_INFO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'userToMultiSigSigners', user: address }),
    });

    if (!response.ok) {
      return false;
    }

    // Returns `{ authorizedUsers, threshold }` for multi-sig users, null
    // otherwise. Only block on a positively identified multi-sig config.
    const result = await response.json();
    return Array.isArray(result?.authorizedUsers);
  } catch {
    // Fail open: never block withdrawals on a failed pre-flight check.
    return false;
  }
}
