/**
 * useMusdConversion Hook
 *
 * Main hook for managing the mUSD stablecoin conversion flow.
 * Orchestrates navigation, transaction creation, and duplicate prevention.
 *
 * The actual amount entry and relay quoting are handled on the
 * confirmation screen by useTransactionCustomAmount and TransactionPayController.
 * This hook is only responsible for:
 * - Starting the flow (education -> placeholder tx -> confirm screen)
 * - Duplicate-preventing transaction creation
 * - Cancelling (navigate back)
 */

import { useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { Hex } from '@metamask/utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  selectIsMusdConversionFlowEnabled,
  selectMusdConversionEducationSeen,
} from '../../selectors/musd';
import { getSelectedInternalAccount } from '../../selectors';
import { getUnapprovedTransactions } from '../../selectors/transactions';
import {
  addTransaction,
  findNetworkClientIdByChainId,
  setMusdConversionEducationSeen,
} from '../../store/actions';
import {
  buildMusdConversionTx,
  isMatchingMusdConversion,
} from '../../components/app/musd/utils';
import { CONFIRM_TRANSACTION_ROUTE } from '../../helpers/constants/routes';
import { MUSD_CONVERSION_EDUCATION_ROUTE } from '../../pages/musd/constants/routes';
import { ConfirmationLoader } from '../../pages/confirmations/hooks/useConfirmationNavigation';
import { MUSD_CONVERSION_DEFAULT_CHAIN_ID } from '../../components/app/musd/constants';
import { updateTransactionPaymentToken } from '../../store/controller-actions/transaction-pay-controller';
import { useMusdGeoBlocking } from './useMusdGeoBlocking';

// ============================================================================
// Types
// ============================================================================

export type UseMusdConversionResult = {
  educationSeen: boolean;

  isFeatureEnabled: boolean;
  isUserGeoBlocked: boolean;
  /** Whether the geolocation check is still in progress */
  isGeoLoading: boolean;

  startConversionFlow: (options?: StartConversionOptions) => Promise<void>;
  cancelConversion: () => void;
  markEducationSeen: () => void;

  error: string | null;
};

export type StartConversionOptions = {
  /** Preferred payment token to pre-select */
  preferredToken?: { address: string; chainId: Hex };
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

function getInitiationKey(params: {
  selectedAddress: string;
  chainId: Hex;
}): string {
  const { selectedAddress, chainId } = params;
  return `${selectedAddress.toLowerCase()}_${chainId.toLowerCase()}`;
}

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
 * Hook for managing mUSD conversion flow.
 *
 * Amount entry and relay quoting are handled entirely by the confirmation
 * screen (useTransactionCustomAmount + TransactionPayController).
 *
 * @returns Object with state and actions for mUSD conversion
 */
export function useMusdConversion(): UseMusdConversionResult {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;
  const unapprovedTransactions = useSelector(getUnapprovedTransactions);

  const educationSeen = useSelector(selectMusdConversionEducationSeen);
  const isFeatureEnabled = useSelector(selectIsMusdConversionFlowEnabled);

  const { isBlocked: isUserGeoBlocked, isLoading: isGeoLoading } =
    useMusdGeoBlocking();

  const createConversionTransaction = useCallback(
    async (params: {
      chainId: Hex;
      fromAddress: Hex;
      amountHex: string;
    }): Promise<string> => {
      const { chainId, fromAddress, amountHex } = params;

      const networkClientId = await findNetworkClientIdByChainId(chainId);

      const { txParams, addTxOptions } = buildMusdConversionTx({
        chainId,
        fromAddress,
        recipientAddress: fromAddress,
        amountHex,
        networkClientId,
      });

      const transactionMeta = await addTransaction(txParams, addTxOptions);

      return transactionMeta.id;
    },
    [],
  );

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
      const { preferredToken, skipEducation } = options;

      if (!isFeatureEnabled) {
        console.warn('[MUSD] Conversion flow not enabled');
        return;
      }

      if (isGeoLoading) {
        console.warn('[MUSD] Geo-blocking check still in progress');
        return;
      }

      if (isUserGeoBlocked) {
        console.warn('[MUSD] User is geo-blocked');
        return;
      }

      if (!educationSeen && !skipEducation) {
        navigate(MUSD_CONVERSION_EDUCATION_ROUTE);
        return;
      }

      if (!selectedAddress) {
        return;
      }

      const chainId =
        (preferredToken?.chainId as Hex) ?? MUSD_CONVERSION_DEFAULT_CHAIN_ID;

      try {
        setError(null);

        const existing = findExistingPendingMusdConversion({
          unapprovedTransactions: unapprovedTransactions as Record<
            string,
            TransactionMeta
          >,
          selectedAddress,
          chainId,
        });

        let txId: string;

        if (existing?.id) {
          txId = existing.id;
        } else {
          const initiationKey = getInitiationKey({
            selectedAddress,
            chainId,
          });
          const inFlightInitiation =
            inFlightInitiationPromises.get(initiationKey);

          if (inFlightInitiation === undefined) {
            const initiationPromise = createConversionTransaction({
              chainId,
              fromAddress: selectedAddress as Hex,
              amountHex: '0x0',
            });

            inFlightInitiationPromises.set(
              initiationKey,
              initiationPromise.catch(() => undefined),
            );

            try {
              const newTxId = await initiationPromise;
              txId = newTxId;
            } catch (err) {
              console.error('[MUSD] Transaction creation failed:', err);
              setError('Failed to start conversion');
              return;
            } finally {
              inFlightInitiationPromises.delete(initiationKey);
            }
          } else {
            const existingTxId = await inFlightInitiation;
            if (existingTxId) {
              txId = existingTxId;
            } else {
              setError('Failed to start conversion');
              return;
            }
          }
        }

        if (preferredToken?.address) {
          try {
            await updateTransactionPaymentToken({
              transactionId: txId,
              tokenAddress: preferredToken.address as `0x${string}`,
              chainId,
            });
          } catch (payTokenError) {
            console.warn(
              '[MUSD] Failed to pre-select payment token, proceeding to confirmation:',
              payTokenError,
            );
          }
        }

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
      }
    },
    [
      isFeatureEnabled,
      isGeoLoading,
      isUserGeoBlocked,
      educationSeen,
      selectedAddress,
      unapprovedTransactions,
      createConversionTransaction,
      navigate,
    ],
  );

  const cancelConversion = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const markEducationSeen = useCallback(() => {
    dispatch(setMusdConversionEducationSeen(true));
  }, [dispatch]);

  return {
    educationSeen,

    isFeatureEnabled,
    isUserGeoBlocked,
    isGeoLoading,

    startConversionFlow,
    cancelConversion,
    markEducationSeen,

    error,
  };
}

export default useMusdConversion;
