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

type HwBatchSignTrackerAction =
  | { type: HardwareWalletSignatureEvent.FirstSignatureSubmitted }
  | { type: HardwareWalletSignatureEvent.TransactionSubmitted }
  | { type: HardwareWalletSignatureEvent.TransactionRejected }
  | { type: HardwareWalletSignatureEvent.TransactionFailed };

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

export function useHwBatchSignTracker(
  fromAddress: string | undefined,
  hardwareWalletUsed: boolean | undefined,
  _needsTwoConfirmations: boolean | undefined,
  dispatchSignatureEvent: React.Dispatch<HwBatchSignTrackerAction>,
  retryGenerationRef?: React.RefObject<number>,
) {
  const dispatchRef = useRef(dispatchSignatureEvent);
  dispatchRef.current = dispatchSignatureEvent;

  const currentBatchIdRef = useRef<string | null | undefined>();
  const staleBatchIdsRef = useRef<Set<string>>(new Set());
  const seenBatchIdsRef = useRef<Set<string>>(new Set());
  const trackedTxIdsRef = useRef<Set<string>>(new Set());
  const lastSeenGenerationRef = useRef(retryGenerationRef?.current ?? 0);

  const cancelCurrentBatch = useCallback(async () => {
    const batchId = currentBatchIdRef.current;

    for (const txId of trackedTxIdsRef.current) {
      try {
        await submitRequestToBackground('abortTransactionSigning', [txId]);
      } catch {
        // Transaction may not be in signing state — expected
      }
    }

    if (batchId) {
      console.log('[HW-Batch] cancelCurrentBatch', JSON.stringify({ batchId }));
      try {
        await submitRequestToBackground('cancelTransactionBatch', [batchId]);
      } catch (err) {
        console.log(
          '[HW-Batch] cancelCurrentBatch failed (batch may have already completed)',
          err,
        );
      }
    }
  }, []);

  useEffect(() => {
    if (!fromAddress || !hardwareWalletUsed) {
      return undefined;
    }

    let cancelled = false;
    const targetFrom = fromAddress.toLowerCase();
    const unsubscribes: (() => Promise<void>)[] = [];

    const checkGeneration = () => {
      if (
        retryGenerationRef &&
        retryGenerationRef.current !== lastSeenGenerationRef.current
      ) {
        lastSeenGenerationRef.current = retryGenerationRef.current ?? 0;
        for (const id of seenBatchIdsRef.current) {
          staleBatchIdsRef.current.add(id);
        }
        seenBatchIdsRef.current = new Set();
        currentBatchIdRef.current = null;
      }
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
            '[HW-Batch] transactionStatusUpdated',
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
          seenBatchIdsRef.current.add(batchId);
          trackedTxIdsRef.current.add(transactionMeta.id);

          if (status === 'signed') {
            if (currentBatchIdRef.current === undefined) {
              currentBatchIdRef.current = batchId;
            } else if (currentBatchIdRef.current === null) {
              if (staleBatchIdsRef.current.has(batchId)) {
                console.log(
                  '[HW-Batch] skipping stale signed event after retry',
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
                '[HW-Batch] skipping signed event from stale batch',
                JSON.stringify({
                  eventBatchId: batchId,
                  currentBatchId: currentBatchIdRef.current,
                }),
              );
              return;
            }

            if (APPROVAL_TYPES.has(type as TransactionType)) {
              console.log(
                '[HW-Batch] approval signed → FirstSignatureSubmitted',
              );
              dispatchRef.current({
                type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
              });
            } else if (TRADE_TYPES.has(type as TransactionType)) {
              console.log('[HW-Batch] trade signed → TransactionSubmitted');
              dispatchRef.current({
                type: HardwareWalletSignatureEvent.TransactionSubmitted,
              });
            }
          } else if (status === 'failed') {
            if (shouldBlockPendingEvent(currentBatchIdRef.current)) {
              console.log(
                '[HW-Batch] skipping transactionStatusUpdated failed: no batch identified yet',
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
                '[HW-Batch] skipping transactionStatusUpdated failed from stale batch',
                JSON.stringify({
                  eventBatchId: transactionMeta.batchId,
                  currentBatchId: currentBatchIdRef.current,
                }),
              );
              return;
            }
            console.log(
              '[HW-Batch] transactionStatusUpdated failed → TransactionFailed',
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
            '[HW-Batch] transactionRejected',
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

          const batchId = transactionMeta.batchId ?? 'batch-unknown';
          seenBatchIdsRef.current.add(batchId);
          trackedTxIdsRef.current.add(transactionMeta.id);

          if (shouldBlockPendingEvent(currentBatchIdRef.current)) {
            console.log(
              '[HW-Batch] skipping transactionRejected: no batch identified yet',
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
              '[HW-Batch] skipping transactionRejected from stale batch',
              JSON.stringify({
                eventBatchId: transactionMeta.batchId,
                currentBatchId: currentBatchIdRef.current,
              }),
            );
            return;
          }

          console.log('[HW-Batch] tx rejected → TransactionRejected');
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
            '[HW-Batch] transactionFinished',
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
          seenBatchIdsRef.current.add(batchId);
          trackedTxIdsRef.current.add(transactionMeta.id);

          if (shouldBlockPendingEvent(currentBatchIdRef.current)) {
            console.log(
              '[HW-Batch] skipping transactionFinished: no batch identified yet',
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
              '[HW-Batch] skipping transactionFinished from stale batch',
              JSON.stringify({
                eventBatchId: transactionMeta.batchId,
                currentBatchId: currentBatchIdRef.current,
              }),
            );
            return;
          }

          if (status === 'rejected') {
            console.log(
              '[HW-Batch] transactionFinished rejected → TransactionRejected',
            );
            dispatchRef.current({
              type: HardwareWalletSignatureEvent.TransactionRejected,
            });
          } else if (status === 'failed') {
            console.log(
              '[HW-Batch] transactionFinished failed → TransactionFailed',
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
      console.error('[HW-Batch] subscription error', err);
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
  }, [fromAddress, hardwareWalletUsed, retryGenerationRef]);

  return { cancelCurrentBatch };
}
