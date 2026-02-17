/**
 * MUSD Conversion Selectors
 *
 * Selectors for accessing mUSD conversion state from Redux.
 */

import { createSelector } from 'reselect';
import type {
  MusdConversionState,
  MusdConversionFlowState,
} from '../../pages/musd-conversion/types';

// Type for the root state that includes mUSD slice
type RootStateWithMusd = {
  musd: MusdConversionState;
};

// ============================================================================
// Base Selectors
// ============================================================================

/**
 * Select the entire mUSD state
 *
 * @param state
 */
export const selectMusdState = (
  state: RootStateWithMusd,
): MusdConversionState => state.musd;

/**
 * Select the current flow state
 */
export const selectMusdFlowState = createSelector(
  selectMusdState,
  (musd): MusdConversionFlowState => musd.flowState,
);

/**
 * Select the selected payment token
 */
export const selectSelectedPaymentToken = createSelector(
  selectMusdState,
  (musd) => musd.selectedPaymentToken,
);

/**
 * Select the input amount in fiat
 */
export const selectInputAmountFiat = createSelector(
  selectMusdState,
  (musd) => musd.inputAmountFiat,
);

/**
 * Select the input amount in wei
 */
export const selectInputAmountWei = createSelector(
  selectMusdState,
  (musd) => musd.inputAmountWei,
);

/**
 * Select the output amount in wei
 */
export const selectOutputAmountWei = createSelector(
  selectMusdState,
  (musd) => musd.outputAmountWei,
);

// ============================================================================
// Quote Selectors
// ============================================================================

/**
 * Select the current quote
 */
export const selectMusdQuote = createSelector(
  selectMusdState,
  (musd) => musd.quote,
);

/**
 * Select quote loading state
 */
export const selectIsQuoteLoading = createSelector(
  selectMusdState,
  (musd) => musd.isQuoteLoading,
);

/**
 * Select quote error
 */
export const selectQuoteError = createSelector(
  selectMusdState,
  (musd) => musd.quoteError,
);

/**
 * Select whether a valid quote is available
 */
export const selectHasValidQuote = createSelector(
  selectMusdQuote,
  selectQuoteError,
  (quote, error) => quote !== null && error === null,
);

// ============================================================================
// Transaction Selectors
// ============================================================================

/**
 * Select the transaction ID
 */
export const selectTransactionId = createSelector(
  selectMusdState,
  (musd) => musd.transactionId,
);

/**
 * Select the transaction hash
 */
export const selectTransactionHash = createSelector(
  selectMusdState,
  (musd) => musd.transactionHash,
);

/**
 * Select transaction error
 */
export const selectTransactionError = createSelector(
  selectMusdState,
  (musd) => musd.transactionError,
);

/**
 * Select whether a transaction is pending
 */
export const selectIsTransactionPending = createSelector(
  selectTransactionId,
  selectTransactionHash,
  (txId, txHash) => txId !== null && txHash === null,
);

// ============================================================================
// User Preference Selectors
// ============================================================================

/**
 * Select whether education has been seen
 */
export const selectEducationSeen = createSelector(
  selectMusdState,
  (musd) => musd.educationSeen,
);

/**
 * Select dismissed CTA keys
 */
export const selectDismissedCtaKeys = createSelector(
  selectMusdState,
  (musd) => musd.dismissedCtaKeys,
);

/**
 * Create a selector to check if a specific CTA has been dismissed
 *
 * @param ctaKey
 */
export const makeSelectIsCtaDismissed = (ctaKey: string) =>
  createSelector(selectDismissedCtaKeys, (keys) => keys.includes(ctaKey));

// ============================================================================
// Derived Selectors
// ============================================================================

/**
 * Select quote details for display
 */
export const selectQuoteDetails = createSelector(selectMusdQuote, (quote) => {
  if (!quote) {
    return null;
  }

  return {
    inputAmount: quote.details.currencyIn.amountFormatted,
    inputAmountUsd: quote.details.currencyIn.amountUsd,
    outputAmount: quote.details.currencyOut.amountFormatted,
    outputAmountUsd: quote.details.currencyOut.amountUsd,
    timeEstimate: quote.details.timeEstimate,
    totalImpact: quote.details.totalImpact,
  };
});

/**
 * Select fee breakdown from quote
 */
export const selectQuoteFees = createSelector(selectMusdQuote, (quote) => {
  if (!quote) {
    return null;
  }

  return {
    gasFee: quote.fees.gas.amountUsd,
    relayerFee: quote.fees.relayer.amountUsd,
    totalFee: (
      parseFloat(quote.fees.gas.amountUsd) +
      parseFloat(quote.fees.relayer.amountUsd)
    ).toString(),
  };
});

/**
 * Select conversion summary for display
 */
export const selectConversionSummary = createSelector(
  selectSelectedPaymentToken,
  selectInputAmountFiat,
  selectOutputAmountWei,
  selectQuoteDetails,
  selectQuoteFees,
  (paymentToken, inputFiat, outputWei, quoteDetails, fees) => {
    if (!paymentToken) {
      return null;
    }

    return {
      paymentToken: {
        symbol: paymentToken.symbol,
        name: paymentToken.name,
        chainId: paymentToken.chainId,
      },
      inputAmountFiat: inputFiat,
      outputAmountWei: outputWei,
      quoteDetails,
      fees,
    };
  },
);

/**
 * Select whether the conversion is ready to submit
 */
export const selectIsReadyToConvert = createSelector(
  selectSelectedPaymentToken,
  selectInputAmountFiat,
  selectHasValidQuote,
  selectIsQuoteLoading,
  (paymentToken, inputFiat, hasQuote, isLoading) =>
    paymentToken !== null &&
    inputFiat !== '' &&
    parseFloat(inputFiat) > 0 &&
    hasQuote &&
    !isLoading,
);
