import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  selectPaymentOverrideByTransactionId,
  type TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { useConfirmContext } from '../../context/confirm';
import { clearPaymentOverride } from '../../utils/transaction-pay';

/**
 * Clears any active paymentOverride on the current confirmation.
 * Call from non-money-account pay option handlers.
 */
export function useClearPaymentOverride(): () => void {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const paymentOverride = useSelector((state: TransactionPayState) =>
    selectPaymentOverrideByTransactionId(state, transactionId),
  );

  return useCallback(() => {
    if (transactionId && paymentOverride) {
      clearPaymentOverride(transactionId);
    }
  }, [paymentOverride, transactionId]);
}
