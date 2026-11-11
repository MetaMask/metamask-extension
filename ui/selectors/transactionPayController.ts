import { createSelector } from 'reselect';
import type { TransactionPayControllerState } from '@metamask/transaction-pay-controller';
import type { AccountsState } from '../../shared/lib/selectors/accounts';
import {
  getEvmAccountOverride,
  getEvmPaymentToken,
} from '../../shared/lib/transaction/pay-token';

export type TransactionPayState = {
  metamask: TransactionPayControllerState;
};

export type TransactionPayAccountsState = {
  metamask: TransactionPayControllerState & AccountsState['metamask'];
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

export const selectTransactionPayQuotesByTransactionId = createSelector(
  selectTransactionDataByTransactionId,
  (transactionData) => transactionData?.quotes,
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

/**
 * The selected payment token when it is an EVM token, with the Hex chain ID
 * and token address derived from its asset ID.
 */
export const selectEvmPaymentTokenByTransactionId = createSelector(
  selectTransactionPaymentTokenByTransactionId,
  (paymentToken) => getEvmPaymentToken(paymentToken),
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
 * ID of the funding account override for a transaction, when the user picks a
 * different "From" account on money-account deposit (or similar)
 * confirmations.
 */
export const selectTransactionPayAccountOverrideByTransactionId =
  createSelector(
    selectTransactionDataByTransactionId,
    (transactionData) => transactionData?.accountOverride,
  );

/**
 * Address of the account override for a transaction when it is an EVM
 * account. A non-EVM override does not change the EVM account.
 */
export const selectTransactionPayEvmAccountOverrideByTransactionId =
  createSelector(
    (state: TransactionPayAccountsState, transactionId: string) =>
      selectTransactionPayAccountOverrideByTransactionId(state, transactionId),
    (state: TransactionPayAccountsState) =>
      state.metamask.internalAccounts.accounts,
    (accountOverride, accounts) =>
      getEvmAccountOverride(accountOverride, accounts),
  );

/**
 * Alternate payment strategy override (e.g. Money Account) for a transaction.
 */
export const selectPaymentOverrideByTransactionId = createSelector(
  selectTransactionDataByTransactionId,
  (transactionData) => transactionData?.paymentOverride,
);

/**
 * Fiat on-ramp payment state for a transaction, when the user pays by card.
 */
export const selectTransactionPayFiatPaymentByTransactionId = createSelector(
  selectTransactionDataByTransactionId,
  (transactionData) => transactionData?.fiatPayment,
);
