import { useMemo } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionPayStrategy } from '@metamask/transaction-pay-controller';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { isPerpsWithdrawTransaction } from '../../../../../../shared/lib/transactions.utils';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionPayToken } from '../../pay/useTransactionPayToken';
import {
  useIsTransactionPayLoading,
  useTransactionPayIsPostQuote,
  useTransactionPayQuotes,
  useTransactionPayRequiredTokens,
  useTransactionPaySourceAmounts,
} from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';

export function useNoPayTokenQuotesAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { payToken } = useTransactionPayToken();
  const quotes = useTransactionPayQuotes();
  const isQuotesLoading = useIsTransactionPayLoading();
  const isPostQuote = useTransactionPayIsPostQuote();
  const sourceAmounts = useTransactionPaySourceAmounts();
  const requiredTokens = useTransactionPayRequiredTokens();

  const hasPositiveRequiredAmount = requiredTokens.some(
    (token) =>
      !token.skipIfBalance &&
      Boolean(token.amountRaw) &&
      token.amountRaw !== '0',
  );
  const hasExecutableQuote = quotes?.some(
    (quote) => quote.strategy !== TransactionPayStrategy.None,
  );
  const isPerpsWithdrawNotReady =
    isPerpsWithdrawTransaction(currentConfirmation) &&
    hasPositiveRequiredAmount &&
    !isQuotesLoading &&
    (!isPostQuote || !payToken || !hasExecutableQuote);

  const isOptionalOnly = (sourceAmounts ?? []).every(
    (sourceAmount) =>
      requiredTokens?.find(
        (rt) => rt.address === sourceAmount.targetTokenAddress,
      )?.skipIfBalance,
  );

  const showAlert =
    isPerpsWithdrawNotReady ||
    (payToken &&
      !isQuotesLoading &&
      sourceAmounts?.length &&
      !quotes?.length &&
      !isOptionalOnly);

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
