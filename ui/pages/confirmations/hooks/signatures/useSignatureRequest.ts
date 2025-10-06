import { useSelector } from 'react-redux';
import { useApprovalRequest } from '../useApprovalRequest';
import {
  SignaturesRootState,
  selectUnapprovedMessage,
} from '../../../../selectors/signatures';
import { useMemo } from 'react';
import {
  LegacyStateMessage,
  SignatureRequestStatus,
  SignatureRequestType,
} from '@metamask/signature-controller';
import { SignatureRequestType as SignatureRequest } from '../../types/confirm';

export function useSignatureRequest() {
  const approvalRequest = useApprovalRequest();
  const signatureRequestId = approvalRequest?.id;

  return useSelector((state: SignaturesRootState) =>
    selectUnapprovedMessage(state, signatureRequestId),
  ) as SignatureRequest | undefined;
}

export function useSignatureRequestWithFallback() {
  const signatureRequest = useSignatureRequest();

  return useMemo(() => {
    return (
      signatureRequest as SignatureRequest ?? {
        chainId: '0x0',
        id: '',
        msgParams: {
          data: 'test',
          from: '',
        },
        networkClientId: '',
        status: SignatureRequestStatus.Unapproved,
        time: Date.now(),
        type: SignatureRequestType.TypedSign,
      }
    );
  }, [signatureRequest]);
}
