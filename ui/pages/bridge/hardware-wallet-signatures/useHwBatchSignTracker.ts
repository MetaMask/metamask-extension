import { useEffect, useRef } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionType } from '@metamask/transaction-controller';
import { subscribeToMessengerEvent } from '../../../store/background-connection';
import { HardwareWalletSignatureEvent } from './hardware-wallet-signatures-state-machine';

const APPROVAL_TYPES = new Set([
  TransactionType.bridgeApproval,
  TransactionType.swapApproval,
]);

const TRADE_TYPES = new Set([TransactionType.bridge, TransactionType.swap]);
const ALL_BATCH_TYPES = new Set([...APPROVAL_TYPES, ...TRADE_TYPES]);

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

export function useHwBatchSignTracker(
  fromAddress: string | undefined,
  hardwareWalletUsed: boolean | undefined,
  needsTwoConfirmations: boolean | undefined,
  dispatchSignatureEvent: (event: {
    type: HardwareWalletSignatureEvent;
  }) => void,
  isDeviceDisconnectedRef: React.RefObject<boolean>,
) {
  const dispatchRef = useRef(dispatchSignatureEvent);
  dispatchRef.current = dispatchSignatureEvent;

  useEffect(() => {
    if (!fromAddress || !hardwareWalletUsed) {
      return undefined;
    }

    let cancelled = false;
    const targetFrom = fromAddress.toLowerCase();
    const unsubscribes: (() => Promise<void>)[] = [];

    const subscribeAll = async () => {
      const unsub1 = await subscribeToMessengerEvent<
        [{ transactionMeta: TransactionMeta }]
      >(
        'TransactionController:transactionStatusUpdated',
        ([{ transactionMeta }]) => {
          if (cancelled) {
            return;
          }

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

          if (status === 'signed') {
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
            if (isDeviceDisconnectedRef.current) {
              console.log(
                '[HW-Batch] skipping transactionStatusUpdated failed (device disconnected)',
              );
              return;
            }
            console.log(
              '[HW-Batch] transactionStatusUpdated failed → TransactionRejected',
            );
            dispatchRef.current({
              type: HardwareWalletSignatureEvent.TransactionRejected,
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

          if (isDeviceDisconnectedRef.current) {
            console.log(
              '[HW-Batch] skipping transactionRejected (device disconnected)',
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

          if (isDeviceDisconnectedRef.current) {
            console.log(
              '[HW-Batch] skipping transactionFinished (device disconnected)',
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
        unsub.catch(
          // eslint-disable-next-line no-empty-function
          () => {},
        );
      }
    };
  }, [fromAddress, hardwareWalletUsed, isDeviceDisconnectedRef]);
}
