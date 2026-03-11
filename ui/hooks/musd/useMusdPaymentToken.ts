/**
 * useMusdPaymentToken Hook
 *
 * Handles payment token selection for mUSD conversions with same-chain enforcement.
 * When a user selects a payment token on a different chain than the current transaction,
 * this hook automatically replaces the transaction to enforce same-chain conversions.
 *
 * Ported from metamask-mobile:
 * app/components/UI/Earn/hooks/useMusdPaymentToken.ts
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { useConfirmContext } from '../../pages/confirmations/context/confirm';
import { useTransactionPayToken } from '../../pages/confirmations/hooks/pay/useTransactionPayToken';
import {
  replaceMusdConversionTransactionForPayToken,
  type TransactionControllerCallbacks,
  type PayTokenSelection,
} from '../../components/app/musd/utils/transaction-utils';
import {
  addTransaction,
  findNetworkClientIdByChainId,
  rejectPendingApproval,
} from '../../store/actions';
import { updateTransactionPaymentToken } from '../../store/controller-actions/transaction-pay-controller';
import { CONFIRM_TRANSACTION_ROUTE } from '../../helpers/constants/routes';

/**
 * Return type for useMusdPaymentToken hook
 */
export type UseMusdPaymentTokenResult = {
  /**
   * Handle payment token change with same-chain enforcement.
   * If the selected token is on a different chain than the current transaction,
   * automatically replaces the transaction on the new chain.
   */
  onPaymentTokenChange: (token: PayTokenSelection) => Promise<void>;
  /**
   * Whether a transaction replacement is in progress
   */
  isReplacing: boolean;
};

/**
 * Hook for handling mUSD payment token selection with same-chain enforcement.
 *
 * This hook:
 * 1. Detects when a user selects a payment token on a different chain
 * 2. Automatically replaces the mUSD conversion transaction on the new chain
 * 3. Navigates to the new transaction's confirmation screen
 *
 * If the selected token is on the same chain, it simply updates the payment token.
 *
 * @returns Object with onPaymentTokenChange callback and isReplacing state
 */
export function useMusdPaymentToken(): UseMusdPaymentTokenResult {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { setPayToken } = useTransactionPayToken();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isReplacing, setIsReplacing] = useState(false);

  // Prevent rapid replacement attempts
  const isReplacingRef = useRef(false);

  /**
   * Controller callbacks for transaction replacement.
   * These wrap the extension's action creators.
   * Wrapped in useMemo to maintain stable reference.
   */
  const callbacks: TransactionControllerCallbacks = useMemo(
    () => ({
      addTransaction: async (txParams, options) => {
        return addTransaction(txParams, options);
      },

      findNetworkClientIdByChainId: async (chainId: Hex) => {
        return findNetworkClientIdByChainId(chainId);
      },

      updatePaymentToken: (params) => {
        updateTransactionPaymentToken(params);
      },

      rejectApproval: async (id) => {
        const serializedError = serializeError(
          providerErrors.userRejectedRequest(),
        );
        await (dispatch(
          rejectPendingApproval(id, serializedError),
        ) as unknown as Promise<void>);
      },
    }),
    [dispatch],
  );

  const onPaymentTokenChange = useCallback(
    async (token: PayTokenSelection) => {
      // Prevent duplicate replacement attempts
      if (isReplacingRef.current) {
        return;
      }

      const transactionChainId = currentConfirmation?.chainId;
      const selectedChainId = token.chainId;

      // Case-insensitive chain comparison
      const isChainMismatch =
        selectedChainId &&
        transactionChainId &&
        selectedChainId.toLowerCase() !== transactionChainId.toLowerCase();

      if (isChainMismatch && currentConfirmation) {
        // Chain mismatch detected - replace the transaction
        isReplacingRef.current = true;
        setIsReplacing(true);

        let didNavigate = false;
        try {
          const newTransactionId =
            await replaceMusdConversionTransactionForPayToken(
              currentConfirmation,
              token,
              callbacks,
            );

          if (newTransactionId) {
            didNavigate = true;
            const searchParams = location.search;
            navigate(
              `${CONFIRM_TRANSACTION_ROUTE}/${newTransactionId}${searchParams}`,
              { replace: true },
            );
          }
        } catch (error) {
          console.error(
            '[mUSD Conversion] Failed to replace transaction from PayWithModal',
            error,
          );
        } finally {
          isReplacingRef.current = false;
          if (!didNavigate) {
            setIsReplacing(false);
          }
        }

        return;
      }

      // Same chain - just update the payment token
      setPayToken(token);
    },
    [currentConfirmation, setPayToken, navigate, location.search, callbacks],
  );

  return {
    onPaymentTokenChange,
    isReplacing,
  };
}

export default useMusdPaymentToken;
