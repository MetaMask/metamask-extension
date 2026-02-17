/**
 * useMusdConversion Hook
 *
 * Main hook for managing the mUSD stablecoin conversion flow.
 * Orchestrates state management, navigation, and transaction creation.
 *
 * Ported from metamask-mobile:
 * app/components/UI/Earn/hooks/useMusdConversion.ts
 */

import { useCallback, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { Hex } from '@metamask/utils';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  setFlowState,
  setSelectedPaymentToken,
  setInputAmountFiat,
  setInputAmountWei,
  setOutputAmountWei,
  setQuote,
  setQuoteLoading,
  setQuoteError,
  setTransactionId,
  setEducationSeen,
  resetConversionState,
  selectMusdFlowState,
  selectSelectedPaymentToken,
  selectInputAmountFiat,
  selectOutputAmountWei,
  selectMusdQuote,
  selectIsQuoteLoading,
  selectQuoteError,
  selectEducationSeen,
  selectIsReadyToConvert,
  selectQuoteDetails,
  selectQuoteFees,
} from '../../ducks/musd';
import {
  selectIsMusdConversionFlowEnabled,
  selectMusdBlockedRegions,
  selectMusdConvertibleTokensAllowlist,
  selectMusdConvertibleTokensBlocklist,
  selectMusdMinAssetBalanceRequired,
} from '../../selectors/musd';
import { getSelectedInternalAccount } from '../../selectors';
import { getUnapprovedTransactions } from '../../selectors/transactions';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import {
  MusdConversionFlowState,
  type ConvertibleToken,
  type MusdConversionQuote,
} from '../../pages/musd-conversion/types';
import {
  convertToMusdAmount,
  getMusdOutputAmount,
  validateConversionAmount,
  isGeoBlocked,
} from '../../../shared/lib/musd';
import {
  buildMusdConversionTx,
  isMatchingMusdConversion,
} from '../../../shared/lib/musd/transaction-utils';
import {
  CONFIRM_TRANSACTION_ROUTE,
  MUSD_CONVERSION_EDUCATION_ROUTE,
} from '../../helpers/constants/routes';
import { ConfirmationLoader } from '../../pages/confirmations/hooks/useConfirmationNavigation';
import {
  MUSD_TOKEN_ADDRESS,
  MUSD_CONVERSION_DEFAULT_CHAIN_ID,
  RELAY_API_ENDPOINTS,
} from '../../../shared/constants/musd';
import { useMusdGeoBlocking } from './useMusdGeoBlocking';

// ============================================================================
// Types
// ============================================================================

export type UseMusdConversionResult = {
  // State
  flowState: MusdConversionFlowState;
  selectedPaymentToken: ConvertibleToken | null;
  inputAmountFiat: string;
  outputAmountWei: string;
  quote: MusdConversionQuote | null;
  isQuoteLoading: boolean;
  quoteError: string | null;
  educationSeen: boolean;
  isReadyToConvert: boolean;
  quoteDetails: ReturnType<typeof selectQuoteDetails>;
  quoteFees: ReturnType<typeof selectQuoteFees>;

  // Feature flags and eligibility
  isFeatureEnabled: boolean;
  isUserGeoBlocked: boolean;

  // Actions
  startConversionFlow: (options?: StartConversionOptions) => Promise<void>;
  selectPaymentToken: (token: ConvertibleToken | null) => void;
  setAmount: (amountFiat: string) => void;
  fetchQuote: () => Promise<void>;
  submitConversion: () => Promise<string | null>;
  cancelConversion: () => void;
  markEducationSeen: () => void;

  // Validation
  validateAmount: (
    amount: string,
  ) => ReturnType<typeof validateConversionAmount>;

  // Error state
  error: string | null;
};

export type StartConversionOptions = {
  /** Preferred payment token to pre-select */
  preferredToken?: ConvertibleToken;
  /** Skip education screen even if not seen */
  skipEducation?: boolean;
  /** Entry point for analytics */
  entryPoint?: 'home' | 'token_list' | 'asset_overview' | 'deeplink';
};

// ============================================================================
// Duplicate Prevention Mechanisms
// ============================================================================

