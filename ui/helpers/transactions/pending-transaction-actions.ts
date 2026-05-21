import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { isTransactionPending } from './is-transaction-pending';

export type PendingTransactionSpeedUpLabel = 'speedUp' | 'speedUpCancellation';

export type PendingTransactionActionVisibility = {
  showCancel: boolean;
  showSpeedUp: boolean;
  speedUpLabel: PendingTransactionSpeedUpLabel;
};

export type GetPendingTransactionActionVisibilityParams = {
  hasCancelled: boolean;
  primaryTransaction: TransactionMeta;
  shouldShowSpeedUp: boolean;
  isBridgeTx: boolean;
  hasIntentBridgeActivity: boolean;
};

/**
 * Resolves whether Cancel / Speed up controls should appear for a pending EVM
 * transaction group. Mirrors legacy activity list rules.
 *
 * @param params - Inputs derived from the transaction group and bridge context.
 * @param params.hasCancelled - Whether the group already has a cancel transaction.
 * @param params.primaryTransaction - Primary transaction meta for the group.
 * @param params.shouldShowSpeedUp - Whether speed-up timing/chain rules allow the control.
 * @param params.isBridgeTx - Whether the initial transaction is a bridge type.
 * @param params.hasIntentBridgeActivity - Whether bridge history is an intent-bridge flow.
 */
export const getPendingTransactionActionVisibility = ({
  hasCancelled,
  primaryTransaction,
  shouldShowSpeedUp,
  isBridgeTx,
  hasIntentBridgeActivity,
}: GetPendingTransactionActionVisibilityParams): PendingTransactionActionVisibility => {
  const { status, selectedGasFeeToken } = primaryTransaction;
  const hasGasFeeTokenSelected = Boolean(selectedGasFeeToken);
  const isPending = isTransactionPending(primaryTransaction);
  const isUnapproved = status === TransactionStatus.unapproved;
  const isSigning = status === TransactionStatus.approved;
  const isSubmitting = status === TransactionStatus.signed;

  const showSpeedUp =
    shouldShowSpeedUp &&
    isPending &&
    !isUnapproved &&
    !isSigning &&
    !isSubmitting &&
    !hasGasFeeTokenSelected;

  const showCancel =
    !hasCancelled &&
    isPending &&
    !isUnapproved &&
    !isSubmitting &&
    !isBridgeTx &&
    !hasIntentBridgeActivity &&
    !hasGasFeeTokenSelected;

  return {
    showCancel,
    showSpeedUp,
    speedUpLabel: hasCancelled ? 'speedUpCancellation' : 'speedUp',
  };
};

/**
 * Whether a bridge tx history item is an intent-bridge activity.
 *
 * @param bridgeHistoryItem - Bridge tx history item from selectors
 */
export const isIntentBridgeActivity = (
  bridgeHistoryItem?: { quote?: { intent?: unknown } } | null,
): boolean => {
  return Boolean(bridgeHistoryItem?.quote?.intent);
};
