import { useMemo } from 'react';
import { TransactionType } from '@metamask/transaction-controller';
import type { TransactionGroup } from '../../shared/lib/multichain/types';
import {
  getPendingTransactionActionVisibility,
  isIntentBridgeActivity,
  type PendingTransactionActionVisibility,
} from '../helpers/transactions/pending-transaction-actions';
import { useBridgeTxHistoryData } from './bridge/useBridgeTxHistoryData';
import { useShouldShowSpeedUp } from './useShouldShowSpeedUp';

/**
 * Cancel / speed-up visibility for a local EVM transaction group.
 *
 * @param transactionGroup - Group from transaction selectors.
 * @param isEarliestNonce - Whether this group has the earliest pending nonce on its chain.
 */
export const usePendingTransactionActionVisibility = (
  transactionGroup: TransactionGroup,
  isEarliestNonce: boolean,
): PendingTransactionActionVisibility => {
  const shouldShowSpeedUp = useShouldShowSpeedUp(
    transactionGroup,
    isEarliestNonce,
  );
  const { bridgeHistoryItem } = useBridgeTxHistoryData({ transactionGroup });

  const isBridgeTx =
    transactionGroup.initialTransaction.type === TransactionType.bridge;

  return useMemo(
    () =>
      getPendingTransactionActionVisibility({
        hasCancelled: transactionGroup.hasCancelled,
        primaryTransaction: transactionGroup.primaryTransaction,
        shouldShowSpeedUp,
        isBridgeTx,
        hasIntentBridgeActivity: isIntentBridgeActivity(bridgeHistoryItem),
      }),
    [
      transactionGroup.hasCancelled,
      transactionGroup.primaryTransaction,
      shouldShowSpeedUp,
      isBridgeTx,
      bridgeHistoryItem,
    ],
  );
}
