import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  hasTransactionType,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import {
  selectPaymentOverrideByTransactionId,
  selectTransactionPayIsMaxAmountByTransactionId,
  type TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { useConfirmContext } from '../../context/confirm';
import { clearPaymentOverride } from '../../utils/transaction-pay';

/**
 * Clears any active paymentOverride on the current confirmation.
 * Call from non-money-account pay option handlers.
 *
 * `atomic` is re-derived rather than blindly cleared: a max-amount Money
 * Account deposit sets `atomic: false` independently of the pay-with
 * selection (via `useTransactionCustomAmount`'s `setIsMax`), so it must survive
 * a payment-method switch while `isMaxAmount` remains on.
 */
export function useClearPaymentOverride(): () => void {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const paymentOverride = useSelector((state: TransactionPayState) =>
    selectPaymentOverrideByTransactionId(state, transactionId),
  );
  const isMaxAmount = useSelector((state: TransactionPayState) =>
    selectTransactionPayIsMaxAmountByTransactionId(state, transactionId),
  );
  const isMoneyAccountDeposit = hasTransactionType(currentConfirmation, [
    TransactionType.moneyAccountDeposit,
  ]);

  return useCallback(() => {
    if (transactionId && paymentOverride) {
      clearPaymentOverride(
        transactionId,
        isMoneyAccountDeposit && isMaxAmount ? false : undefined,
      );
    }
  }, [isMaxAmount, isMoneyAccountDeposit, paymentOverride, transactionId]);
}
