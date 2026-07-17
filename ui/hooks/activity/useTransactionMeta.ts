import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { selectLocalTransactionsByHash } from '../../selectors/activity';

/**
 * Used for enriching activity items with local-only data e.g. `metamaskPay`
 *
 * @param hash - Transaction identifier
 */
export function useTransactionMeta(
  hash: string | undefined,
): TransactionMeta | undefined {
  const localTransactions = useSelector(selectLocalTransactionsByHash);
  return localTransactions.get((hash ?? '').toLowerCase())?.initialTransaction;
}
