import { useCallback, useEffect, useRef } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionType } from '@metamask/transaction-controller';
import log from 'loglevel';
import {
  subscribeToMessengerEvent,
  submitRequestToBackground,
} from '../../store/background-connection';
import { HardwareWalletSignatureEvent } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';

/** Bridge/swap transaction types that correspond to token approval signatures. */
const APPROVAL_TYPES = new Set([
  TransactionType.bridgeApproval,
  TransactionType.swapApproval,
]);

/** Bridge/swap transaction types that correspond to the final trade signature. */
const TRADE_TYPES = new Set([TransactionType.bridge, TransactionType.swap]);
/** All tracked bridge/swap transaction types (approval + trade). */
const ALL_BATCH_TYPES = new Set([...APPROVAL_TYPES, ...TRADE_TYPES]);

/** Action types dispatched by useHwSignTracker to the hardware wallet state machine. */
export type HwSignTrackerAction =
  | { type: typeof HardwareWalletSignatureEvent.FirstSignatureSubmitted }
  | { type: typeof HardwareWalletSignatureEvent.TransactionSubmitted }
  | { type: typeof HardwareWalletSignatureEvent.TransactionRejected }
  | { type: typeof HardwareWalletSignatureEvent.TransactionFailed };

/** Options for configuring the hardware wallet signature tracker. */
export type UseHwSignTrackerOptions = {
  enabled?: boolean;
  useBatchTracking: boolean;
};

/**
 * Checks whether a transaction matches the expected sender address and is one
 * of the tracked bridge/swap types.
 *
 * @param transactionMeta - The transaction metadata to check.
 * @param targetFrom - The expected sender address (lowercased).
 * @returns True if the transaction matches.
 */
function matchesTx(
  transactionMeta: TransactionMeta,
  targetFrom: string | undefined,
): boolean {
  if (!targetFrom) {
    return false;
  }
  const normalizedFrom = transactionMeta.txParams.from?.toLowerCase();
  if (normalizedFrom !== targetFrom) {
    return false;
  }
  return ALL_BATCH_TYPES.has(transactionMeta.type as TransactionType);
}

/**
 * Checks whether a transaction belongs to the currently tracked batch (or is
 * from a stale batch that should be ignored).
 *
 * @param transactionMeta - The transaction metadata to check.
 * @param currentBatchId - The current batch ID. `undefined` accepts all,
 * `null` rejects all (retry pending), a string only matches that batch.
 * @param staleBatchIds - Set of batch IDs that have been superceded by retries.
 * @returns True if the transaction belongs to the current batch.
 */
function isFromCurrentBatch(
  transactionMeta: TransactionMeta,
  currentBatchId: string | null | undefined,
  staleBatchIds: Set<string>,
): boolean {
  const batchId = transactionMeta.batchId ?? 'batch-unknown';
  if (currentBatchId === undefined) {
    return true;
  }
  if (currentBatchId === null) {
    return !staleBatchIds.has(batchId);
  }
  return batchId === currentBatchId;
}

/**
 * Returns true when no batch has been identified yet, meaning rejection and
 * finished events should be blocked until the first signed event establishes
 * the active batch.
 *
 * @param currentBatchId - The current batch ID state.
 * @returns True when currentBatchId is undefined (no batch yet).
 */
function shouldBlockPendingEvent(
  currentBatchId: string | null | undefined,
): boolean {
  return currentBatchId === undefined;
}

/**
 * Subscribes to TransactionController events to track hardware wallet signing
 * progress for bridge/swap transactions. Supports both batch tracking (STX
 * enabled, keyed by batchId) and sequential tracking (STX disabled, keyed by
 * tx ID). Returns a cancelCurrentBatch function to abort in-flight signing.
 *
 * @param fromAddress - The sender address to filter transactions by.
 * @param hardwareWalletUsed - Whether a hardware wallet is being used.
 * @param _needsTwoConfirmations - Whether the transaction requires approval + trade.
 * @param dispatchSignatureEvent - Dispatcher for the hardware wallet state machine.
 * @param options - Tracking options (enabled, useBatchTracking).
 * @param retryGenerationRef - Ref incremented on retry to mark old batches as stale.
 * @returns An object with cancelCurrentBatch to abort tracked transactions.
 */
