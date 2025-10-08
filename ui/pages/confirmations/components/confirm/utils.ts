import { TransactionMeta } from '@metamask/transaction-controller';
import { parseTypedDataMessage } from '../../../../../shared/modules/transaction.utils';
import { SignatureRequestType } from '../../types/confirm';
import { DAI_CONTRACT_ADDRESS } from './info/shared/constants';

export const getConfirmationSender = (
  transactionMeta: TransactionMeta | undefined,
  signatureRequest: SignatureRequestType | undefined,
): { from: string | undefined } => {
  const msgParams = signatureRequest?.msgParams;
  const txParams = transactionMeta?.txParams;

  let from: string | undefined;
  if (msgParams) {
    from = msgParams.from;
  }
  if (txParams) {
    from = txParams.from;
  }

  return { from };
};

export const getIsRevokeDAIPermit = (confirmation: SignatureRequestType) => {
  const msgData = confirmation?.msgParams?.data;
  const {
    message,
    domain: { verifyingContract },
  } = parseTypedDataMessage(msgData as string);
  const isRevokeDAIPermit =
    message.allowed === false && verifyingContract === DAI_CONTRACT_ADDRESS;

  return isRevokeDAIPermit;
};
