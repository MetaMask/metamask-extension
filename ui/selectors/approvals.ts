import { ApprovalRequest } from '@metamask/approval-controller';
import { ApprovalType, Json } from '@metamask/controller-utils';

type ApprovalsMetaMaskState = {
  metamask: {
    pendingApprovals: ApprovalRequest<Record<string, Json> | null>[];
  };
};

export function hasPendingApprovals(
  state: ApprovalsMetaMaskState,
  approvalType: ApprovalType,
) {
  const pendingApprovalRequests = Object.values(state.metamask.pendingApprovals)
    .filter(({ type }) => type === approvalType)
    .map(({ requestData }) => requestData);

  return pendingApprovalRequests.length > 0;
}
