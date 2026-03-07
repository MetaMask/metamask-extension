import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { getTransactions } from '../../selectors/transactions';
import {
  selectTransactionPaymentTokenByTransactionId,
  type TransactionPayState,
} from '../../selectors/transactionPayController';

/**
 * Transaction statuses that indicate a conversion is "in flight":
 * - approved: User confirmed in wallet, waiting for submission
 * - signed: Transaction signed, waiting for broadcast
 * - submitted: Transaction submitted to network, waiting for confirmation
 */
const IN_FLIGHT_STATUSES: string[] = [
  TransactionStatus.approved,
  TransactionStatus.signed,
  TransactionStatus.submitted,
];

/**
 * Check if a transaction is an mUSD conversion.
 *
 * @param tx - The transaction metadata
 * @returns Whether the transaction is an mUSD conversion
 */
const isMusdConversionTx = (tx: TransactionMeta): boolean =>
  tx.type === TransactionType.musdConversion;

export type MusdConversionToastState =
  | 'in-progress'
  | 'success'
  | 'failed'
  | null;

/**
 * Hook that monitors mUSD conversion transaction status and provides toast state.
 *
 * Shows "in-progress" while a conversion is pending, "success" when confirmed,
 * and "failed" when the transaction fails or is dropped.
 *
 * Mirrors the `useMerklClaimStatus` hook behavior:
 * - approved/signed/submitted → in-progress toast
 * - confirmed → success toast
 * - failed/dropped → failed toast
 *
 * @returns An object containing `toastState` (current toast to display),
 * `sourceTokenSymbol` (the payment token symbol for the active conversion),
 * and `dismissToast` (function to dismiss the current toast).
 */
export const useMusdConversionToastStatus = (): {
  toastState: MusdConversionToastState;
  sourceTokenSymbol: string | undefined;
  dismissToast: () => void;
} => {
  const transactions = useSelector(getTransactions) as TransactionMeta[];
  const [completionState, setCompletionState] = useState<
    'success' | 'failed' | null
  >(null);
  const [dismissed, setDismissed] = useState(false);

  // Track IDs of pending conversions we've seen
  const pendingConversionIdsRef = useRef<Set<string>>(new Set());
  // Track IDs of conversions we've already shown completion toasts for
  const shownCompletionIdsRef = useRef<Set<string>>(new Set());

  const musdConversions = useMemo(
    () => transactions.filter(isMusdConversionTx),
    [transactions],
  );

  const pendingConversions = useMemo(
    () =>
      musdConversions.filter((tx) => IN_FLIGHT_STATUSES.includes(tx.status)),
    [musdConversions],
  );

  const hasPendingConversion = pendingConversions.length > 0;

  // Pick the most recent pending conversion to derive the source token symbol
  // getTransactions sorts ascending by time, so the last element is the newest
  const activePendingTxId =
    pendingConversions[pendingConversions.length - 1]?.id;

  // Read the payment token from TransactionPayController for the active tx
  const paymentToken = useSelector((state: TransactionPayState) =>
    activePendingTxId
      ? selectTransactionPaymentTokenByTransactionId(state, activePendingTxId)
      : undefined,
  );

  // Cache the symbol while the tx is still in-flight so it survives the
  // transition to confirmed/failed (when the tx leaves pendingConversions
  // and activePendingTxId becomes undefined).
  const [cachedSymbol, setCachedSymbol] = useState<string | undefined>(
    undefined,
  );
  const prevActivePendingTxIdRef = useRef<string | undefined>(undefined);

  // Clear stale cache when a NEW pending conversion becomes active, but
  // preserve it when the current conversion completes (id → undefined).
  useEffect(() => {
    if (activePendingTxId !== prevActivePendingTxIdRef.current) {
      if (activePendingTxId !== undefined) {
        setCachedSymbol(undefined);
      }
      prevActivePendingTxIdRef.current = activePendingTxId;
    }

    if (paymentToken?.symbol) {
      setCachedSymbol(paymentToken.symbol);
    }
  }, [activePendingTxId, paymentToken?.symbol]);

  const sourceTokenSymbol = paymentToken?.symbol ?? cachedSymbol;

  // Detect transitions from pending → confirmed/failed
  useEffect(() => {
    const currentPendingIds = new Set(pendingConversions.map((tx) => tx.id));
    let hasNewCompletion = false;

    for (const tx of musdConversions) {
      if (shownCompletionIdsRef.current.has(tx.id)) {
        continue;
      }

      const wasPending = pendingConversionIdsRef.current.has(tx.id);

      if (tx.status === TransactionStatus.confirmed && wasPending) {
        setCompletionState('success');
        setDismissed(false);
        shownCompletionIdsRef.current.add(tx.id);
        hasNewCompletion = true;
      } else if (
        (tx.status === TransactionStatus.failed ||
          tx.status === TransactionStatus.dropped) &&
        wasPending
      ) {
        setCompletionState('failed');
        setDismissed(false);
        shownCompletionIdsRef.current.add(tx.id);
        hasNewCompletion = true;
      }
    }

    // Reset dismissed and completion state if a new pending conversion appeared
    // so we show in-progress for the new conversion, not the previous completion toast.
    // Skip when a completion was just detected — the completion toast takes priority
    // and must not be overwritten by the null reset (React batches both setState calls).
    if (!hasNewCompletion) {
      for (const id of currentPendingIds) {
        if (!pendingConversionIdsRef.current.has(id)) {
          setCompletionState(null);
          setDismissed(false);
          break;
        }
      }
    }

    pendingConversionIdsRef.current = currentPendingIds;
  }, [musdConversions, pendingConversions]);

  const dismissToast = useCallback(() => {
    setCompletionState(null);
    setDismissed(true);
  }, []);

  // Completion state takes priority over pending state.
  // If the user dismissed the toast, hide it until a new state change resets `dismissed`.
  let toastState: MusdConversionToastState = null;
  if (!dismissed) {
    toastState =
      completionState ?? (hasPendingConversion ? 'in-progress' : null);
  }

  return { toastState, sourceTokenSymbol, dismissToast };
};
