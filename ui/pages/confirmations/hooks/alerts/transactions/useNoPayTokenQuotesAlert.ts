'use no memo';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  selectTransactionDataByTransactionId,
  type TransactionPayState,
} from '../../../../../selectors/transactionPayController';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionPayToken } from '../../pay/useTransactionPayToken';
import {
  useIsTransactionPayLoading,
  useTransactionPayRequiredTokens,
  useTransactionPaySourceAmounts,
} from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';

export function useNoPayTokenQuotesAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const { payToken } = useTransactionPayToken();
  const isQuotesLoading = useIsTransactionPayLoading();
  const sourceAmounts = useTransactionPaySourceAmounts();
  const requiredTokens = useTransactionPayRequiredTokens();

  // Include no-op None quotes so direct routes are not treated as missing.
  const hasResolvedQuotes = useSelector((state: TransactionPayState) =>
    Boolean(
      selectTransactionDataByTransactionId(state, transactionId)?.quotes
        ?.length,
    ),
  );

  const isOptionalOnly = (sourceAmounts ?? []).every(
    (sourceAmount) =>
      requiredTokens?.find(
        (rt) => rt.address === sourceAmount.targetTokenAddress,
      )?.skipIfBalance,
  );

  const showAlert =
    payToken &&
    !isQuotesLoading &&
    sourceAmounts?.length &&
    !hasResolvedQuotes &&
    !isOptionalOnly;

  return useMemo(() => {
    if (!showAlert) {
      return [];
    }

    return [
      {
        key: AlertsName.NoPayTokenQuotes,
        field: RowAlertKey.PayWith,
        message: t('alertNoPayTokenQuotesMessage'),
        reason: t('alertNoPayTokenQuotesTitle'),
        severity: Severity.Danger,
        isBlocking: true,
      },
    ];
  }, [showAlert, t]);
}