/**
 * Why do we have BOTH `findExistingPendingMusdConversion` AND `inFlightInitiationPromises`?
 *
 * These protect against two *different* duplication mechanisms:
 *
 * 1) `findExistingPendingMusdConversion` (post-approval creation / observable state):
 * Once a `musdConversion` transaction is added, it becomes a pending approval in Redux.
 * Subsequent CTA presses should **re-enter that existing flow** rather than creating a new tx.
 *
 * 2) `inFlightInitiationPromises` (pre-approval creation race window):
 * There is a short window after the CTA press where we have started the async initiation
 * but the pending approval is not yet observable in Redux. Rapid spam during that window
 * can otherwise create multiple transactions before (1) can detect an existing pending tx.
 */
const inFlightInitiationPromises = new Map<
  string,
  Promise<string | undefined>
>();

/**
 * Generate a unique key for tracking in-flight initiation promises.
 * Keyed by account address and chain ID to prevent duplicates per account/chain combo.
 *
 * @param params
 * @param params.selectedAddress
 * @param params.chainId
 */
function getInitiationKey(params: {
  selectedAddress: string;
  chainId: Hex;
}): string {
  const { selectedAddress, chainId } = params;
  return `${selectedAddress.toLowerCase()}_${chainId.toLowerCase()}`;
}

/**
 * Find an existing pending mUSD conversion transaction for the given account and chain.
 * Used to prevent creating duplicate transactions.
 *
 * @param params - Parameters for finding an existing pending mUSD conversion transaction
 * @param params.unapprovedTransactions - Unapproved transactions
 * @param params.selectedAddress - Selected account address
 * @param params.chainId - Chain ID
 */
