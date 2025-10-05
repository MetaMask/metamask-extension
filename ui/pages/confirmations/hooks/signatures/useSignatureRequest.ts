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

export function useSignatureRequest() {
  const approvalRequest = useApprovalRequest();
  const signatureRequestId = approvalRequest?.id;

  return useSelector((state: SignaturesRootState) =>
    selectUnapprovedMessage(state, signatureRequestId),
  );
}

export function useSignatureRequestWithFallback(): LegacyStateMessage {
  const signatureRequest = useSignatureRequest();

  return useMemo(() => {
    return (
      signatureRequest ?? {
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
