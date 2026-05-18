import {
  useMemo,
  useEffect,
  useRef,
  useState,
  useCallback,
  useContext,
} from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { getTransactions } from '../../selectors/transactions';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import type { MusdClaimBonusStatusUpdatedEventProperties } from '../../components/app/musd/musd-events';
import { MERKL_CLAIM_CHAIN_ID } from '../../components/app/musd/constants';
import { getMultichainNetworkConfigurationsByChainId } from '../../selectors/multichain';
import { isMerklClaimTransaction } from '../../components/app/musd/utils';
import { resolveClaimAmount } from './transaction-amount-utils';
import { IN_FLIGHT_STATUSES } from './transaction-status-constants';

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
  const { trackEvent } = useContext(MetaMetricsContext);
  const networkConfigurationsByChainId = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const [completionState, setCompletionState] = useState<
    'success' | 'failed' | null
  >(null);
  // Whether the user has manually dismissed the current toast
  const [dismissed, setDismissed] = useState(false);

  // Track IDs of pending claims we've seen
  const pendingClaimIdsRef = useRef<Set<string>>(new Set());
  // Track IDs of claims we've already shown completion toasts for
  const shownCompletionIdsRef = useRef<Set<string>>(new Set());
  // Track IDs of claims we've already tracked analytics for (by status)
  const trackedAnalyticsRef = useRef<Map<string, Set<string>>>(new Map());

  /**
   * Track Merkl claim status update analytics.
   * Async because claim amount resolution requires decoding calldata and
   * potentially reading from the Merkl distributor contract.
   */
  const trackClaimStatusUpdate = useCallback(
    async (
      tx: TransactionMeta,
      status: 'approved' | 'confirmed' | 'failed' | 'dropped',
    ) => {
      const networkConfig =
        networkConfigurationsByChainId[MERKL_CLAIM_CHAIN_ID];
      const networkName = networkConfig?.name ?? 'Unknown Network';

      // Resolve claim amount asynchronously by decoding the Merkl claim
      // calldata. For confirmed txs, receipt logs give the exact payout;
      // otherwise falls back to contract call (total - already claimed).
      let claimAmount: string | undefined;
      try {
        claimAmount = await resolveClaimAmount(tx);
      } catch {
        // Analytics should never block the UI; proceed without amount
      }

      /* eslint-disable @typescript-eslint/naming-convention */
      const properties: MusdClaimBonusStatusUpdatedEventProperties = {
        transaction_id: tx.id,
        transaction_status: status,
        transaction_type: 'merklClaim',
        network_chain_id: MERKL_CLAIM_CHAIN_ID,
        network_name: networkName,
        ...(claimAmount === undefined
          ? {}
          : { amount_claimed_decimal: claimAmount }),
      };
      /* eslint-enable @typescript-eslint/naming-convention */

      trackEvent({
        event: MetaMetricsEventName.MusdClaimBonusStatusUpdated,
        category: MetaMetricsEventCategory.MusdConversion,
        properties,
      });
    },
    [trackEvent, networkConfigurationsByChainId],
  );

  const merklClaims = useMemo(
    () => transactions.filter(isMerklClaimTransaction),
    [transactions],
  );

  const hasPendingClaim = useMemo(
    () => merklClaims.some((tx) => IN_FLIGHT_STATUSES.includes(tx.status)),
    [merklClaims],
  );

  // Detect transitions from pending → confirmed/failed and track analytics
  useEffect(() => {
    const currentPendingIds = new Set(
      merklClaims
        .filter((tx) => IN_FLIGHT_STATUSES.includes(tx.status))
        .map((tx) => tx.id),
    );

    for (const tx of merklClaims) {
      // Track analytics for status changes
      const trackedStatuses =
        trackedAnalyticsRef.current.get(tx.id) ?? new Set();

      // Track approved status when the transaction first appears in any
      // in-flight state. The `approved` status is extremely transient
      // (approved → signed → submitted within the same tick), so React
      // almost never observes it directly. Matching any in-flight status
      // ensures the event fires reliably.
      if (
        IN_FLIGHT_STATUSES.includes(tx.status) &&
        !trackedStatuses.has('approved')
      ) {
        trackClaimStatusUpdate(tx, 'approved');
        trackedStatuses.add('approved');
        trackedAnalyticsRef.current.set(tx.id, trackedStatuses);
      }

      if (shownCompletionIdsRef.current.has(tx.id)) {
        continue;
      }

      const wasPending = pendingClaimIdsRef.current.has(tx.id);

      if (tx.status === TransactionStatus.confirmed && wasPending) {
        if (!trackedStatuses.has('confirmed')) {
          trackClaimStatusUpdate(tx, 'confirmed');
          trackedStatuses.add('confirmed');
          trackedAnalyticsRef.current.set(tx.id, trackedStatuses);
        }
        setCompletionState('success');
        setDismissed(false);
        shownCompletionIdsRef.current.add(tx.id);
      } else if (
        (tx.status === TransactionStatus.failed ||
          tx.status === TransactionStatus.dropped) &&
        wasPending
      ) {
        const statusKey =
          tx.status === TransactionStatus.failed ? 'failed' : 'dropped';
        if (!trackedStatuses.has(statusKey)) {
          trackClaimStatusUpdate(tx, statusKey);
          trackedStatuses.add(statusKey);
          trackedAnalyticsRef.current.set(tx.id, trackedStatuses);
        }
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
  }, [merklClaims, trackClaimStatusUpdate]);

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