export function useHwSignTracker(
  fromAddress: string | undefined,
  hardwareWalletUsed: boolean | undefined,
  _needsTwoConfirmations: boolean | undefined,
  dispatchSignatureEvent: React.Dispatch<HwSignTrackerAction>,
  options: UseHwSignTrackerOptions,
  retryGenerationRef?: React.RefObject<number>,
) {
  const dispatchRef = useRef(dispatchSignatureEvent);
  dispatchRef.current = dispatchSignatureEvent;

  const enabled = options?.enabled ?? true;
  const {useBatchTracking} = options;

  // Shared refs (both modes)
  const trackedTxIdsRef = useRef<Set<string>>(new Set());
  const lastSeenGenerationRef = useRef(retryGenerationRef?.current ?? 0);
  const pendingAbortTxIdsRef = useRef<Set<string>>(new Set());
  const abortSettleResolveRef = useRef<((value: void) => void) | null>(null);

  // Batch-mode-only refs (unused in sequential mode)
  const currentBatchIdRef = useRef<string | null | undefined>();
  const staleBatchIdsRef = useRef<Set<string>>(new Set());
  const seenBatchIdsRef = useRef<Set<string>>(new Set());

  /**
   * Aborts all currently tracked transactions by calling the background
   * abortTransactionSigning RPC. Waits up to 5 seconds for abort events to
   * settle to prevent stale events from triggering false state transitions.
   */
  const cancelCurrentBatch = useCallback(async () => {
    if (!enabled) {
      return;
    }

    const txIds = [...trackedTxIdsRef.current];
    trackedTxIdsRef.current = new Set();

    if (txIds.length === 0) {
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
          pendingAbortTxIdsRef.current.delete(txId);
        }
      }),
    );

    if (pendingAbortTxIdsRef.current.size === 0) {
      abortSettleResolveRef.current = null;
      return;
    }

    await Promise.race([
      settlePromise,
      new Promise((resolve) => setTimeout(resolve, 5_000)),
    ]);

    abortSettleResolveRef.current = null;
  }, [enabled]);

  useEffect(() => {
    if (!fromAddress || !hardwareWalletUsed || !enabled) {
      return undefined;
    }

    let cancelled = false;
    const targetFrom = fromAddress.toLowerCase();
    const logPrefix = useBatchTracking ? '[HW-Batch]' : '[HW-Sequential]';
    const unsubscribes: (() => Promise<void>)[] = [];

    const checkGeneration = () => {
      if (
        !retryGenerationRef ||
        retryGenerationRef.current === lastSeenGenerationRef.current
      ) {
        return;
      }
      lastSeenGenerationRef.current = retryGenerationRef.current ?? 0;

      if (useBatchTracking) {
        for (const id of seenBatchIdsRef.current) {
          staleBatchIdsRef.current.add(id);
        }
        seenBatchIdsRef.current = new Set();
        currentBatchIdRef.current = null;
      } else {
        trackedTxIdsRef.current = new Set();
      }
    };

    const handlePendingAbort = (txId: string): boolean => {
      if (pendingAbortTxIdsRef.current.has(txId)) {
        pendingAbortTxIdsRef.current.delete(txId);
        if (
          pendingAbortTxIdsRef.current.size === 0 &&
          abortSettleResolveRef.current
        ) {
          abortSettleResolveRef.current();
        }
        return true;
      }
      return false;
    };

    const subscribeAll = async () => {
      const unsubscribeStatusUpdated = await subscribeToMessengerEvent<
        [{ transactionMeta: TransactionMeta }]
      >(
        'TransactionController:transactionStatusUpdated',
        ([{ transactionMeta }]) => {
          if (cancelled) {
            return;
          }

          checkGeneration();

          const { status, type } = transactionMeta;

          log.debug(
            `${logPrefix} transactionStatusUpdated`,
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

          const batchId = transactionMeta.batchId ?? 'batch-unknown';
          if (useBatchTracking) {
            seenBatchIdsRef.current.add(batchId);
          }
          trackedTxIdsRef.current.add(transactionMeta.id);

          if (handlePendingAbort(transactionMeta.id)) {
            return;
          }

          if (status === 'signed') {
            if (useBatchTracking) {
              if (currentBatchIdRef.current === undefined) {
                currentBatchIdRef.current = batchId;
              } else if (currentBatchIdRef.current === null) {
                if (staleBatchIdsRef.current.has(batchId)) {
                  log.debug(
                    `${logPrefix} skipping stale signed event after retry`,
                    JSON.stringify({
                      eventBatchId: batchId,
                      staleBatchIds: [...staleBatchIdsRef.current],
                    }),
                  );
                  return;
                }
                currentBatchIdRef.current = batchId;
              } else if (batchId !== currentBatchIdRef.current) {
                log.debug(
                  `${logPrefix} skipping signed event from stale batch`,
                  JSON.stringify({
                    eventBatchId: batchId,
                    currentBatchId: currentBatchIdRef.current,
                  }),
                );
                return;
              }
            }

            if (APPROVAL_TYPES.has(type as TransactionType)) {
              log.debug(
                `${logPrefix} approval signed → FirstSignatureSubmitted`,
              );
              dispatchRef.current({
                type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
              });
            } else if (TRADE_TYPES.has(type as TransactionType)) {
              log.debug(`${logPrefix} trade signed → TransactionSubmitted`);
              dispatchRef.current({
                type: HardwareWalletSignatureEvent.TransactionSubmitted,
              });
            }
          } else if (status === 'failed') {
            if (useBatchTracking) {
              if (shouldBlockPendingEvent(currentBatchIdRef.current)) {
                log.debug(
                  `${logPrefix} skipping transactionStatusUpdated failed: no batch identified yet`,
                );
                return;
              }
              if (
                currentBatchIdRef.current !== undefined &&
                !isFromCurrentBatch(
                  transactionMeta,
                  currentBatchIdRef.current,
                  staleBatchIdsRef.current,
                )
              ) {
                log.debug(
                  `${logPrefix} skipping transactionStatusUpdated failed from stale batch`,
                  JSON.stringify({
                    eventBatchId: transactionMeta.batchId,
                    currentBatchId: currentBatchIdRef.current,
                  }),
                );
                return;
              }
            }
            log.debug(
              `${logPrefix} transactionStatusUpdated failed → TransactionFailed`,
            );
            dispatchRef.current({
              type: HardwareWalletSignatureEvent.TransactionFailed,
            });
          }
        },
      );
      unsubscribes.push(unsubscribeStatusUpdated);

      const unsubscribeRejected = await subscribeToMessengerEvent<
        [{ transactionMeta: TransactionMeta }]
      >(
        'TransactionController:transactionRejected',
        ([{ transactionMeta }]) => {
          if (cancelled) {
            return;
          }

          checkGeneration();

          log.debug(
            `${logPrefix} transactionRejected`,
            JSON.stringify({
              id: transactionMeta.id,
              type: transactionMeta.type,
              from: transactionMeta.txParams.from,
              batchId: transactionMeta.batchId,
            }),
          );

          if (!matchesTx(transactionMeta, targetFrom)) {
            return;
          }

          if (useBatchTracking) {
            const batchId = transactionMeta.batchId ?? 'batch-unknown';
            seenBatchIdsRef.current.add(batchId);
            trackedTxIdsRef.current.add(transactionMeta.id);
          }

          if (handlePendingAbort(transactionMeta.id)) {
            return;
          }

          if (useBatchTracking) {
            if (shouldBlockPendingEvent(currentBatchIdRef.current)) {
              log.debug(
                `${logPrefix} skipping transactionRejected: no batch identified yet`,
              );
              return;
            }
            if (
              currentBatchIdRef.current !== undefined &&
              !isFromCurrentBatch(
                transactionMeta,
                currentBatchIdRef.current,
                staleBatchIdsRef.current,
              )
            ) {
              log.debug(
                `${logPrefix} skipping transactionRejected from stale batch`,
                JSON.stringify({
                  eventBatchId: transactionMeta.batchId,
                  currentBatchId: currentBatchIdRef.current,
                }),
              );
              return;
            }
          } else if (!trackedTxIdsRef.current.has(transactionMeta.id)) {
            return;
          }

          log.debug(`${logPrefix} tx rejected → TransactionRejected`);
          dispatchRef.current({
            type: HardwareWalletSignatureEvent.TransactionRejected,
          });
        },
      );
      unsubscribes.push(unsubscribeRejected);

      const unsubscribeFinished = await subscribeToMessengerEvent<
        [{ transactionMeta: TransactionMeta }]
      >(
        'TransactionController:transactionFinished',
        ([{ transactionMeta }]) => {
          if (cancelled) {
            return;
          }

          checkGeneration();

          const { status, type } = transactionMeta;

          log.debug(
            `${logPrefix} transactionFinished`,
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

          if (useBatchTracking) {
            const batchId = transactionMeta.batchId ?? 'batch-unknown';
            seenBatchIdsRef.current.add(batchId);
            trackedTxIdsRef.current.add(transactionMeta.id);
          }

          if (handlePendingAbort(transactionMeta.id)) {
            return;
          }

          if (useBatchTracking) {
            if (shouldBlockPendingEvent(currentBatchIdRef.current)) {
              log.debug(
                `${logPrefix} skipping transactionFinished: no batch identified yet`,
              );
              return;
            }
            if (
              currentBatchIdRef.current !== undefined &&
              !isFromCurrentBatch(
                transactionMeta,
                currentBatchIdRef.current,
                staleBatchIdsRef.current,
              )
            ) {
              log.debug(
                `${logPrefix} skipping transactionFinished from stale batch`,
                JSON.stringify({
                  eventBatchId: transactionMeta.batchId,
                  currentBatchId: currentBatchIdRef.current,
                }),
              );
              return;
            }
          } else if (!trackedTxIdsRef.current.has(transactionMeta.id)) {
            return;
          }

          if (status === 'rejected') {
            log.debug(
              `${logPrefix} transactionFinished rejected → TransactionRejected`,
            );
            dispatchRef.current({
              type: HardwareWalletSignatureEvent.TransactionRejected,
            });
          } else if (status === 'failed') {
            log.debug(
              `${logPrefix} transactionFinished failed → TransactionFailed`,
            );
            dispatchRef.current({
              type: HardwareWalletSignatureEvent.TransactionFailed,
            });
          }
        },
      );
      unsubscribes.push(unsubscribeFinished);
    };

    subscribeAll().catch((err: unknown) => {
      log.error(`${logPrefix} subscription error`, err);
    });

    return () => {
      cancelled = true;
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
  ]);

  return { cancelCurrentBatch };
}
