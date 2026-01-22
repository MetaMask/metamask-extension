import { useConfirmContext } from '../context/confirm';
import { SignatureRequestType } from '../types/confirm';
import { isSignatureTransactionType } from '../utils';

/**
 * Returns the signature request for the current confirmation.
 * Returns undefined if the current confirmation is a transaction.
 *
 * @returns The signature request or undefined.
 */
export function useSignatureRequest(): SignatureRequestType | undefined {
  const { currentConfirmation } = useConfirmContext();

  if (
    !currentConfirmation ||
    !isSignatureTransactionType(currentConfirmation)
  ) {
    return undefined;
  }

  return currentConfirmation as SignatureRequestType;
}
