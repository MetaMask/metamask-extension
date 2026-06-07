import { useCallback, useEffect, useRef } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionType } from '@metamask/transaction-controller';
import {
  subscribeToMessengerEvent,
  submitRequestToBackground,
} from '../../../store/background-connection';
import { HardwareWalletSignatureEvent } from './hardware-wallet-signatures-state-machine';

const APPROVAL_TYPES = new Set([
  TransactionType.bridgeApproval,
  TransactionType.swapApproval,
]);

const TRADE_TYPES = new Set([TransactionType.bridge, TransactionType.swap]);
const ALL_BATCH_TYPES = new Set([...APPROVAL_TYPES, ...TRADE_TYPES]);

export type HwSignTrackerAction =
  | { type: typeof HardwareWalletSignatureEvent.FirstSignatureSubmitted }
  | { type: typeof HardwareWalletSignatureEvent.TransactionSubmitted }
  | { type: typeof HardwareWalletSignatureEvent.TransactionRejected }
  | { type: typeof HardwareWalletSignatureEvent.TransactionFailed };

export type UseHwSignTrackerOptions = {
  enabled?: boolean;
  useBatchTracking: boolean;
};

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

function shouldBlockPendingEvent(
  currentBatchId: string | null | undefined,
): boolean {
  return currentBatchId === undefined;
}

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
  const useBatchTracking = options.useBatchTracking;

  // Shared refs (both modes)
  const trackedTxIdsRef = useRef<Set<string>>(new Set());
  const lastSeenGenerationRef = useRef(retryGenerationRef?.current ?? 0);
  const pendingAbortTxIdsRef = useRef<Set<string>>(new Set());
  const abortSettleResolveRef = useRef<((value: void) => void) | null>(null);

  // Batch-mode-only refs (unused in sequential mode)
  const currentBatchIdRef = useRef<string | null | undefined>();
  const staleBatchIdsRef = useRef<Set<string>>(new Set());
  const seenBatchIdsRef = useRef<Set<string>>(new Set());

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
      const unsub1 = await subscribeToMessengerEvent<
        [{ transactionMeta: TransactionMeta }]
      >(
        'TransactionController:transactionStatusUpdated',
        ([{ transactionMeta }]) => {
          if (cancelled) {
            return;
          }

          checkGeneration();

          const { status, type } = transactionMeta;

          console.log(
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
                  console.log(
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
                console.log(
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
              console.log(
                `${logPrefix} approval signed → FirstSignatureSubmitted`,
              );
              dispatchRef.current({
                type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
              });
            } else if (TRADE_TYPES.has(type as TransactionType)) {
              console.log(`${logPrefix} trade signed → TransactionSubmitted`);
              dispatchRef.current({
                type: HardwareWalletSignatureEvent.TransactionSubmitted,
              });
            }
          } else if (status === 'failed') {
            if (useBatchTracking) {
              if (shouldBlockPendingEvent(currentBatchIdRef.current)) {
                console.log(
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
                console.log(
                  `${logPrefix} skipping transactionStatusUpdated failed from stale batch`,
                  JSON.stringify({
                    eventBatchId: transactionMeta.batchId,
                    currentBatchId: currentBatchIdRef.current,
                  }),
                );
                return;
              }
            }
            console.log(
              `${logPrefix} transactionStatusUpdated failed → TransactionFailed`,
            );
            dispatchRef.current({
              type: HardwareWalletSignatureEvent.TransactionFailed,
            });
          }
        },
      );
      unsubscribes.push(unsub1);

      const unsub2 = await subscribeToMessengerEvent<
        [{ transactionMeta: TransactionMeta }]
      >(
        'TransactionController:transactionRejected',
        ([{ transactionMeta }]) => {
          if (cancelled) {
            return;
          }

          checkGeneration();

          console.log(
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
          }
          trackedTxIdsRef.current.add(transactionMeta.id);

          if (handlePendingAbort(transactionMeta.id)) {
            return;
          }

          if (useBatchTracking) {
            if (shouldBlockPendingEvent(currentBatchIdRef.current)) {
              console.log(
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
              console.log(
                `${logPrefix} skipping transactionRejected from stale batch`,
                JSON.stringify({
                  eventBatchId: transactionMeta.batchId,
                  currentBatchId: currentBatchIdRef.current,
                }),
              );
              return;
            }
          } else {
            if (!trackedTxIdsRef.current.has(transactionMeta.id)) {
              return;
            }
          }

          console.log(`${logPrefix} tx rejected → TransactionRejected`);
          dispatchRef.current({
            type: HardwareWalletSignatureEvent.TransactionRejected,
          });
        },
      );
      unsubscribes.push(unsub2);

      const unsub3 = await subscribeToMessengerEvent<
        [{ transactionMeta: TransactionMeta }]
      >(
        'TransactionController:transactionFinished',
        ([{ transactionMeta }]) => {
          if (cancelled) {
            return;
          }

          checkGeneration();

          const { status, type } = transactionMeta;

          console.log(
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
          }
          trackedTxIdsRef.current.add(transactionMeta.id);

          if (handlePendingAbort(transactionMeta.id)) {
            return;
          }

          if (useBatchTracking) {
            if (shouldBlockPendingEvent(currentBatchIdRef.current)) {
              console.log(
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
              console.log(
                `${logPrefix} skipping transactionFinished from stale batch`,
                JSON.stringify({
                  eventBatchId: transactionMeta.batchId,
                  currentBatchId: currentBatchIdRef.current,
                }),
              );
              return;
            }
          } else {
            if (!trackedTxIdsRef.current.has(transactionMeta.id)) {
              return;
            }
          }

          if (status === 'rejected') {
            console.log(
              `${logPrefix} transactionFinished rejected → TransactionRejected`,
            );
            dispatchRef.current({
              type: HardwareWalletSignatureEvent.TransactionRejected,
            });
          } else if (status === 'failed') {
            console.log(
              `${logPrefix} transactionFinished failed → TransactionFailed`,
            );
            dispatchRef.current({
              type: HardwareWalletSignatureEvent.TransactionFailed,
            });
          }
        },
      );
      unsubscribes.push(unsub3);
    };

    subscribeAll().catch((err: unknown) => {
      console.error(`${logPrefix} subscription error`, err);
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
