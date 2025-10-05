import { useSelector } from 'react-redux';
import { useApprovalRequest } from '../useApprovalRequest';
import {
  SignaturesRootState,
  selectSignatureRequestById,
} from '../../../../selectors/signatures';

export function useSignatureRequest() {
  const approvalRequest = useApprovalRequest();
  const signatureRequestId = approvalRequest?.id;

  return useSelector((state: SignaturesRootState) =>
    selectSignatureRequestById(state, signatureRequestId),
  );
}
