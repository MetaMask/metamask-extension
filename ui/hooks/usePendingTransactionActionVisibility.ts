import { TransactionType } from '@metamask/transaction-controller';
import type { TransactionGroup } from '../../shared/lib/multichain/types';
import {
  getPendingTransactionActionVisibility,
  type PendingTransactionActionVisibility,
} from '../helpers/transactions/pending-transaction-actions';
import { useShouldShowSpeedUp } from './useShouldShowSpeedUp';

/**
 * Cancel / speed-up visibility for a local EVM transaction group.
 *
 * @param transactionGroup - Group from transaction selectors.
 * @param isEarliestNonce - Whether this group has the earliest pending nonce on its chain.
 * @param hasIntentBridgeActivity - Whether bridge history is an intent-bridge flow (from caller's bridge lookup).
 */
export const usePendingTransactionActionVisibility = (
  transactionGroup: TransactionGroup,
  isEarliestNonce: boolean,
  hasIntentBridgeActivity: boolean,
): PendingTransactionActionVisibility => {
  const shouldShowSpeedUp = useShouldShowSpeedUp(
    transactionGroup,
    isEarliestNonce,
  );

  const isBridgeTx =
    transactionGroup.initialTransaction.type === TransactionType.bridge;

  return getPendingTransactionActionVisibility({
    hasCancelled: transactionGroup.hasCancelled,
    primaryTransaction: transactionGroup.primaryTransaction,
    shouldShowSpeedUp,
    isBridgeTx,
    hasIntentBridgeActivity,
  });
};
