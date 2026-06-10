import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import log from 'loglevel';
import {
  subscribeToMessengerEvent,
  submitRequestToBackground,
} from '../../store/background-connection';
import type {
  TrackingStrategy,
  EventResult,
  HwSignTrackerAction,
  UseHwSignTrackerOptions,
} from './hw-sign-tracker/types';
import { matchesTx } from './hw-sign-tracker/shared-filters';
import { BatchTrackingStrategy } from './hw-sign-tracker/batch-tracking-strategy';
import { SequentialTrackingStrategy } from './hw-sign-tracker/sequential-tracking-strategy';

/**
 * Factory to create the appropriate tracking strategy based on mode.
 * @param useBatchTracking
 */
function createStrategy(useBatchTracking: boolean): TrackingStrategy {
  return useBatchTracking
    ? new BatchTrackingStrategy()
    : new SequentialTrackingStrategy();
}

/**
 * Subscribes to TransactionController events to track hardware wallet signing
 * progress for bridge/swap transactions. Supports both batch tracking (STX
 * enabled, keyed by batchId) and sequential tracking (STX disabled, keyed by
 * tx ID). Returns a cancelCurrentBatch function to abort in-flight signing.
 *
 * @param fromAddress - The sender address to filter transactions by.
 * @param hardwareWalletUsed - Whether a hardware wallet is being used.
 * @param dispatchSignatureEvent - Dispatcher for the hardware wallet state machine.
 * @param options - Tracking options (enabled, useBatchTracking).
 * @param retryGenerationRef - Ref incremented on retry to mark old batches as stale.
 * @returns An object with cancelCurrentBatch to abort tracked transactions.
 */
