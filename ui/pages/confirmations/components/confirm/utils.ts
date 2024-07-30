import { TransactionMeta } from '@metamask/transaction-controller';
import { Confirmation, SignatureRequestType } from '../../types/confirm';

export const getConfirmationSender = (
  currentConfirmation: Confirmation | undefined,
): { from: string | undefined } => {
  const msgParams = (currentConfirmation as SignatureRequestType)?.msgParams;
  const txParams = (currentConfirmation as TransactionMeta)?.txParams;

  let from: string | undefined;
  if (msgParams) {
    from = msgParams.from;
  }
  if (txParams) {
    from = txParams.from;
  }

  return { from };
};
