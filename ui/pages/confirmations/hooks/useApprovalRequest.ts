import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Json } from '@metamask/utils';
import { ApprovalRequest } from '@metamask/approval-controller';
import { oldestPendingConfirmationSelector } from '../selectors';
import {
  ApprovalsMetaMaskState,
  selectPendingApproval,
} from '../../../selectors';

export function useApprovalRequest<
  RequestData extends Record<string, Json> | null,
>() {
  const { id: paramApprovalId } = useParams<{ id: string }>();
  const oldestPendingApproval = useSelector(oldestPendingConfirmationSelector);
  const approvalId = paramApprovalId ?? oldestPendingApproval?.id;

  const approvalRequest = useSelector((state) =>
    selectPendingApproval(state as ApprovalsMetaMaskState, approvalId),
  ) as ApprovalRequest<RequestData> | undefined;

  return approvalRequest;
}
