import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import log from 'loglevel';
import {
  subscribeToMessengerEvent,
  submitRequestToBackground,
} from '../../store/background-connection';
import { HardwareWalletSignatureEvent } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import { normalizeAddress } from '../../../shared/lib/multichain/address';
import type {
  ExpectedTransactionParams,
  EventResult,
  HwSignTrackerAction,
  SignedEventClassifier,
  TrackingStrategy,
  UseHwSignTrackerOptions,
} from './hw-sign-tracker/types';
import {
  classifySignedTransactionType,
  matchesTx,
} from './hw-sign-tracker/shared-filters';
import { BatchTrackingStrategy } from './hw-sign-tracker/batch-tracking-strategy';
import { SequentialTrackingStrategy } from './hw-sign-tracker/sequential-tracking-strategy';
import { checkPendingAbort } from './hw-sign-tracker/utils';
import { BRIDGE_TRANSACTION_TYPES } from './hw-sign-tracker/constants';

/**
 * Maps the internal event-source identifier to the TransactionController event
 * name used for log labeling. Defined at module scope so it is not recreated
 * on every event invocation.
 */
const EVENT_SOURCE_NAMES: Record<
  'statusUpdated' | 'rejected' | 'finished',
  string
> = {
  statusUpdated: 'transactionStatusUpdated',
  rejected: 'transactionRejected',
  finished: 'transactionFinished',
};

/** Maximum time (ms) to wait for abort confirmations before giving up. */
const ABORT_SETTLE_TIMEOUT_MS = 5_000;

/**
 * Races `promise` against a timeout. Clears the timer if the promise settles
 * first so no dangling timer remains.
 *
 * @param promise - The promise to await.
 * @param timeoutMs - Milliseconds to wait before resolving with `undefined`.
 * @returns The resolved value of `promise`, or `undefined` on timeout.
 */
async function raceWithTimeout<TResult>(
  promise: Promise<TResult>,
  timeoutMs: number,
): Promise<TResult | void> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

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
 * Checks whether a transaction matches any of the expected transaction params.
 *
 * Only validates the match between `to`, `value`, and `data`. No other fields
 * (e.g. `from`, `gas`, `nonce`) are considered. A param is only compared when
 * its expected value is present; omitted expected params are treated as
 * wildcards. An entry with no specified params matches nothing (guards against
 * an accidental `{}` silently matching every transaction, which in the
 * sendBundle flow would drop the gas-tx signature). Returns `false` if no
 * expected params are provided.
 *
 * @param transactionMeta - The transaction being signed.
 * @param expectedTransactionParams - The list of expected param sets to match
 * against; the transaction matches if at least one set matches.
 * @returns `true` if the transaction matches at least one expected param set.
 */
function matchesExpectedParams(
  transactionMeta: TransactionMeta,
  expectedTransactionParams: ExpectedTransactionParams[] | undefined,
): boolean {
  if (!expectedTransactionParams?.length) {
    return false;
  }

  return expectedTransactionParams.some((expected) => {
    if (!expected.to && !expected.data && !expected.value) {
      return false;
    }

    if (
      expected.to &&
      (!transactionMeta.txParams.to ||
        normalizeAddress(transactionMeta.txParams.to) !==
          normalizeAddress(expected.to))
    ) {
      return false;
    }

    if (expected.data && transactionMeta.txParams.data !== expected.data) {
      return false;
    }

    if (expected.value && transactionMeta.txParams.value !== expected.value) {
      return false;
    }

    return true;
  });
}

