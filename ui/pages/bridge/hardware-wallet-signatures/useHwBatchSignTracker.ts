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

export function useHwBatchSignTracker(
  fromAddress: string | undefined,
  hardwareWalletUsed: boolean | undefined,
  needsTwoConfirmations: boolean | undefined,
  dispatchSignatureEvent: (event: {
    type: HardwareWalletSignatureEvent;
  }) => void,
) {
  const dispatchRef = useRef(dispatchSignatureEvent);
  dispatchRef.current = dispatchSignatureEvent;

  useEffect(() => {
    if (!fromAddress || !hardwareWalletUsed || !needsTwoConfirmations) {
      return undefined;
    }

    let cancelled = false;

    const subscribe = async () => {
      const unsubscribe = await subscribeToMessengerEvent<
        [{ transactionMeta: TransactionMeta }]
      >(
        'TransactionController:transactionStatusUpdated',
        ([{ transactionMeta }]) => {
          if (cancelled) {
            return;
          }

          const { status, type, txParams } = transactionMeta;
          const normalizedFrom = txParams.from?.toLowerCase();
          const targetFrom = fromAddress?.toLowerCase();

          console.log(
            '[HW-Batch] transactionStatusUpdated',
            JSON.stringify({
              id: transactionMeta.id,
              status,
              type,
              from: normalizedFrom,
              batchId: transactionMeta.batchId,
            }),
          );

          if (normalizedFrom !== targetFrom) {
            console.log('[HW-Batch] skipping: from address mismatch');
            return;
          }

          if (status !== 'signed') {
            console.log('[HW-Batch] skipping: status not signed');
            return;
          }

          if (APPROVAL_TYPES.has(type as TransactionType)) {
            console.log('[HW-Batch] approval signed → FirstSignatureSubmitted');
            dispatchRef.current({
              type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
            });
          } else if (TRADE_TYPES.has(type as TransactionType)) {
            console.log('[HW-Batch] trade signed', type);
          } else {
            console.log('[HW-Batch] skipping: unmatched type', type);
          }
        },
      );

      return unsubscribe;
    };

    const pendingUnsubscribe = subscribe();

    return () => {
      cancelled = true;
      pendingUnsubscribe
        .then((unsubscribe) => unsubscribe?.())
        .catch(
          // eslint-disable-next-line no-empty-function
          () => {},
        );
    };
  }, [fromAddress, hardwareWalletUsed, needsTwoConfirmations]);
}
