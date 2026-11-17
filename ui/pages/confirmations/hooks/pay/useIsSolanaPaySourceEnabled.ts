import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { isPostQuoteWithdrawTransaction } from '../../../../../shared/lib/transactions.utils';
import { useConfirmContext } from '../../context/confirm';
import { selectIsSolanaPayEnabled } from '../../selectors/feature-flags';

/**
 * Whether the current confirmation may offer Solana SOL and SPL balances as
 * MetaMask Pay sources.
 *
 * Post-quote withdraws are excluded: there the selected token is the receive
 * destination, and Core only supports Solana as a source, so it would return
 * no quotes for a Solana destination.
 *
 * @returns True when the Solana Pay flag is on and the confirmation is not a
 * post-quote withdraw.
 */
export function useIsSolanaPaySourceEnabled(): boolean {
  const { currentConfirmation } = useConfirmContext<
    TransactionMeta | undefined
  >();
  const isSolanaPayEnabled = useSelector(selectIsSolanaPayEnabled);

  return (
    isSolanaPayEnabled && !isPostQuoteWithdrawTransaction(currentConfirmation)
  );
}
