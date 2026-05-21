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
  isIntentBridgeActivity: boolean;
};

/**
 * Resolves whether Cancel / Speed up controls should appear for a pending EVM
 * transaction group. Mirrors legacy activity list rules.
 *
 * @param params - Inputs derived from the transaction group and bridge context.
 */
export function getPendingTransactionActionVisibility({
  hasCancelled,
  primaryTransaction,
  shouldShowSpeedUp,
  isBridgeTx,
  isIntentBridgeActivity,
}: GetPendingTransactionActionVisibilityParams): PendingTransactionActionVisibility {
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
    !isIntentBridgeActivity &&
    !hasGasFeeTokenSelected;

  return {
    showCancel,
    showSpeedUp,
    speedUpLabel: hasCancelled ? 'speedUpCancellation' : 'speedUp',
  };
}

/**
 * Whether an intent-bridge history entry disables the cancel control.
 *
 * @param bridgeHistoryItem - Bridge tx history item from selectors, if any.
 */
export function isIntentBridgeActivity(
  bridgeHistoryItem?: { quote?: { intent?: unknown } } | null,
): boolean {
  return Boolean(bridgeHistoryItem?.quote?.intent);
}
