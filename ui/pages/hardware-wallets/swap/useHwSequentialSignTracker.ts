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

type HwSequentialSignTrackerAction =
  | { type: HardwareWalletSignatureEvent.FirstSignatureSubmitted }
  | { type: HardwareWalletSignatureEvent.TransactionSubmitted }
  | { type: HardwareWalletSignatureEvent.TransactionRejected }
  | { type: HardwareWalletSignatureEvent.TransactionFailed };

type HwSequentialSignTrackerOptions = {
  enabled?: boolean;
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

export function useHwSequentialSignTracker(
  fromAddress: string | undefined,
  hardwareWalletUsed: boolean | undefined,
  _needsTwoConfirmations: boolean | undefined,
  dispatchSignatureEvent: React.Dispatch<HwSequentialSignTrackerAction>,
  retryGenerationRef?: React.RefObject<number>,
  options?: HwSequentialSignTrackerOptions,
) {
  const dispatchRef = useRef(dispatchSignatureEvent);
  dispatchRef.current = dispatchSignatureEvent;

  const enabled = options?.enabled ?? true;

  const trackedTxIdsRef = useRef<Set<string>>(new Set());
  const lastSeenGenerationRef = useRef(retryGenerationRef?.current ?? 0);
  const pendingAbortTxIdsRef = useRef<Set<string>>(new Set());
  const abortSettleResolveRef = useRef<((value: void) => void) | null>(null);

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
    const unsubscribes: (() => Promise<void>)[] = [];

    const checkGeneration = () => {
      if (
        retryGenerationRef &&
        retryGenerationRef.current !== lastSeenGenerationRef.current
      ) {
        lastSeenGenerationRef.current = retryGenerationRef.current ?? 0;
        trackedTxIdsRef.current = new Set();
      }
    };

    const handlePendingAbort = (txId: string) => {
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
            '[HW-Sequential] transactionStatusUpdated',
            JSON.stringify({
              id: transactionMeta.id,
              status,
              type,
              from: transactionMeta.txParams.from,
            }),
          );

          if (!matchesTx(transactionMeta, targetFrom)) {
            return;
          }

          trackedTxIdsRef.current.add(transactionMeta.id);

          if (handlePendingAbort(transactionMeta.id)) {
            return;
          }

          if (status === 'signed') {
            if (APPROVAL_TYPES.has(type as TransactionType)) {
              console.log(
                '[HW-Sequential] approval signed → FirstSignatureSubmitted',
              );
              dispatchRef.current({
                type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
              });
            } else if (TRADE_TYPES.has(type as TransactionType)) {
              console.log(
                '[HW-Sequential] trade signed → TransactionSubmitted',
              );
              dispatchRef.current({
                type: HardwareWalletSignatureEvent.TransactionSubmitted,
              });
            }
          } else if (status === 'failed') {
            console.log(
              '[HW-Sequential] transactionStatusUpdated failed → TransactionFailed',
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
            '[HW-Sequential] transactionRejected',
            JSON.stringify({
              id: transactionMeta.id,
              type: transactionMeta.type,
              from: transactionMeta.txParams.from,
            }),
          );

          if (!matchesTx(transactionMeta, targetFrom)) {
            return;
          }

          if (handlePendingAbort(transactionMeta.id)) {
            return;
          }

          if (!trackedTxIdsRef.current.has(transactionMeta.id)) {
            return;
          }

          console.log(
            '[HW-Sequential] tx rejected → TransactionRejected',
          );
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

          const { status } = transactionMeta;

          console.log(
            '[HW-Sequential] transactionFinished',
            JSON.stringify({
              id: transactionMeta.id,
              status,
              type: transactionMeta.type,
              from: transactionMeta.txParams.from,
            }),
          );

          if (!matchesTx(transactionMeta, targetFrom)) {
            return;
          }

          if (handlePendingAbort(transactionMeta.id)) {
            return;
          }

          if (!trackedTxIdsRef.current.has(transactionMeta.id)) {
            return;
          }

          if (status === 'rejected') {
            console.log(
              '[HW-Sequential] transactionFinished rejected → TransactionRejected',
            );
            dispatchRef.current({
              type: HardwareWalletSignatureEvent.TransactionRejected,
            });
          } else if (status === 'failed') {
            console.log(
              '[HW-Sequential] transactionFinished failed → TransactionFailed',
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
      console.error('[HW-Sequential] subscription error', err);
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
  }, [fromAddress, hardwareWalletUsed, retryGenerationRef, enabled]);

  return { cancelCurrentBatch };
}
