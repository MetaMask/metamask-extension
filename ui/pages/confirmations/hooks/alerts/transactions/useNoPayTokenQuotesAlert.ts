'use no memo';

import { useMemo } from 'react';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useTransactionPayToken } from '../../pay/useTransactionPayToken';
import {
  useHasTransactionPayResolvedQuotes,
  useIsTransactionPayLoading,
  useTransactionPayRequiredTokens,
  useTransactionPaySourceAmounts,
} from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';

export function useNoPayTokenQuotesAlert(): Alert[] {
  const t = useI18nContext();
  const { payToken } = useTransactionPayToken();
  const hasResolvedQuotes = useHasTransactionPayResolvedQuotes();
  const isQuotesLoading = useIsTransactionPayLoading();
  const sourceAmounts = useTransactionPaySourceAmounts();
  const requiredTokens = useTransactionPayRequiredTokens();

  const isOptionalOnly = (sourceAmounts ?? []).every(
    (sourceAmount) =>
      requiredTokens?.find(
        (rt) => rt.address === sourceAmount.targetTokenAddress,
      )?.skipIfBalance,
  );

  // Use resolved quotes (including no-op None quotes) so direct routes that
  // need no conversion are not treated as missing quotes.
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
