'use no memo';

import { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import {
  type TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { hasTransactionType } from '../../../../../../shared/lib/transactions.utils';
import { usePerpsLiveAccount } from '../../../../../hooks/perps/stream';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionCustomAmount } from '../../transactions/useTransactionCustomAmount';
import { AlertsName } from '../constants';

/**
 * Alert raised on the Perps Withdraw confirmation when the user enters an
 * amount greater than the available HyperLiquid balance.
 *
 * Blocks the confirm button via `isBlocking: true`, mirroring the mobile
 * `perpsWithdrawInsufficient` behavior (CONF-1217).
 */
export function usePerpsWithdrawInsufficientBalanceAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { account } = usePerpsLiveAccount();
  const { amountFiat } = useTransactionCustomAmount();

  const isPerpsWithdraw = hasTransactionType(currentConfirmation, [
    TransactionType.perpsWithdraw,
  ]);

  const availableBalance = new BigNumber(account?.availableBalance ?? '0');
  const enteredAmount = new BigNumber(amountFiat || '0');

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
