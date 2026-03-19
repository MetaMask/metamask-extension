import { TransactionType } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';

import { selectUnapprovedMessage } from '../../../selectors/signatures';
import { SignatureRequestType } from '../types/confirm';
import { useConfirmationId } from './useConfirmationId';

const FALLBACK_SIGNATURE_REQUEST: SignatureRequestType = {
  id: '',
  type: TransactionType.personalSign,
};

export function useSignatureRequestOptional():
  | SignatureRequestType
  | undefined {
  const confirmationId = useConfirmationId();

  const signatureMessage = useSelector((state) =>
    selectUnapprovedMessage(state, confirmationId as string),
  );

  return signatureMessage as SignatureRequestType | undefined;
}

export function useSignatureRequest(): SignatureRequestType {
  return useSignatureRequestOptional() ?? FALLBACK_SIGNATURE_REQUEST;
}
