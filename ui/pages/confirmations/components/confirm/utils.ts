import { TransactionMeta } from '@metamask/transaction-controller';
import { parseTypedDataMessage } from '../../../../../shared/modules/transaction.utils';
import { Confirmation, SignatureRequestType } from '../../types/confirm';
import { DAI_CONTRACT_ADDRESS } from './info/shared/constants';

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

export const formatNumber = (value: number, decimals: number) => {
  if (value === undefined) {
    return value;
  }
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return formatter.format(value);
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
