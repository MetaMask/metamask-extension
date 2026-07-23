import type { SignatureRequest } from '@metamask/signature-controller';
import {
  SignatureRequestStatus,
  SignatureRequestType,
} from '@metamask/signature-controller';
import { useAppSelector } from '../../../../store/store';
import { selectUnapprovedSignatureRequestById } from '../../../../selectors/signatures';
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

  return useAppSelector((state) =>
    selectUnapprovedSignatureRequestById(state, confirmationId),
  );
}

export function useSignatureRequest(): SignatureRequest {
  return useSignatureRequestOptional() ?? FALLBACK_SIGNATURE_REQUEST;
}
