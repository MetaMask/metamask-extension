import { createSelector } from 'reselect';
import type { TransactionPayControllerState } from '@metamask/transaction-pay-controller';
import { TransactionPayStrategy } from '@metamask/transaction-pay-controller';

export type TransactionPayState = {
  metamask: TransactionPayControllerState;
};

export const selectTransactionDataByTransactionId = createSelector(
  (state: TransactionPayState) => state,
  (_state: TransactionPayState, transactionId: string) => transactionId,
  (state: TransactionPayState, transactionId: string) =>
    state.metamask.transactionData?.[transactionId],
);

export const selectTransactionPayTotalsByTransactionId = createSelector(
  selectTransactionDataByTransactionId,
  (transactionData) => transactionData?.totals,
);

export const selectIsTransactionPayLoadingByTransactionId = createSelector(
  selectTransactionDataByTransactionId,
  (transactionData) => transactionData?.isLoading ?? false,
);

// Executable quotes only. No-op quotes mark direct routes and must not
// surface in fee, duration, or step UI, so they are filtered here for all
// consumers.
export const selectTransactionPayQuotesByTransactionId = createSelector(
  selectTransactionDataByTransactionId,
  (transactionData) =>
    transactionData?.quotes &&
    transactionData.quotes.filter(
      (quote) => quote.strategy !== TransactionPayStrategy.None,
    ),
);

export const selectTransactionPayTokensByTransactionId = createSelector(
  selectTransactionDataByTransactionId,
  (transactionData) => transactionData?.tokens ?? [],
);

export const selectTransactionPaymentTokenByTransactionId = createSelector(
  selectTransactionDataByTransactionId,
  (transactionData) => transactionData?.paymentToken,
);

export const selectTransactionPaySourceAmountsByTransactionId = createSelector(
  selectTransactionDataByTransactionId,
  (transactionData) => transactionData?.sourceAmounts,
);

export const selectTransactionPayIsMaxAmountByTransactionId = createSelector(
  selectTransactionDataByTransactionId,
  (transactionData) => transactionData?.isMaxAmount ?? false,
);
