'use no memo';

import { useMemo } from 'react';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { hasTransactionType } from '../../../../../../shared/lib/transactions.utils';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionPayAvailableTokens } from '../../pay/useTransactionPayAvailableTokens';
import { useIsTransactionPayLoading } from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';

/**
 * Blocking alert when a money-account deposit has no funding tokens on the
 * selected account. Matches mobile `useAccountNoFundsAlert`.
 */
export function useAccountNoFundsAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const availableTokens = useTransactionPayAvailableTokens();
  const isLoading = useIsTransactionPayLoading();

  const isMoneyAccountDeposit = hasTransactionType(currentConfirmation, [
    TransactionType.moneyAccountDeposit,
  ]);

  const hasTokens = availableTokens.some((token) => !token.disabled);

  return useMemo(() => {
    if (!isMoneyAccountDeposit || hasTokens || isLoading) {
      return [];
    }

    return [
      {
        key: AlertsName.AccountNoFunds,
        field: RowAlertKey.PayWith,
        reason: t('alertAccountNoFundsTitle'),
        message: t('alertAccountNoFundsMessage'),
        severity: Severity.Danger,
        isBlocking: true,
      },
    ];
  }, [hasTokens, isLoading, isMoneyAccountDeposit, t]);
}
