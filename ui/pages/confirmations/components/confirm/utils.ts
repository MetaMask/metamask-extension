import { TransactionMeta } from '@metamask/transaction-controller';
import { Confirmation, SignatureRequestType } from '../../types/confirm';
import {
  isEip712PrimaryTypeField,
  parseSanitizeTypedDataMessage,
} from '../../utils';
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

export const getIsRevokeDAIPermit = (confirmation: SignatureRequestType) => {
  const msgData = confirmation?.msgParams?.data;
  const {
    message,
    domain: { verifyingContract },
    primaryType,
    types,
  } = parseSanitizeTypedDataMessage(msgData as string);
  const isRevokeDAIPermit =
    message.allowed === false &&
    isEip712PrimaryTypeField(types, primaryType, 'allowed', 'bool') &&
    isEip712PrimaryTypeField(
      types,
      'EIP712Domain',
      'verifyingContract',
      'address',
    ) &&
    typeof verifyingContract === 'string' &&
    verifyingContract.toLowerCase() === DAI_CONTRACT_ADDRESS.toLowerCase();

  return isRevokeDAIPermit;
};
