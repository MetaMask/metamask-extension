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
 *
 * @param options - Pending action inputs for the transaction group row.
 * @param options.transactionGroup - Local EVM transaction group for the row.
 * @param options.isEarliestNonce - Whether this group has the earliest pending nonce on its chain.
 * @param options.setEditGasMode - Sets cancel vs speed-up mode before opening the gas modal.
 */
export const usePendingTransactionActions = ({
  transactionGroup,
  isEarliestNonce,
  setEditGasMode,
}: UsePendingTransactionActionsParams) => {
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
