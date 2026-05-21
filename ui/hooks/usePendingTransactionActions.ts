import type { EditGasModes } from '../../shared/constants/gas';
import type { TransactionGroup } from '../../shared/lib/multichain/types';
import { usePendingTransactionActionVisibility } from './usePendingTransactionActionVisibility';
import { usePendingTransactionCancelSpeedUpHandlers } from './usePendingTransactionCancelSpeedUpHandlers';

type UsePendingTransactionActionsParams = {
  transactionGroup: TransactionGroup;
  isEarliestNonce: boolean;
  setEditGasMode: (mode: EditGasModes) => void;
};

/**
 * Visibility and handlers for pending transaction Cancel / Speed up controls.
 * For use in activity list rows (legacy and new).
 */
export function usePendingTransactionActions({
  transactionGroup,
  isEarliestNonce,
  setEditGasMode,
}: UsePendingTransactionActionsParams) {
  const { showCancel, showSpeedUp, speedUpLabel } =
    usePendingTransactionActionVisibility(transactionGroup, isEarliestNonce);

  const { onSpeedUp, onCancel } = usePendingTransactionCancelSpeedUpHandlers({
    primaryTransaction: transactionGroup.primaryTransaction,
    setEditGasMode,
  });

  const onSpeedUpClick = transactionGroup.hasCancelled ? onCancel : onSpeedUp;

  return {
    showCancel,
    showSpeedUp,
    speedUpLabel,
    onCancel,
    onSpeedUp: onSpeedUpClick,
  };
}
