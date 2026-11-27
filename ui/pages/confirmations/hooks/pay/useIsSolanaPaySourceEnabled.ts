import { useSelector } from 'react-redux';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  hasTransactionType,
  isPostQuoteWithdrawTransaction,
} from '../../../../../shared/lib/transactions.utils';
import { useConfirmContext } from '../../context/confirm';
import { selectIsSolanaPayEnabled } from '../../selectors/feature-flags';

/**
 * Transaction types whose Solana source route Core builds end to end. Perps and
 * Predict deposits embed their calls in the quote; a Money Account deposit
 * bridges to the Money Account and Core runs the vault deposit as a non-atomic
 * second leg. Flows that need a client-specific selection, such as
 * deposit-and-order, stay EVM only.
 */
export const SOLANA_PAY_SOURCE_TRANSACTION_TYPES = [
  TransactionType.moneyAccountDeposit,
  TransactionType.perpsDeposit,
  TransactionType.predictDeposit,
];

/**
 * Whether the current confirmation may offer Solana SOL and SPL balances as
 * MetaMask Pay sources.
 *
 * Post-quote withdraws are excluded: there the selected token is the receive
 * destination, and Core only supports Solana as a source.
 *
 * @returns True when the Core Solana source gates are on for the transaction,
 * its type is supported, and it is not a post-quote withdraw.
 */
export function useIsSolanaPaySourceEnabled(): boolean {
  const { currentConfirmation } = useConfirmContext<
    TransactionMeta | undefined
  >();
  const isSolanaPayEnabled = useSelector((state) =>
    selectIsSolanaPayEnabled(state, currentConfirmation),
  );

  return (
    isSolanaPayEnabled &&
    hasTransactionType(
      currentConfirmation,
      SOLANA_PAY_SOURCE_TRANSACTION_TYPES,
    ) &&
    !isPostQuoteWithdrawTransaction(currentConfirmation)
  );
}
