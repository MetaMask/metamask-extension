import { createSelector } from 'reselect';
import type { TransactionPayControllerState } from '@metamask/transaction-pay-controller';

export type TransactionPayState = {
  metamask: TransactionPayControllerState;
};

export const selectTransactionDataByTransactionId = createSelector(
  (state: TransactionPayState) => state,
  (_state: TransactionPayState, transactionId: string) => transactionId,
  (state: TransactionPayState, transactionId: string) =>
    state.metamask.transactionData[transactionId],
);

export const selectTransactionPayTotalsByTransactionId = createSelector(
  selectTransactionDataByTransactionId,
  (transactionData) => transactionData?.totals,
);

export const selectIsTransactionPayLoadingByTransactionId = createSelector(
  selectTransactionDataByTransactionId,
  (transactionData) => transactionData?.isLoading ?? false,
);

export const selectTransactionPayQuotesByTransactionId = createSelector(
  selectTransactionDataByTransactionId,
  (transactionData) => transactionData?.quotes,
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
  // TODO: Remove type assertion once isMaxAmount is added to @metamask/transaction-pay-controller
  (transactionData) =>
    (transactionData as { isMaxAmount?: boolean } | undefined)?.isMaxAmount ??
    false,
);
