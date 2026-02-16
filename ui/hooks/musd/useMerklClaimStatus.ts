import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { getTransactions } from '../../selectors/transactions';

export const MERKL_DISTRIBUTOR_ADDRESS =
  '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae' as const;

/**
 * Transaction statuses that indicate a claim is "in flight":
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
 * Check if a transaction is a Merkl claim by matching the distributor address.
 *
 * @param tx - The transaction metadata
 * @returns Whether the transaction is a Merkl claim
 */
const isMerklClaimTransaction = (tx: TransactionMeta): boolean =>
  tx.txParams?.to?.toLowerCase() === MERKL_DISTRIBUTOR_ADDRESS.toLowerCase();

export type MerklClaimToastState = 'in-progress' | 'success' | 'failed' | null;

/**
 * Hook that monitors Merkl claim transaction status and provides toast state.
 *
 * Shows "in-progress" while a claim is pending, "success" when confirmed,
 * and "failed" when the transaction fails or is dropped.
 *
 * Mirrors the mobile `useMerklClaimStatus` hook behavior:
 * - approved → in-progress toast
 * - confirmed → success toast
 * - failed/dropped → failed toast
 *
 * @returns An object containing `toastState` (current toast to display) and `dismissToast` (function to dismiss the current completion toast).
 */
export const useMerklClaimStatus = (): {
  toastState: MerklClaimToastState;
  dismissToast: () => void;
} => {
  const transactions = useSelector(getTransactions) as TransactionMeta[];
  const [completionState, setCompletionState] = useState<
    'success' | 'failed' | null
  >(null);
  // Whether the user has manually dismissed the current toast
  const [dismissed, setDismissed] = useState(false);

  // Track IDs of pending claims we've seen
  const pendingClaimIdsRef = useRef<Set<string>>(new Set());
  // Track IDs of claims we've already shown completion toasts for
  const shownCompletionIdsRef = useRef<Set<string>>(new Set());

  const merklClaims = useMemo(
    () => transactions.filter(isMerklClaimTransaction),
    [transactions],
  );

  const hasPendingClaim = useMemo(
    () => merklClaims.some((tx) => IN_FLIGHT_STATUSES.includes(tx.status)),
    [merklClaims],
  );

  // Detect transitions from pending → confirmed/failed
  useEffect(() => {
    const currentPendingIds = new Set(
      merklClaims
        .filter((tx) => IN_FLIGHT_STATUSES.includes(tx.status))
        .map((tx) => tx.id),
    );

    for (const tx of merklClaims) {
      if (shownCompletionIdsRef.current.has(tx.id)) {
        continue;
      }

      const wasPending = pendingClaimIdsRef.current.has(tx.id);

      if (tx.status === TransactionStatus.confirmed && wasPending) {
        setCompletionState('success');
        setDismissed(false);
        shownCompletionIdsRef.current.add(tx.id);
      } else if (
        (tx.status === TransactionStatus.failed ||
          tx.status === TransactionStatus.dropped) &&
        wasPending
      ) {
        setCompletionState('failed');
        setDismissed(false);
        shownCompletionIdsRef.current.add(tx.id);
      }
    }

    // Reset dismissed flag if a new pending claim appeared
    for (const id of currentPendingIds) {
      if (!pendingClaimIdsRef.current.has(id)) {
        setDismissed(false);
        break;
      }
    }

    pendingClaimIdsRef.current = currentPendingIds;
  }, [merklClaims]);

  const dismissToast = useCallback(() => {
    setCompletionState(null);
    setDismissed(true);
  }, []);

  // Completion state takes priority over pending state.
  // If the user dismissed the toast, hide it until a new state change resets `dismissed`.
  const toastState: MerklClaimToastState = dismissed
    ? null
    : (completionState ?? (hasPendingClaim ? 'in-progress' : null));

  return { toastState, dismissToast };
};
