import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../context/confirm';
import { isSignatureTransactionType } from '../utils';

/**
 * Returns the unapproved transaction for the current confirmation.
 * Returns undefined if the current confirmation is a signature request.
 *
 * @returns The unapproved transaction or undefined.
 */
export function useUnapprovedTransaction(): TransactionMeta | undefined {
  const { currentConfirmation } = useConfirmContext();

  if (!currentConfirmation || isSignatureTransactionType(currentConfirmation)) {
    return undefined;
  }

  return currentConfirmation as TransactionMeta;
}
