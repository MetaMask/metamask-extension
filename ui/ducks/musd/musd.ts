/**
 * MUSD Conversion Redux Slice
 *
 * This slice manages the state for the mUSD stablecoin conversion feature.
 * It tracks the conversion flow state, selected payment token, amounts,
 * quotes, and transaction status.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  MusdConversionState,
  MusdConversionFlowState as FlowState,
  ConvertibleToken,
  MusdConversionQuote,
} from '../../pages/musd-conversion/types';
import { MusdConversionFlowState } from '../../pages/musd-conversion/types';

/**
 * Initial state for the mUSD conversion feature
 */
export const initialState: MusdConversionState = {
  flowState: MusdConversionFlowState.IDLE,
  selectedPaymentToken: null,
  inputAmountFiat: '',
  inputAmountWei: '',
  outputAmountWei: '',
  quote: null,
  isQuoteLoading: false,
  quoteError: null,
  transactionId: null,
  transactionHash: null,
  transactionError: null,
  educationSeen: false,
  dismissedCtaKeys: [],
};

/**
 * Redux slice for mUSD conversion feature
 */
export const musdSlice = createSlice({
  name: 'musd',
  initialState,
  reducers: {
    /**
     * Set the current flow state
     *
     * @param state
     * @param action
     */
    setFlowState: (state, action: PayloadAction<FlowState>) => {
      state.flowState = action.payload;
    },

    /**
     * Set the selected payment token for conversion
     *
     * @param state
     * @param action
     */
    setSelectedPaymentToken: (
      state,
      action: PayloadAction<ConvertibleToken | null>,
    ) => {
      state.selectedPaymentToken = action.payload;
      // Reset quote when payment token changes
      if (action.payload !== null) {
        state.quote = null;
        state.quoteError = null;
      }
    },

    /**
     * Set the input amount in fiat (USD)
     *
     * @param state
     * @param action
     */
    setInputAmountFiat: (state, action: PayloadAction<string>) => {
      state.inputAmountFiat = action.payload;
    },

    /**
     * Set the input amount in wei (smallest unit)
     *
     * @param state
     * @param action
     */
    setInputAmountWei: (state, action: PayloadAction<string>) => {
      state.inputAmountWei = action.payload;
    },

    /**
     * Set the expected output amount in mUSD wei
     *
     * @param state
     * @param action
     */
    setOutputAmountWei: (state, action: PayloadAction<string>) => {
      state.outputAmountWei = action.payload;
    },

    /**
     * Set the current quote from Relay
     *
     * @param state
     * @param action
     */
    setQuote: (state, action: PayloadAction<MusdConversionQuote | null>) => {
      state.quote = action.payload;
      state.quoteError = null; // Clear error when new quote is set
      if (action.payload !== null) {
        state.isQuoteLoading = false;
      }
    },

    /**
     * Set quote loading state
     *
     * @param state
     * @param action
     */
    setQuoteLoading: (state, action: PayloadAction<boolean>) => {
      state.isQuoteLoading = action.payload;
      if (action.payload) {
        state.quoteError = null; // Clear error when starting to load
      }
    },

    /**
     * Set quote error
     *
     * @param state
     * @param action
     */
    setQuoteError: (state, action: PayloadAction<string | null>) => {
      state.quoteError = action.payload;
      state.isQuoteLoading = false;
    },

    /**
     * Set the transaction ID (before submission)
     *
     * @param state
     * @param action
     */
    setTransactionId: (state, action: PayloadAction<string | null>) => {
      state.transactionId = action.payload;
    },

    /**
     * Set the transaction hash (after submission)
     *
     * @param state
     * @param action
     */
    setTransactionHash: (state, action: PayloadAction<string | null>) => {
      state.transactionHash = action.payload;
    },

    /**
     * Set transaction error
     *
     * @param state
     * @param action
     */
    setTransactionError: (state, action: PayloadAction<string | null>) => {
      state.transactionError = action.payload;
    },

    /**
     * Set whether the education screen has been seen
     *
     * @param state
     * @param action
     */
    setEducationSeen: (state, action: PayloadAction<boolean>) => {
      state.educationSeen = action.payload;
    },

    /**
     * Add a dismissed CTA key (chainId-tokenAddress format)
     *
     * @param state
     * @param action
     */
    addDismissedCtaKey: (state, action: PayloadAction<string>) => {
      if (!state.dismissedCtaKeys.includes(action.payload)) {
        state.dismissedCtaKeys.push(action.payload);
      }
    },

    /**
     * Remove a dismissed CTA key
     *
     * @param state
     * @param action
     */
    removeDismissedCtaKey: (state, action: PayloadAction<string>) => {
      state.dismissedCtaKeys = state.dismissedCtaKeys.filter(
        (key) => key !== action.payload,
      );
    },

    /**
     * Reset conversion state while preserving education and dismissed CTAs
     * Used when user completes or cancels a conversion flow
     *
     * @param state
     */
    resetConversionState: (state) => {
      // Preserve persisted user preferences
      const { educationSeen, dismissedCtaKeys } = state;

      // Reset to initial state
      return {
        ...initialState,
        educationSeen,
        dismissedCtaKeys,
      };
    },

    /**
     * Fully reset all state (including persisted preferences)
     * Used for account switching or app reset
     */
    resetAllState: () => {
      return { ...initialState };
    },

    /**
     * Update multiple state fields at once
     *
     * @param state
     * @param action
     */
    updateState: (
      state,
      action: PayloadAction<Partial<MusdConversionState>>,
    ) => {
      return { ...state, ...action.payload };
    },
  },
});

// Export actions
export const {
  setFlowState,
  setSelectedPaymentToken,
  setInputAmountFiat,
  setInputAmountWei,
  setOutputAmountWei,
  setQuote,
  setQuoteLoading,
  setQuoteError,
  setTransactionId,
  setTransactionHash,
  setTransactionError,
  setEducationSeen,
  addDismissedCtaKey,
  removeDismissedCtaKey,
  resetConversionState,
  resetAllState,
  updateState,
} = musdSlice.actions;

// Export reducer
export default musdSlice.reducer;