function findExistingPendingMusdConversion(params: {
  unapprovedTransactions: Record<string, TransactionMeta>;
  selectedAddress: string;
  chainId: Hex;
}): TransactionMeta | undefined {
  const { unapprovedTransactions, selectedAddress, chainId } = params;

  return Object.values(unapprovedTransactions).find((transactionMeta) =>
    isMatchingMusdConversion(transactionMeta, selectedAddress, chainId),
  );
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing mUSD conversion flow
 *
 * @param userCountry - User's country code for geo-blocking check
 * @returns Object with state and actions for mUSD conversion
 */
export function useMusdConversion(): UseMusdConversionResult {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Selectors
  // ============================================================================

  // Account and transactions
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;
  const unapprovedTransactions = useSelector(getUnapprovedTransactions);

  // Flow state
  const flowState = useSelector(selectMusdFlowState);
  const selectedPaymentToken = useSelector(selectSelectedPaymentToken);
  const inputAmountFiat = useSelector(selectInputAmountFiat);
  const outputAmountWei = useSelector(selectOutputAmountWei);
  const quote = useSelector(selectMusdQuote);
  const isQuoteLoading = useSelector(selectIsQuoteLoading);
  const quoteError = useSelector(selectQuoteError);
  const educationSeen = useSelector(selectEducationSeen);
  const isReadyToConvert = useSelector(selectIsReadyToConvert);
  const quoteDetails = useSelector(selectQuoteDetails);
  const quoteFees = useSelector(selectQuoteFees);

  // Feature flags
  const isFeatureEnabled = useSelector(selectIsMusdConversionFlowEnabled);
  const blockedRegions = useSelector(selectMusdBlockedRegions);
  const allowlist = useSelector(selectMusdConvertibleTokensAllowlist);
  const blocklist = useSelector(selectMusdConvertibleTokensBlocklist);
  const minBalanceRequired = useSelector(selectMusdMinAssetBalanceRequired);

  // ============================================================================
  // Derived State
  // ============================================================================

  const { isBlocked: isUserGeoBlocked } = useMusdGeoBlocking();
  // ============================================================================
  // Internal Transaction Creation
  // ============================================================================

  /**
   * Creates the mUSD conversion transaction.
   * Returns the transaction ID.
   */
  const createConversionTransaction = useCallback(
    async (params: {
      chainId: Hex;
      fromAddress: Hex;
      amountHex: string;
    }): Promise<string> => {
      const { chainId, fromAddress, amountHex } = params;

      // Find the network client ID for this chain
      const networkClientId = await findNetworkClientIdByChainId(chainId);

      // Build transaction parameters
      const { txParams, addTxOptions } = buildMusdConversionTx({
        chainId,
        fromAddress,
        recipientAddress: fromAddress, // Self-transfer for conversion
        amountHex,
        networkClientId,
      });

      // Add the transaction
      const transactionMeta = await addTransaction(txParams, addTxOptions);

      return transactionMeta.id;
    },
    [],
  );

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Start the mUSD conversion flow.
   *
   * If education has been seen (or skipEducation is true), creates a
   * musdConversion transaction with a placeholder amount and navigates
   * directly to the pay-with confirmation screen. Otherwise, navigates
   * to the education screen first.
   */
  const startConversionFlow = useCallback(
    async (options: StartConversionOptions = {}): Promise<void> => {
      const { preferredToken, skipEducation, entryPoint } = options;

      console.log('[MUSD CTA Debug] startConversionFlow', {
        preferredToken,
        skipEducation,
        entryPoint,
        isFeatureEnabled,
        isUserGeoBlocked,
        educationSeen,
      });

      // Check eligibility
      if (!isFeatureEnabled) {
        console.warn('[MUSD] Conversion flow not enabled');
        return;
      }

      if (isUserGeoBlocked) {
        console.warn('[MUSD] User is geo-blocked');
        return;
      }

      // Pre-select payment token if provided
      if (preferredToken) {
        dispatch(setSelectedPaymentToken(preferredToken));
      }

      // If education not yet seen, show education screen first
      if (!educationSeen && !skipEducation) {
        dispatch(setFlowState(MusdConversionFlowState.EDUCATION));
        navigate(MUSD_CONVERSION_EDUCATION_ROUTE);
        return;
      }

      // Education seen — create tx and navigate to pay-with confirmation
      if (!selectedAddress) {
        console.warn('[MUSD] No account selected');
        return;
      }

      const chainId =
        (preferredToken?.chainId as Hex) ?? MUSD_CONVERSION_DEFAULT_CHAIN_ID;

      try {
        dispatch(setFlowState(MusdConversionFlowState.CONFIRMING_TRANSACTION));

        // Duplicate prevention: check for existing pending conversion
        const existing = findExistingPendingMusdConversion({
          unapprovedTransactions,
          selectedAddress,
          chainId,
        });

        let txId: string;

        if (existing?.id) {
          console.log(
            '[MUSD] Found existing pending conversion, re-using:',
            existing.id,
          );
          txId = existing.id;
        } else {
          // Duplicate prevention: check for in-flight initiation
          const initiationKey = getInitiationKey({
            selectedAddress,
            chainId,
          });
          const inFlightInitiation =
            inFlightInitiationPromises.get(initiationKey);

          if (inFlightInitiation) {
            console.log('[MUSD] Awaiting in-flight initiation');
            const existingTxId = await inFlightInitiation;
            if (existingTxId) {
              txId = existingTxId;
            } else {
              console.error('[MUSD] In-flight initiation returned no txId');
              dispatch(setFlowState(MusdConversionFlowState.ERROR));
              return;
            }
          } else {
            // Create the initiation promise
            const initiationPromise = createConversionTransaction({
              chainId,
              fromAddress: selectedAddress as Hex,
              amountHex: '0x0', // Placeholder; real amount set on confirm screen
            }).then(
              (id) => id,
              (err) => {
                console.error('[MUSD] Transaction creation failed:', err);
                return undefined;
              },
            );

            inFlightInitiationPromises.set(initiationKey, initiationPromise);

            try {
              const newTxId = await initiationPromise;
              if (!newTxId) {
                dispatch(setFlowState(MusdConversionFlowState.ERROR));
                return;
              }
              txId = newTxId;
            } finally {
              inFlightInitiationPromises.delete(initiationKey);
            }
          }
        }

        dispatch(setTransactionId(txId));
        dispatch(setFlowState(MusdConversionFlowState.PENDING_TX));

        navigate({
          pathname: `${CONFIRM_TRANSACTION_ROUTE}/${txId}`,
          search: new URLSearchParams({
            loader: ConfirmationLoader.CustomAmount,
          }).toString(),
        });
      } catch (flowError) {
        const errorMessage =
          flowError instanceof Error
            ? flowError.message
            : 'Failed to start conversion';
        console.error('[MUSD] startConversionFlow failed:', flowError);
        setError(errorMessage);
        dispatch(setFlowState(MusdConversionFlowState.ERROR));
      }
    },
    [
      isFeatureEnabled,
      isUserGeoBlocked,
      educationSeen,
      selectedAddress,
      unapprovedTransactions,
      createConversionTransaction,
      dispatch,
      navigate,
    ],
  );

  /**
   * Select a payment token for conversion
   */
  const selectPaymentToken = useCallback(
    (token: ConvertibleToken | null) => {
      dispatch(setSelectedPaymentToken(token));

      // Reset quote when token changes
      if (token) {
        dispatch(setQuote(null));
        dispatch(setQuoteError(null));
      }
    },
    [dispatch],
  );

  /**
   * Set the conversion amount (in fiat)
   */
  const setAmount = useCallback(
    (amountFiat: string) => {
      dispatch(setInputAmountFiat(amountFiat));

      // Convert to wei
      const amountWei = convertToMusdAmount(amountFiat);
      dispatch(setInputAmountWei(amountWei));

      // Calculate expected output
      const { outputAmountWei: calculatedOutputWei } = getMusdOutputAmount({
        inputAmountUsd: amountFiat,
      });
      dispatch(setOutputAmountWei(calculatedOutputWei));
    },
    [dispatch],
  );

  /**
   * Fetch a quote from the Relay API via TransactionPayController.
   * Uses submitRequestToBackground to call the background process.
   */
  const fetchQuote = useCallback(async () => {
    if (!selectedPaymentToken || !inputAmountFiat) {
      console.warn('[MUSD] Cannot fetch quote: missing token or amount');
      return;
    }

    if (!selectedAddress) {
      console.warn('[MUSD] Cannot fetch quote: no account selected');
      return;
    }

    dispatch(setQuoteLoading(true));
    dispatch(setQuoteError(null));
    dispatch(setFlowState(MusdConversionFlowState.LOADING_QUOTE));

    try {
      // Try to use TransactionPayController's quote fetching if available
      // Otherwise fall back to direct Relay API call
      let quoteResponse: MusdConversionQuote;

      try {
        // Attempt to use the background TransactionPayController
        quoteResponse = await submitRequestToBackground<MusdConversionQuote>(
          'getMusdConversionQuote',
          [
            {
              user: selectedAddress,
              originChainId: parseInt(selectedPaymentToken.chainId, 16),
              destinationChainId: parseInt(selectedPaymentToken.chainId, 16),
              originCurrency: selectedPaymentToken.address,
              destinationCurrency: MUSD_TOKEN_ADDRESS,
              amount: convertToMusdAmount(inputAmountFiat),
              recipient: selectedAddress,
            },
          ],
        );
      } catch (backgroundError) {
        // Background method not available, use direct Relay API call
        console.warn(
          '[MUSD] Background quote fetch not available, using direct API',
        );

        const response = await fetch(RELAY_API_ENDPOINTS.QUOTE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: selectedAddress,
            originChainId: parseInt(selectedPaymentToken.chainId, 16),
            destinationChainId: parseInt(selectedPaymentToken.chainId, 16),
            originCurrency: selectedPaymentToken.address,
            destinationCurrency: MUSD_TOKEN_ADDRESS,
            amount: convertToMusdAmount(inputAmountFiat),
            recipient: selectedAddress,
          }),
        });

        if (!response.ok) {
          throw new Error(`Relay API error: ${response.status}`);
        }

        quoteResponse = await response.json();
      }

      dispatch(setQuote(quoteResponse));
      dispatch(setFlowState(MusdConversionFlowState.QUOTE_READY));
    } catch (fetchError) {
      const errorMessage =
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to fetch quote';
      console.error('[MUSD] Quote fetch failed:', fetchError);
      dispatch(setQuoteError(errorMessage));
      dispatch(setFlowState(MusdConversionFlowState.ERROR));
    } finally {
      dispatch(setQuoteLoading(false));
    }
  }, [selectedPaymentToken, inputAmountFiat, selectedAddress, dispatch]);

  /**
   * Submit the conversion transaction with duplicate prevention.
   * Ensures only one transaction is created per account/chain combination.
   */
  const submitConversion = useCallback(async (): Promise<string | null> => {
    if (!isReadyToConvert || !quote || !selectedPaymentToken) {
      console.warn('[MUSD] Cannot submit: not ready, no quote, or no token');
      return null;
    }

    if (!selectedAddress) {
      setError('No account selected');
      return null;
    }

    try {
      setError(null);

      const chainId = selectedPaymentToken.chainId as Hex;

      // Check for existing pending mUSD conversion (post-creation duplicate prevention)
      const existingPendingMusdConversion = findExistingPendingMusdConversion({
        unapprovedTransactions,
        selectedAddress,
        chainId,
      });

      if (existingPendingMusdConversion?.id) {
        // Re-enter existing flow instead of creating a new transaction
        console.log(
          '[MUSD] Found existing pending conversion, re-using:',
          existingPendingMusdConversion.id,
        );
        dispatch(setTransactionId(existingPendingMusdConversion.id));
        dispatch(setFlowState(MusdConversionFlowState.PENDING_TX));
        return existingPendingMusdConversion.id;
      }

      // Check for in-flight initiation (pre-creation duplicate prevention)
      const initiationKey = getInitiationKey({ selectedAddress, chainId });
      const inFlightInitiation = inFlightInitiationPromises.get(initiationKey);

      if (inFlightInitiation) {
        console.log('[MUSD] Awaiting in-flight initiation');
        const existingTxId = await inFlightInitiation;
        return existingTxId ?? null;
      }

      // Create the initiation promise
      const initiationPromise = (async (): Promise<string | undefined> => {
        dispatch(setFlowState(MusdConversionFlowState.CONFIRMING_TRANSACTION));

        try {
          // Convert the input amount to hex
          const amountHex = `0x${BigInt(convertToMusdAmount(inputAmountFiat)).toString(16)}`;

          const transactionId = await createConversionTransaction({
            chainId,
            fromAddress: selectedAddress as Hex,
            amountHex,
          });

          dispatch(setTransactionId(transactionId));
          dispatch(setFlowState(MusdConversionFlowState.PENDING_TX));

          // Optionally update payment token selection in TransactionPayController
          try {
            await submitRequestToBackground('updatePaymentToken', [
              {
                transactionId,
                tokenAddress: selectedPaymentToken.address,
                chainId,
              },
            ]);
          } catch (updateError) {
            // Non-critical, continue even if update fails
            console.warn('[MUSD] Failed to update payment token:', updateError);
          }

          return transactionId;
        } catch (txError) {
          console.error('[MUSD] Transaction creation failed:', txError);
          const errorMessage =
            txError instanceof Error ? txError.message : 'Transaction failed';
          setError(errorMessage);
          dispatch(setQuoteError(errorMessage));
          dispatch(setFlowState(MusdConversionFlowState.ERROR));
          return undefined;
        }
      })();

      // Track the in-flight initiation
      inFlightInitiationPromises.set(initiationKey, initiationPromise);

      try {
        const transactionId = await initiationPromise;
        return transactionId ?? null;
      } finally {
        // Clean up the in-flight tracking
        inFlightInitiationPromises.delete(initiationKey);
      }
    } catch (submitError) {
      const errorMessage =
        submitError instanceof Error
          ? submitError.message
          : 'Failed to submit conversion';
      console.error('[MUSD] Submit conversion failed:', submitError);
      setError(errorMessage);
      dispatch(setFlowState(MusdConversionFlowState.ERROR));
      return null;
    }
  }, [
    isReadyToConvert,
    quote,
    selectedPaymentToken,
    selectedAddress,
    unapprovedTransactions,
    inputAmountFiat,
    createConversionTransaction,
    dispatch,
  ]);

  /**
   * Cancel the current conversion flow
   */
  const cancelConversion = useCallback(() => {
    dispatch(resetConversionState());
    navigate(-1); // Go back
  }, [dispatch, navigate]);

  /**
   * Mark education screen as seen
   */
  const markEducationSeen = useCallback(() => {
    dispatch(setEducationSeen(true));
  }, [dispatch]);

  /**
   * Validate a conversion amount
   */
  const validateAmount = useCallback(
    (amount: string) => {
      if (!selectedPaymentToken) {
        return {
          isValid: false,
          error: 'invalid_amount' as const,
          message: 'Please select a payment token',
        };
      }

      return validateConversionAmount({
        amount,
        balance: selectedPaymentToken.balance,
        tokenDecimals: selectedPaymentToken.decimals,
        minAmountUsd: minBalanceRequired,
        fiatBalance: parseFloat(selectedPaymentToken.fiatBalance),
      });
    },
    [selectedPaymentToken, minBalanceRequired],
  );

  // ============================================================================
  // Return Value
  // ============================================================================

  return {
    // State
    flowState,
    selectedPaymentToken,
    inputAmountFiat,
    outputAmountWei,
    quote,
    isQuoteLoading,
    quoteError,
    educationSeen,
    isReadyToConvert,
    quoteDetails,
    quoteFees,

    // Feature flags and eligibility
    isFeatureEnabled,
    isUserGeoBlocked,

    // Actions
    startConversionFlow,
    selectPaymentToken,
    setAmount,
    fetchQuote,
    submitConversion,
    cancelConversion,
    markEducationSeen,

    // Validation
    validateAmount,

    // Error state
    error,
  };
}

export default useMusdConversion;
