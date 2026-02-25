import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { getTransactions } from '../../../../selectors/transactions';
import { MERKL_DISTRIBUTOR_ADDRESS } from '../constants';

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

/**
 * Watches Merkl claim transactions and fires a callback when one confirms.
 * Tracks in-flight claim IDs so it only fires for transitions from
 * pending to confirmed, not for transactions that were already confirmed.
 *
 * @param onConfirmed - Callback fired when a pending claim is confirmed
 */
export const useOnMerklClaimConfirmed = (onConfirmed: () => void): void => {
  const transactions = useSelector(getTransactions) as TransactionMeta[];

  // Track IDs of pending claims we've seen
  const pendingClaimIdsRef = useRef<Set<string>>(new Set());

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

    // Update our tracking set
    pendingClaimIdsRef.current = currentPendingIds;

    // Fire callback if a pending claim was confirmed
    if (hadPendingThatConfirmed) {
      onConfirmedRef.current();
    }
  }, [transactions]);
};