/**
 * Subscribes to TransactionController events to track hardware wallet signing
 * progress for bridge/swap and sendBundle transactions. Supports both batch
 * tracking (STX enabled, keyed by batchId) and sequential tracking (STX
 * disabled, keyed by tx ID). Returns a cancelCurrentBatch function to abort
 * in-flight signing.
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
  retryGenerationRef?: React.RefObject<number | undefined>,
) {
  const dispatchRef = useRef(dispatchSignatureEvent);
  dispatchRef.current = dispatchSignatureEvent;

  const enabled = options?.enabled ?? true;
  const {
    expectedTransactionParams,
    expectedTxIds,
    includeSendBundleTransactions,
    useBatchTracking,
  } = options;
  const trackedTypes = includeSendBundleTransactions
    ? null
    : BRIDGE_TRANSACTION_TYPES;
  const expectedTxIdSet = useMemo(
    () => (expectedTxIds?.length ? new Set(expectedTxIds) : undefined),
    [expectedTxIds],
  );
  const hasExpectedTransactionFilters = Boolean(
    expectedTxIdSet || expectedTransactionParams?.length,
  );
  const classifySignedTransactionTypeForFlow: SignedEventClassifier =
    useCallback(
      (transactionMeta) => {
        if (!includeSendBundleTransactions) {
          return transactionMeta.type
            ? classifySignedTransactionType(transactionMeta.type)
            : null;
        }

        // SendBundle flow signs the SEND tx first (the user's actual
        // transaction) and the GAS-PAYMENT tx second (the fee-token transfer
        // generated by the STX backend after the deferred approval resolves).
        // The state machine must wait for BOTH signatures before finishing, so:
        //   - SEND tx (root, in expectedTxIdSet) → FirstSignatureSubmitted
        //     (advances AwaitingFirst → AwaitingFinal)
        //   - GAS tx (nested batch member, matched by params) → TransactionSubmitted
        //     (advances AwaitingFinal → Submitted, terminal)
        // Inverting these would cause the state to jump to Submitted after the
        // first signature, silently dropping the gas-tx signature.
        if (expectedTxIdSet?.has(transactionMeta.id)) {
          return { type: HardwareWalletSignatureEvent.FirstSignatureSubmitted };
        }

        if (matchesExpectedParams(transactionMeta, expectedTransactionParams)) {
          return { type: HardwareWalletSignatureEvent.TransactionSubmitted };
        }

        return null;
      },
      [
        expectedTransactionParams,
        expectedTxIdSet,
        includeSendBundleTransactions,
      ],
    );

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

    await raceWithTimeout(settlePromise, ABORT_SETTLE_TIMEOUT_MS);

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
      return checkPendingAbort(txId, pendingAbortTxIdsRef.current, () => {
        if (abortSettleResolveRef.current) {
          abortSettleResolveRef.current();
        }
      });
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
     *
     * @param eventSource - Which TransactionController event this handler wraps
     * ('statusUpdated', 'rejected', or 'finished'); used only for log labeling.
     * @param processor - Strategy method that classifies the event into an action.
     */
    const createEventHandler =
      (
        eventSource: 'statusUpdated' | 'rejected' | 'finished',
        processor: (txMeta: TransactionMeta) => EventResult,
      ) =>
      // `transactionStatusUpdated` and `transactionRejected` are published with
      // the meta wrapped (`{ transactionMeta }`), but `transactionFinished` is
      // published with the meta directly. The background forwards publish args
      // as an array, so the first element is either `{ transactionMeta }` or
      // the bare meta. Unwrap both shapes so `transactionFinished` is parsed
      // correctly (destructuring `status` from a bare meta previously crashed).
      ([firstArg]: [
        { transactionMeta: TransactionMeta } | TransactionMeta,
      ]) => {
        if (cancelled) {
          return;
        }

        const transactionMeta =
          'transactionMeta' in firstArg ? firstArg.transactionMeta : firstArg;

        strategy.checkRetryGeneration(
          retryGenerationRef,
          lastSeenGenerationRef,
        );

        const { status, type } = transactionMeta;

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

        // Broad pre-filter: same sender, and (for bridge/swap) a tracked
        // bridge type. In SendBundle mode `trackedTypes` is `null`, so only
        // the sender is checked — the gas-payment tx isn't a bridge type.
        if (!matchesTx(transactionMeta, targetFrom, trackedTypes)) {
          return;
        }

        // SendBundle mode needs an explicit allowlist to avoid tracking every
        // same-address transaction.
        if (includeSendBundleTransactions && !hasExpectedTransactionFilters) {
          return;
        }

        // Accept the tx only if it matches one of the two SendBundle
        // signatures: the SEND tx by ID (1st sig, ID known up front), or the
        // gas-payment tx by params (2nd sig, ID unknown — STX backend creates
        // it as a nested batch member after the deferred approval resolves).
        // Mirrors classifySignedTransactionTypeForFlow: ID →
        // FirstSignatureSubmitted, params → TransactionSubmitted.
        if (
          hasExpectedTransactionFilters &&
          !expectedTxIdSet?.has(transactionMeta.id) &&
          !matchesExpectedParams(transactionMeta, expectedTransactionParams)
        ) {
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

    // Build the event handlers at the effect body level so the strategy
    // processor arrows stay one level deep instead of nesting inside
    // `subscribeAll` → `registerSubscription` → `subscribeToMessengerEvent`.
    const statusUpdatedHandler = createEventHandler('statusUpdated', (txMeta) =>
      strategy.processStatusUpdated(
        txMeta,
        classifySignedTransactionTypeForFlow,
      ),
    );
    const rejectedHandler = createEventHandler(
      'rejected',
      strategy.processRejected.bind(strategy),
    );
    const finishedHandler = createEventHandler(
      'finished',
      strategy.processFinished.bind(strategy),
    );

    const subscribeAll = async () => {
      await Promise.all([
        registerSubscription(() =>
          subscribeToMessengerEvent<[{ transactionMeta: TransactionMeta }]>(
            'TransactionController:transactionStatusUpdated',
            statusUpdatedHandler,
          ),
        ),
        registerSubscription(() =>
          subscribeToMessengerEvent<[{ transactionMeta: TransactionMeta }]>(
            'TransactionController:transactionRejected',
            rejectedHandler,
          ),
        ),
        registerSubscription(() =>
          subscribeToMessengerEvent<[{ transactionMeta: TransactionMeta }]>(
            'TransactionController:transactionFinished',
            finishedHandler,
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
    expectedTransactionParams,
    expectedTxIdSet,
    classifySignedTransactionTypeForFlow,
    hasExpectedTransactionFilters,
    includeSendBundleTransactions,
    enabled,
    trackedTypes,
    useBatchTracking,
    strategy,
    clearSubscriptionTracking,
  ]);

  return { cancelCurrentBatch };
}
