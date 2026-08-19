import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionPayStrategy } from '@metamask/transaction-pay-controller';
import {
  selectIsTransactionPayLoadingByTransactionId,
  selectTransactionPayIsMaxAmountByTransactionId,
  selectTransactionPayIsPostQuoteByTransactionId,
  selectTransactionPayQuotesByTransactionId,
  selectTransactionPaySourceAmountsByTransactionId,
  selectTransactionPayTokensByTransactionId,
  selectTransactionPayTotalsByTransactionId,
  TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { isPerpsWithdrawTransaction } from '../../../../../shared/lib/transactions.utils';
import { useConfirmContext } from '../../context/confirm';

export function useTransactionPayQuotes() {
  return useTransactionPayData(selectTransactionPayQuotesByTransactionId);
}

export function useTransactionPayHasExecutableQuote() {
  const quotes = useTransactionPayQuotes();

  return (
    quotes?.some((quote) => quote.strategy !== TransactionPayStrategy.None) ??
    false
  );
}

export function useTransactionPayRequiredTokens() {
  return useTransactionPayData(selectTransactionPayTokensByTransactionId);
}

export function useTransactionPayHasPositiveRequiredAmount() {
  const requiredTokens = useTransactionPayRequiredTokens();

  return requiredTokens.some(
    (token) =>
      !token.skipIfBalance &&
      Boolean(token.amountRaw) &&
      token.amountRaw !== '0',
  );
}

export function useTransactionPaySourceAmounts() {
  return useTransactionPayData(
    selectTransactionPaySourceAmountsByTransactionId,
  );
}

export function useIsTransactionPayLoading() {
  return useTransactionPayData(selectIsTransactionPayLoadingByTransactionId);
}

export function useTransactionPayTotals() {
  return useTransactionPayData(selectTransactionPayTotalsByTransactionId);
}

export function useTransactionPayIsMaxAmount() {
  return useTransactionPayData(selectTransactionPayIsMaxAmountByTransactionId);
}

export function useTransactionPayIsPostQuote() {
  return useTransactionPayData(selectTransactionPayIsPostQuoteByTransactionId);
}

export function useIsTransactionPayQuotePending() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const isLoading = useIsTransactionPayLoading();
  const isPostQuote = useTransactionPayIsPostQuote();
  const hasPositiveRequiredAmount =
    useTransactionPayHasPositiveRequiredAmount();

  if (isPerpsWithdrawTransaction(currentConfirmation)) {
    return hasPositiveRequiredAmount && (isLoading || !isPostQuote);
  }

  return isLoading;
}

export function useTransactionPayPrimaryRequiredToken() {
  const requiredTokens = useTransactionPayRequiredTokens();

  return useMemo(
    () => requiredTokens?.find((t) => !t.skipIfBalance),
    [requiredTokens],
  );
}

function useTransactionPayData<ReturnType>(
  selector: (state: TransactionPayState, transactionId: string) => ReturnType,
) {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';

  return useSelector((state: TransactionPayState) =>
    selector(state, transactionId),
  );
}
