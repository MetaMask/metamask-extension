import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  getPostQuoteWithdrawTransactionType,
  isPostQuoteWithdrawTransaction,
} from '../../../../../shared/lib/transactions.utils';
import { selectPayQuoteConfig } from '../../selectors/feature-flags';
import { useConfirmContext } from '../../context/confirm';

export type UseTransactionPayWithdrawResult = {
  /**
   * Whether this transaction is a post-quote withdraw type.
   *
   * Use for behaviour that holds in both flag states, i.e. that follows from
   * the funds being sourced off-chain — for example keeping the amount input
   * usable when the wallet holds no tokens.
   */
  isWithdraw: boolean;
  /**
   * Whether the post-quote bridge is enabled for this withdraw type
   * (`confirmations_pay_post_quote`), which is also what allows the user to
   * select a different receive token.
   *
   * Use for anything that only holds while bridging: the receive-token picker,
   * the "you'll receive" row, and suppressing balance/gas alerts. With the flag
   * off the withdraw falls back to a direct transfer with regular source-token
   * and native-gas semantics.
   */
  canSelectWithdrawToken: boolean;
};

/**
 * Hook for checking withdraw transaction status and the post-quote feature flag.
 *
 * Mirrors mobile `useTransactionPayWithdraw`. When `canSelectWithdrawToken` is
 * false, money-account withdraws fall back to a direct transfer (no receive-token
 * picker / no post-quote bridge).
 */
export function useTransactionPayWithdraw(): UseTransactionPayWithdrawResult {
  const { currentConfirmation } = useConfirmContext<
    TransactionMeta | undefined
  >();
  const isWithdraw = isPostQuoteWithdrawTransaction(currentConfirmation);
  const transactionType =
    getPostQuoteWithdrawTransactionType(currentConfirmation);
  const config = useSelector((state) =>
    selectPayQuoteConfig(state, transactionType),
  );

  const canSelectWithdrawToken = isWithdraw && config.enabled === true;

  return {
    isWithdraw,
    canSelectWithdrawToken,
  };
}
