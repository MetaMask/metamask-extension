import { useEffect, useRef } from 'react';
import {
  type TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { useConfirmContext } from '../../context/confirm';
import { selectPayPostQuoteConfig } from '../../selectors/feature-flags';
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
  const isPerpsWithdrawPostQuoteEnabled = useSelector(
    (state) =>
      selectPayPostQuoteConfig(state, TransactionType.perpsWithdraw).enabled ===
      true,
  );

  useEffect(() => {
    if (
      !transactionId ||
      isSet.current === transactionId ||
      !isPerpsWithdraw ||
      !isPerpsWithdrawPostQuoteEnabled
    ) {
      return;
    }

    // Mark in-flight synchronously so a strict-mode double-mount does not
    // dispatch twice. On rejection, reset the marker so a future deps
    // change (e.g. user navigates away and back) can retry instead of
    // being permanently stuck with an un-configured post-quote tx.
    isSet.current = transactionId;

    setPostQuote(transactionId, { isHyperliquidSource: true }).catch(
      (error) => {
        console.error('Failed to set post-quote config', error);
        if (isSet.current === transactionId) {
          isSet.current = null;
        }
      },
    );
  }, [isPerpsWithdraw, isPerpsWithdrawPostQuoteEnabled, transactionId]);
}
