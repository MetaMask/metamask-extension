import type { SignatureRequest } from '@metamask/signature-controller';
import {
  SignatureRequestStatus,
  SignatureRequestType,
} from '@metamask/signature-controller';
import { useSelector } from 'react-redux';

import {
  SignatureState,
  selectUnapprovedSignatureRequestById,
} from '../../../../selectors/signatures';
import { useConfirmationId } from '../useConfirmationId';

const FALLBACK_SIGNATURE_REQUEST: SignatureRequest = {
  id: '',
  chainId: '0x0',
  networkClientId: '',
  status: SignatureRequestStatus.Unapproved,
  time: 0,
  type: SignatureRequestType.PersonalSign,
  messageParams: {
    from: '0x0000000000000000000000000000000000000000',
    data: '0x',
  },
};

export function useSignatureRequestOptional(): SignatureRequest | undefined {
  const confirmationId = useConfirmationId();

  return useSelector((state) =>
    selectUnapprovedSignatureRequestById(
      state as SignatureState,
      confirmationId,
    ),
  );
}

export function useSignatureRequest(): SignatureRequest {
  return useSignatureRequestOptional() ?? FALLBACK_SIGNATURE_REQUEST;
}
