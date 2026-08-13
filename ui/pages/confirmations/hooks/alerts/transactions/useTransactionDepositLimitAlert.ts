'use no memo';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { selectDepositLimits } from '../../../selectors/feature-flags';
import { getDepositLimitForTransaction } from '../../../utils/pay-deposit-limit';
import { useTransactionPayPrimaryRequiredToken } from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';

function formatUsdAmount(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}

/**
 * Blocking alert when the entered fiat amount exceeds the per-transaction-type
 * USD deposit limit from `confirmations_pay.depositLimit`.
 * Matches mobile `useTransactionDepositLimitAlert`.
 * @param options0
 * @param options0.pendingAmount
 */
export function useTransactionDepositLimitAlert({
  pendingAmount,
}: {
  pendingAmount?: string;
} = {}): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const depositLimits = useSelector(selectDepositLimits);
  const primaryRequiredToken = useTransactionPayPrimaryRequiredToken();

  const depositLimit = useMemo(
    () => getDepositLimitForTransaction(depositLimits, currentConfirmation),
    [currentConfirmation, depositLimits],
  );

  const amount = useMemo(() => {
    if (pendingAmount !== undefined) {
      return pendingAmount;
    }

    return (
      primaryRequiredToken?.amountFiat ?? primaryRequiredToken?.amountUsd ?? '0'
    );
  }, [
    pendingAmount,
    primaryRequiredToken?.amountFiat,
    primaryRequiredToken?.amountUsd,
  ]);

  const exceedsLimit = useMemo(() => {
    if (depositLimit === undefined) {
      return false;
    }

    return Number(amount ?? '0') > depositLimit;
  }, [amount, depositLimit]);

  return useMemo(() => {
    if (!exceedsLimit || depositLimit === undefined) {
      return [];
    }

    const title = t('alertDepositLimit', [formatUsdAmount(depositLimit)]);

    return [
      {
        key: AlertsName.DepositLimit,
        field: RowAlertKey.Amount,
        reason: title,
        message: title,
        severity: Severity.Danger,
        isBlocking: true,
      },
    ];
  }, [depositLimit, exceedsLimit, t]);
}
