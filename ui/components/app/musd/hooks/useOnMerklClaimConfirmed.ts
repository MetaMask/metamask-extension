import { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { getTransactions } from '../../../../selectors/transactions';
import { isMerklClaimTransaction } from '../utils';

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
 * Window in which a confirmed claim tx is considered "recent enough" to
 * trigger a refetch on component mount. Covers the case where the claim
 * confirmed while ClaimBonusBadge was unmounted (during the confirmation
 * flow), so the pending→confirmed transition was never observed.
 */
const RECENT_CLAIM_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Watches Merkl claim transactions and fires a callback when one confirms.
 * Tracks in-flight claim IDs so it only fires for transitions from
 * pending to confirmed, not for transactions that were already confirmed.
 *
 * Also handles the remount case: when the component unmounts during the
 * confirmation flow (navigation away) and remounts after the claim has already
 * confirmed, the pending→confirmed transition is missed. To cover this, on the
 * first effect run (mount) we check for recently confirmed claim txs and fire
 * the callback if any are found within RECENT_CLAIM_WINDOW_MS.
 *
 * @param onConfirmed - Callback fired when a pending claim is confirmed
 * @returns `isClaimInFlight` — true while a Merkl claim tx is approved, signed, or submitted
 */
export const useOnMerklClaimConfirmed = (
  onConfirmed: () => void,
): { isClaimInFlight: boolean } => {
  const transactions = useSelector(getTransactions) as TransactionMeta[];

  const isClaimInFlight = useMemo(() => {
    const merklClaimTxs = transactions.filter(isMerklClaimTransaction);
    return merklClaimTxs.some((tx) => IN_FLIGHT_STATUSES.includes(tx.status));
  }, [transactions]);

  // Track IDs of pending claims we've seen
  const pendingClaimIdsRef = useRef<Set<string>>(new Set());

  // True only on the very first effect run (mount)
  const isMountRef = useRef(true);

  // Stable callback ref to avoid effect re-running
  const onConfirmedRef = useRef(onConfirmed);
  useEffect(() => {
    onConfirmedRef.current = onConfirmed;
  }, [onConfirmed]);

  // Detect when a pending claim becomes confirmed
  useEffect(() => {
    const merklClaimTxs = transactions.filter(isMerklClaimTransaction);

    const currentPendingIds = new Set(
      merklClaimTxs
        .filter((tx) => IN_FLIGHT_STATUSES.includes(tx.status))
        .map((tx) => tx.id),
    );

    const confirmedIds = merklClaimTxs
      .filter((tx) => tx.status === TransactionStatus.confirmed)
      .map((tx) => tx.id);

    const hadPendingThatConfirmed = confirmedIds.some((id) =>
      pendingClaimIdsRef.current.has(id),
    );

    // On mount, check for recently confirmed claim txs that were missed
    // because the component was unmounted during the confirmation flow.
    const isMount = isMountRef.current;
    const hasRecentlyConfirmedOnMount =
      isMount &&
      merklClaimTxs.some(
        (tx) =>
          tx.status === TransactionStatus.confirmed &&
          Date.now() - tx.time < RECENT_CLAIM_WINDOW_MS,
      );

    isMountRef.current = false;

    // Update our tracking set
    pendingClaimIdsRef.current = currentPendingIds;

    // Fire callback if a pending claim was confirmed, or if we mounted and
    // found a recently confirmed claim that was missed while unmounted.
    if (hadPendingThatConfirmed || hasRecentlyConfirmedOnMount) {
      onConfirmedRef.current();
    }
  }, [transactions]);

  return { isClaimInFlight };
};
