import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  getPostQuoteWithdrawTransactionType,
  isPostQuoteWithdrawTransaction,
} from '../../../../../shared/lib/transactions.utils';
import { selectPayQuoteConfig } from '../../selectors/feature-flags';
import { useConfirmContext } from '../../context/confirm';

export type UseTransactionPayWithdrawResult = {
  /** Whether this transaction is a post-quote withdraw type */
  isWithdraw: boolean;
  /** Whether the user can select a different withdraw token (feature flag) */
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
