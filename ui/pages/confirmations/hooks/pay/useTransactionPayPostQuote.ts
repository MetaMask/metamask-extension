import { useEffect, useRef } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../context/confirm';
import { setPostQuote } from '../../../../store/controller-actions/transaction-pay-controller';
import { isPerpsWithdrawTransaction } from '../../../../../shared/lib/transactions.utils';

/**
 * Configures TransactionPayController to use post-quote mode for withdrawal
 * flows that need it (e.g. Perps withdraw via HyperLiquid -> Relay).
 */
export function useTransactionPayPostQuote(): void {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id;
  const isSet = useRef<string | null>(null);

  const isPerpsWithdraw = isPerpsWithdrawTransaction(currentConfirmation);

  useEffect(() => {
    if (!transactionId || isSet.current === transactionId || !isPerpsWithdraw) {
      return;
    }

    setPostQuote(transactionId, { isHyperliquidSource: true }).catch(
      (error) => {
        console.error('Failed to set post-quote config', error);
      },
    );

    isSet.current = transactionId;
  }, [isPerpsWithdraw, transactionId]);
}
