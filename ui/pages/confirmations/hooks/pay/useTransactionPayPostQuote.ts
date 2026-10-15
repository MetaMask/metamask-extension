import { useEffect, useRef } from 'react';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import {
  hasTransactionType,
  isPerpsWithdrawTransaction,
} from '../../../../../shared/lib/transactions.utils';
import { useConfirmContext } from '../../context/confirm';
import { setPostQuote } from '../../../../store/controller-actions/transaction-pay-controller';
import { useTransactionPayWithdraw } from './useTransactionPayWithdraw';

/**
 * Configures TransactionPayController to use post-quote mode for withdrawal
 * flows that need it (Perps withdraw via HyperLiquid -> Relay; money-account
 * withdraw destination-token bridging).
 *
 * When `confirmations_pay_post_quote` is disabled for the transaction type via
 * `canSelectWithdrawToken`, this hook does nothing — withdrawals use a
 * same-token / direct-transfer path without bridging.
 */
export function useTransactionPayPostQuote(): void {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id;
  const isSet = useRef<string | null>(null);
  const { canSelectWithdrawToken } = useTransactionPayWithdraw();

  const isPerpsWithdraw = isPerpsWithdrawTransaction(currentConfirmation);
  const isMoneyAccountWithdraw = hasTransactionType(currentConfirmation, [
    TransactionType.moneyAccountWithdraw,
  ]);

  useEffect(() => {
    if (
      !canSelectWithdrawToken ||
      !transactionId ||
      isSet.current === transactionId ||
      !(isPerpsWithdraw || isMoneyAccountWithdraw)
    ) {
      return;
    }

    // Mark in-flight synchronously so a strict-mode double-mount does not
    // dispatch twice. On rejection, reset the marker so a future deps
    // change (e.g. user navigates away and back) can retry instead of
    // being permanently stuck with an un-configured post-quote tx.
    isSet.current = transactionId;

    // Perps withdraws source funds from HyperLiquid, so the bridge needs
    // `isHyperliquidSource` to quote HyperCore -> Relay. Money-account
    // withdraws intentionally pass an empty config: funds come from the vault
    // teller straight to the user's address, so there is no special source to
    // declare and no `refundTo` (unlike Predict, which refunds to a Safe
    // proxy). Enabling post-quote mode alone is enough.
    setPostQuote(
      transactionId,
      isPerpsWithdraw ? { isHyperliquidSource: true } : {},
    ).catch((error) => {
      console.error('Failed to set post-quote config', error);
      if (isSet.current === transactionId) {
        isSet.current = null;
      }
    });
  }, [
    canSelectWithdrawToken,
    isMoneyAccountWithdraw,
    isPerpsWithdraw,
    transactionId,
  ]);
}
