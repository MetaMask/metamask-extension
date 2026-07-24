import { createSelector } from 'reselect';
import type {
  TransactionPayControllerState,
  TransactionPayQuote,
} from '@metamask/transaction-pay-controller';
import { TransactionPayStrategy } from '@metamask/transaction-pay-controller';

export type TransactionPayState = {
  metamask: TransactionPayControllerState;
};

/**
 * Check whether a quote is a no-op quote. The controller stores one when a
 * route needs no conversion. No-op quotes cannot be executed and must be
 * ignored anywhere quotes drive fees, steps, or routing UI.
 *
 * @param quote - Quote to check.
 * @returns True if the quote is a no-op.
 */
export function isNoOpQuote(
  quote: Pick<TransactionPayQuote<unknown>, 'strategy'>,
): boolean {
  return quote.strategy === TransactionPayStrategy.None;
}

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
    transactionData.quotes.filter((quote) => !isNoOpQuote(quote)),
);

/**
 * Whether the controller has finished quoting for this transaction,
 * including no-op quotes that mark a direct route with no conversion.
 */
export const selectHasTransactionPayResolvedQuotesByTransactionId =
  createSelector(selectTransactionDataByTransactionId, (transactionData) =>
    Boolean(transactionData?.quotes?.length),
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