export function useHwSignTracker(
  fromAddress: string | undefined,
  hardwareWalletUsed: boolean | undefined,
  dispatchSignatureEvent: React.Dispatch<HwSignTrackerAction>,
  options: UseHwSignTrackerOptions,
  retryGenerationRef?: React.RefObject<number>,
) {
  const dispatchRef = useRef(dispatchSignatureEvent);
  dispatchRef.current = dispatchSignatureEvent;

  const enabled = options?.enabled ?? true;
  const { useBatchTracking } = options;

  const strategy = useMemo(
    () => createStrategy(useBatchTracking),
    [useBatchTracking],
  );

  const lastSeenGenerationRef = useRef(retryGenerationRef?.current ?? 0);
  const pendingAbortTxIdsRef = useRef<Set<string>>(new Set());
  const abortSettleResolveRef = useRef<((value: void) => void) | null>(null);
  /** Bumped when the subscription effect re-runs so stale cancel cleanup cannot wipe a new flow. */
  const subscriptionGenerationRef = useRef(0);

  const clearSubscriptionTracking = useCallback(() => {
    strategy.reset();
  }, [strategy]);

  const isAbortSettling = () => pendingAbortTxIdsRef.current.size > 0;

  const cancelCurrentBatch = useCallback(async () => {
    if (!enabled) {
      return;
    }

    const cancelGeneration = subscriptionGenerationRef.current;
    const finishCancelCleanup = () => {
      if (cancelGeneration !== subscriptionGenerationRef.current) {
        return;
      }
      abortSettleResolveRef.current = null;
      pendingAbortTxIdsRef.current.clear();
      clearSubscriptionTracking();
    };

    const txIds = [...strategy.getTrackedTxIds()];
    strategy.reset();

    if (txIds.length === 0) {
      if (isAbortSettling()) {
        return;
      }
      finishCancelCleanup();
      return;
    }

    pendingAbortTxIdsRef.current = new Set(txIds);

    const settlePromise = new Promise<void>((resolve) => {
      abortSettleResolveRef.current = resolve;
    });

    await Promise.all(
      txIds.map(async (txId) => {
        try {
          await submitRequestToBackground('abortTransactionSigning', [txId]);
        } catch {
          if (cancelGeneration === subscriptionGenerationRef.current) {
            pendingAbortTxIdsRef.current.delete(txId);
          }
        }
      }),
    );

    if (pendingAbortTxIdsRef.current.size === 0) {
      finishCancelCleanup();
      return;
    }

    await Promise.race([
      settlePromise,
      new Promise((resolve) => setTimeout(resolve, 5_000)),
    ]);

    // Stop swallowing events if abort confirmations never arrived (timeout path).
    finishCancelCleanup();
  }, [clearSubscriptionTracking, enabled, strategy]);

  useEffect(() => {
    if (!fromAddress || !hardwareWalletUsed || !enabled) {
      return undefined;
    }

    subscriptionGenerationRef.current += 1;

    let cancelled = false;
    const targetFrom = fromAddress.toLowerCase();
    const logPrefix = useBatchTracking ? '[HW-Batch]' : '[HW-Sequential]';
    const unsubscribes: (() => Promise<void>)[] = [];

    const handlePendingAbort = (txId: string): boolean => {
      return strategy.checkPendingAbort(
        txId,
        pendingAbortTxIdsRef.current,
        () => {
          if (abortSettleResolveRef.current) {
            abortSettleResolveRef.current();
          }
        },
      );
    };

    const registerSubscription = async (
      subscribe: () => Promise<() => Promise<void>>,
    ) => {
      const unsubscribe = await subscribe();
      if (cancelled) {
        await unsubscribe().catch(
          // eslint-disable-next-line no-empty-function
          () => {},
        );
        return;
      }
      unsubscribes.push(unsubscribe);
    };

    /**
     * Creates a unified event handler for a TransactionController event.
     * Encapsulates the shared preamble (generation check → filter → track →
     * abort check) and delegates to the strategy for mode-specific processing.
     * @param eventSource
     * @param processor
     */
    const createEventHandler = (
      eventSource: 'statusUpdated' | 'rejected' | 'finished',
      processor: (txMeta: TransactionMeta) => EventResult,
    ) =>
      ([{ transactionMeta }]: [{ transactionMeta: TransactionMeta }]) => {
        if (cancelled) {
          return;
        }

        strategy.checkRetryGeneration(
          retryGenerationRef as
            | React.RefObject<number | undefined>
            | undefined,
          lastSeenGenerationRef,
        );

        const { status, type } = transactionMeta;

        const EVENT_SOURCE_NAMES: Record<string, string> = {
          statusUpdated: 'transactionStatusUpdated',
          rejected: 'transactionRejected',
          finished: 'transactionFinished',
        };
        const eventSourceName = EVENT_SOURCE_NAMES[eventSource];

        log.debug(
          `${logPrefix} ${eventSourceName}`,
          JSON.stringify({
            id: transactionMeta.id,
            status,
            type,
            from: transactionMeta.txParams.from,
            batchId: transactionMeta.batchId,
          }),
        );

        if (!matchesTx(transactionMeta, targetFrom)) {
          return;
        }

        if (handlePendingAbort(transactionMeta.id)) {
          return;
        }

        const result = processor(transactionMeta);
        if (result.action) {
          dispatchRef.current(result.action);
        }
      };

    const subscribeAll = async () => {
      await Promise.all([
        registerSubscription(() =>
          subscribeToMessengerEvent<[{ transactionMeta: TransactionMeta }]>(
            'TransactionController:transactionStatusUpdated',
            createEventHandler(
              'statusUpdated',
              strategy.processStatusUpdated.bind(strategy),
            ),
          ),
        ),
        registerSubscription(() =>
          subscribeToMessengerEvent<[{ transactionMeta: TransactionMeta }]>(
            'TransactionController:transactionRejected',
            createEventHandler(
              'rejected',
              strategy.processRejected.bind(strategy),
            ),
          ),
        ),
        registerSubscription(() =>
          subscribeToMessengerEvent<[{ transactionMeta: TransactionMeta }]>(
            'TransactionController:transactionFinished',
            createEventHandler(
              'finished',
              strategy.processFinished.bind(strategy),
            ),
          ),
        ),
      ]);
    };

    subscribeAll().catch((err: unknown) => {
      log.error(`${logPrefix} subscription error`, err);
    });

    return () => {
      cancelled = true;
      clearSubscriptionTracking();
      for (const unsub of unsubscribes) {
        unsub().catch(
          // eslint-disable-next-line no-empty-function
          () => {},
        );
      }
    };
  }, [
    fromAddress,
    hardwareWalletUsed,
    retryGenerationRef,
    enabled,
    useBatchTracking,
    strategy,
    clearSubscriptionTracking,
  ]);

  return { cancelCurrentBatch };
}
