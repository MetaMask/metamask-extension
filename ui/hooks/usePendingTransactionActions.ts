import { type MouseEvent as ReactMouseEvent } from 'react';
import type { EditGasModes } from '../../shared/constants/gas';
import type { TransactionGroup } from '../../shared/lib/multichain/types';
import type { PendingTransactionSpeedUpLabel } from '../helpers/transactions/pending-transaction-actions';
import { usePendingTransactionActionVisibility } from './usePendingTransactionActionVisibility';
import { usePendingTransactionCancelSpeedUpHandlers } from './usePendingTransactionCancelSpeedUpHandlers';

export type PendingTransactionSpeedUpAction = {
  show: boolean;
  label: PendingTransactionSpeedUpLabel;
  onClick: (event: ReactMouseEvent) => void;
};

type UsePendingTransactionActionsParams = {
  transactionGroup: TransactionGroup;
  isEarliestNonce: boolean;
  setEditGasMode: (mode: EditGasModes) => void;
  /** From the caller's single `useBridgeTxHistoryData` lookup (avoids duplicate bridge hooks). */
  hasIntentBridgeActivity: boolean;
};

/**
 * Visibility and handlers for pending transaction Cancel / Speed up controls.
 * For use in activity list rows (legacy and new).
 *
 * @param options - Pending action inputs for the transaction group row.
 * @param options.transactionGroup - Local EVM transaction group for the row.
 * @param options.isEarliestNonce - Whether this group has the earliest pending nonce on its chain.
 * @param options.setEditGasMode - Sets cancel vs speed-up mode before opening the gas modal.
 * @param options.hasIntentBridgeActivity - Whether bridge history is an intent-bridge flow.
 */
export const usePendingTransactionActions = ({
  transactionGroup,
  isEarliestNonce,
  setEditGasMode,
  hasIntentBridgeActivity,
}: UsePendingTransactionActionsParams) => {
  const { showCancel, showSpeedUp, speedUpLabel } =
    usePendingTransactionActionVisibility(
      transactionGroup,
      isEarliestNonce,
      hasIntentBridgeActivity,
    );

  const { onSpeedUp, onCancel } = usePendingTransactionCancelSpeedUpHandlers({
    primaryTransaction: transactionGroup.primaryTransaction,
    setEditGasMode,
  });

  const speedUpOnClick = transactionGroup.hasCancelled ? onCancel : onSpeedUp;

  const speedUp: PendingTransactionSpeedUpAction = {
    show: showSpeedUp,
    label: speedUpLabel,
    onClick: speedUpOnClick,
  };

  return {
    showCancel,
    onCancel,
    speedUp,
  };
};
