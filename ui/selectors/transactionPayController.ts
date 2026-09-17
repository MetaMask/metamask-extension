import { createSelector } from 'reselect';
import type { TransactionPayControllerState } from '@metamask/transaction-pay-controller';
import type { TransactionControllerState } from '@metamask/transaction-controller';
import { selectTransactionById } from './transactionController';

export type TransactionPayState = {
  metamask: TransactionPayControllerState & TransactionControllerState;
};

export const selectTransactionPaySourceByTransactionId = createSelector(
  selectTransactionById,
  (transaction) => transaction?.metamaskPay?.source,
);

export const selectSolanaPayExecutionByTransactionId = createSelector(
  selectTransactionById,
  (transaction) => transaction?.metamaskPay?.solanaExecution,
);

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

export const selectTransactionPayQuotesByTransactionId = createSelector(
  selectTransactionDataByTransactionId,
  (transactionData) => transactionData?.quotes,
);

export const selectSolanaPayQuoteByTransactionId = createSelector(
  selectTransactionDataByTransactionId,
  (transactionData) => transactionData?.solanaPayQuote,
);

export const selectTransactionPayQuoteErrorByTransactionId = createSelector(
  selectTransactionDataByTransactionId,
  (transactionData) => transactionData?.quoteError,
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

export const selectTransactionPayIsPostQuoteByTransactionId = createSelector(
  selectTransactionDataByTransactionId,
  (transactionData) => transactionData?.isPostQuote ?? false,
);

/**
 * Funding account override for a transaction, when the user picks a different
 * "From" account on money-account deposit (or similar) confirmations.
 */
export const selectTransactionPayAccountOverrideByTransactionId =
  createSelector(
    selectTransactionDataByTransactionId,
    (transactionData) => transactionData?.accountOverride,
  );

/**
 * Alternate payment strategy override (e.g. Money Account) for a transaction.
 */
export const selectPaymentOverrideByTransactionId = createSelector(
  selectTransactionDataByTransactionId,
  (transactionData) => transactionData?.paymentOverride,
);
