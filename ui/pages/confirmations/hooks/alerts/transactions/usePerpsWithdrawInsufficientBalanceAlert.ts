'use no memo';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { isPerpsWithdrawTransaction } from '../../../../../../shared/lib/transactions.utils';
import { getTradeableBalance } from '../../../../../hooks/perps/getTradeableBalance';
import { selectPerpsCachedAccountState } from '../../../../../selectors/perps-controller';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionPayPrimaryRequiredToken } from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';

/**
 * Blocking alert when the entered amount exceeds the HL withdrawable balance.
 *
 * Reads from the cached Redux account state (not `usePerpsLiveAccount`) to
 * avoid kicking off `perpsInit` for every non-perps confirmation — this hook
 * runs for every transaction confirmation. The Perps Withdraw confirmation
 * itself initializes the stream via `PerpsWithdrawBalance`, so the cache
 * will be populated by the time the user can enter an amount.
 */
export function usePerpsWithdrawInsufficientBalanceAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const account = useSelector(selectPerpsCachedAccountState);
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
