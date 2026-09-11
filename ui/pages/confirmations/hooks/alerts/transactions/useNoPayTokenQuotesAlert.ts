import { useMemo } from 'react';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  hasTransactionType,
  isPerpsWithdrawTransaction,
} from '../../../../../../shared/lib/transactions.utils';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionPayToken } from '../../pay/useTransactionPayToken';
import {
  useIsTransactionPayQuotePending,
  useTransactionPayHasExecutableQuote,
  useTransactionPayHasPositiveRequiredAmount,
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
  const isQuotePending = useIsTransactionPayQuotePending();
  const hasExecutableQuote = useTransactionPayHasExecutableQuote();
  const hasPositiveRequiredAmount =
    useTransactionPayHasPositiveRequiredAmount();
  const sourceAmounts = useTransactionPaySourceAmounts();
  const requiredTokens = useTransactionPayRequiredTokens();

  const isMoneyAccountDeposit = hasTransactionType(currentConfirmation, [
    TransactionType.moneyAccountDeposit,
  ]);

  const isPerpsWithdrawNotReady =
    isPerpsWithdrawTransaction(currentConfirmation) &&
    hasPositiveRequiredAmount &&
    !isQuotePending &&
    (!payToken || !hasExecutableQuote);

  const isOptionalOnly = (sourceAmounts ?? []).every(
    (sourceAmount) =>
      requiredTokens?.find(
        (rt) => rt.address === sourceAmount.targetTokenAddress,
      )?.skipIfBalance,
  );

  // Money-account deposits require a Relay quote (`isQuoteRequired`). When the
  // pay-token fiat rate is missing at source-amount time, `sourceAmounts`
  // stays empty and the usual "no quotes" path never fires — Add funds just
  // stays disabled with no explanation.
  const isDepositMissingSourceAmounts =
    isMoneyAccountDeposit &&
    Boolean(payToken) &&
    hasPositiveRequiredAmount &&
    !isQuotePending &&
    !quotes?.length &&
    !sourceAmounts?.length;

  const showAlert =
    isPerpsWithdrawNotReady ||
    isDepositMissingSourceAmounts ||
    (payToken &&
      !isQuotePending &&
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
