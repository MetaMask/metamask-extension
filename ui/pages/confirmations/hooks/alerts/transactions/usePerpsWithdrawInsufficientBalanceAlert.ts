'use no memo';

import { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { isPerpsWithdrawTransaction } from '../../../../../../shared/lib/transactions.utils';
import { getTradeableBalance } from '../../../../../hooks/perps/getTradeableBalance';
import { usePerpsLiveAccount } from '../../../../../hooks/perps/stream';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionPayPrimaryRequiredToken } from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';

/**
 * Blocking alert when the entered amount exceeds the HL withdrawable balance.
 *
 * Uses `usePerpsLiveAccount` (not `selectPerpsCachedAccountState`) because the
 * Redux-backed cache (`cachedUserDataByProvider`) is only populated by an
 * explicit controller preload and is empty by default in the extension —
 * reading from it would cause a false-positive "insufficient balance" alert
 * for any amount > 0. `streamManager.initForAddress` is deduplicated at the
 * singleton level, so the per-confirmation cost of this hook is bounded to a
 * single `perpsInit` RPC per session per address.
 */
export function usePerpsWithdrawInsufficientBalanceAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { account } = usePerpsLiveAccount();
  // `useTransactionCustomAmount` owns local state, so a second call here
  // would never see input. `amountFiat` is what the user typed in USD;
  // `amountUsd` is token-count × $1 and drifts for non-1:1 stables.
  const primaryRequiredToken = useTransactionPayPrimaryRequiredToken();

  const isPerpsWithdraw = isPerpsWithdrawTransaction(currentConfirmation);

  const availableBalance = new BigNumber(getTradeableBalance(account));
  const enteredAmount = new BigNumber(primaryRequiredToken?.amountFiat ?? '0');

  const exceedsBalance =
    isPerpsWithdraw &&
    enteredAmount.gt(0) &&
    enteredAmount.gt(availableBalance);

  return useMemo(() => {
    if (!exceedsBalance) {
      return [];
    }

    return [
      {
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        key: AlertsName.InsufficientPayTokenBalance,
        message: t('perpsWithdrawInsufficient'),
        reason: t('perpsWithdrawInvalidAmount'),
        severity: Severity.Danger,
      },
    ];
  }, [exceedsBalance, t]);
}
