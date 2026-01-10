import { createSelector } from 'reselect';
import type { TransactionPayControllerState } from '@metamask/transaction-pay-controller';

type TransactionPayState = {
  metamask: {
    TransactionPayController?: TransactionPayControllerState;
  };
};

const selectTransactionPayControllerState = (state: TransactionPayState) =>
  state.metamask.TransactionPayController ?? {
    transactionData: {},
  };

export const selectTransactionDataByTransactionId = createSelector(
  selectTransactionPayControllerState,
  (_state: TransactionPayState, transactionId: string) => transactionId,
  (transactionPayControllerState, transactionId) =>
    transactionPayControllerState.transactionData[transactionId],
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (transactionData) => (transactionData as any)?.isMaxAmount ?? false,
);

export const selectTransactionPayTransactionData = createSelector(
  selectTransactionPayControllerState,
  (state) => state.transactionData,
);

