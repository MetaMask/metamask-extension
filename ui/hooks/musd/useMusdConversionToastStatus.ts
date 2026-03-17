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
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { getTransactions } from '../../selectors/transactions';
import {
  selectTransactionPaymentTokenByTransactionId,
  type TransactionPayState,
} from '../../selectors/transactionPayController';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import type { MusdConversionStatusUpdatedEventProperties } from '../../components/app/musd/musd-events';
import { getMultichainNetworkConfigurationsByChainId } from '../../selectors/multichain';
import { extractTransactionAmount } from './transaction-amount-utils';
import { IN_FLIGHT_STATUSES } from './transaction-status-constants';

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
 * `activeTransactionId` (the ID of the active mUSD conversion for tracing),
 * and `dismissToast` (function to dismiss the current toast).
 */
export const useMusdConversionToastStatus = (): {
  toastState: MusdConversionToastState;
  sourceTokenSymbol: string | undefined;
  activeTransactionId: string | undefined;
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
  const [dismissed, setDismissed] = useState(false);

  // Track IDs of pending conversions we've seen
  const pendingConversionIdsRef = useRef<Set<string>>(new Set());
  // Track IDs of conversions we've already shown completion toasts for
  const shownCompletionIdsRef = useRef<Set<string>>(new Set());
  // Track IDs of conversions we've already tracked analytics for (by status)
  const trackedAnalyticsRef = useRef<Map<string, Set<string>>>(new Map());

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

  const extractTransferAmount = useCallback(
    (tx: TransactionMeta): { amountHex: string; amountDecimal: string } => {
      const decimal = extractTransactionAmount(tx);
      if (decimal) {
        return {
          amountHex: `0x${new BigNumber(decimal).toString(16)}`,
          amountDecimal: decimal,
        };
      }
      return { amountHex: '0x0', amountDecimal: '0' };
    },
    [],
  );

  /**
   * Track mUSD conversion status update analytics
   */
  const trackConversionStatusUpdate = useCallback(
    (
      tx: TransactionMeta,
      status: 'approved' | 'confirmed' | 'failed' | 'dropped',
      tokenSymbol: string | undefined,
    ) => {
      const { chainId } = tx;
      const networkConfig = chainId
        ? networkConfigurationsByChainId[chainId]
        : null;
      const networkName = networkConfig?.name ?? 'Unknown Network';
      const { amountHex, amountDecimal } = extractTransferAmount(tx);

      /* eslint-disable @typescript-eslint/naming-convention */
      const properties: MusdConversionStatusUpdatedEventProperties = {
        transaction_id: tx.id,
        transaction_status: status,
        transaction_type: 'musdConversion',
        asset_symbol: tokenSymbol ?? 'Unknown',
        network_chain_id: chainId ?? '',
        network_name: networkName,
        amount_decimal: amountDecimal,
        amount_hex: amountHex,
      };
      /* eslint-enable @typescript-eslint/naming-convention */

      trackEvent({
        event: MetaMetricsEventName.MusdConversionStatusUpdated,
        category: MetaMetricsEventCategory.MusdConversion,
        properties,
      });
    },
    [trackEvent, networkConfigurationsByChainId, extractTransferAmount],
  );

  // Detect transitions from pending → confirmed/failed and track analytics
  useEffect(() => {
    const currentPendingIds = new Set(pendingConversions.map((tx) => tx.id));
    let hasNewCompletion = false;

    for (const tx of musdConversions) {
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
        trackConversionStatusUpdate(tx, 'approved', sourceTokenSymbol);
        trackedStatuses.add('approved');
        trackedAnalyticsRef.current.set(tx.id, trackedStatuses);
      }

      if (shownCompletionIdsRef.current.has(tx.id)) {
        continue;
      }

      const wasPending = pendingConversionIdsRef.current.has(tx.id);

      if (tx.status === TransactionStatus.confirmed && wasPending) {
        // Track confirmed status
        if (!trackedStatuses.has('confirmed')) {
          trackConversionStatusUpdate(tx, 'confirmed', sourceTokenSymbol);
          trackedStatuses.add('confirmed');
          trackedAnalyticsRef.current.set(tx.id, trackedStatuses);
        }
        setCompletionState('success');
        setDismissed(false);
        shownCompletionIdsRef.current.add(tx.id);
        hasNewCompletion = true;
      } else if (
        (tx.status === TransactionStatus.failed ||
          tx.status === TransactionStatus.dropped) &&
        wasPending
      ) {
        // Track failed/dropped status
        const statusKey =
          tx.status === TransactionStatus.failed ? 'failed' : 'dropped';
        if (!trackedStatuses.has(statusKey)) {
          trackConversionStatusUpdate(tx, statusKey, sourceTokenSymbol);
          trackedStatuses.add(statusKey);
          trackedAnalyticsRef.current.set(tx.id, trackedStatuses);
        }
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
  }, [
    musdConversions,
    pendingConversions,
    sourceTokenSymbol,
    trackConversionStatusUpdate,
  ]);

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

  return {
    toastState,
    sourceTokenSymbol,
    activeTransactionId: activePendingTxId,
    dismissToast,
  };
};
