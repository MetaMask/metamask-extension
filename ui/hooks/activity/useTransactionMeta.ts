import { useSelector } from 'react-redux';
import { selectLocalTransactionsByHash } from '../../selectors/activity';

/**
 * Used for enriching activity items with local-only data.
 * This is where `metamaskPay` and other per-transaction metadata live.
 *
 * @param hash - The activity item hash
 */
export function useTransactionMeta(hash: string | undefined) {
  const localTransactionsByHash = useSelector(selectLocalTransactionsByHash);
  return localTransactionsByHash.get((hash ?? '').toLowerCase())
    ?.initialTransaction;
}
