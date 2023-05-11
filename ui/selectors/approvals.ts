import { ApprovalControllerState } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';

type ApprovalsMetaMaskState = {
  metamask: {
    pendingApprovals: ApprovalControllerState['pendingApprovals'];
  };
};

export function getPendingApprovals(state: ApprovalsMetaMaskState) {
  return Object.values(state.metamask.pendingApprovals);
}

export function hasPendingApprovalsSelector(
  state: ApprovalsMetaMaskState,
  approvalType: ApprovalType,
) {
  const pendingApprovalRequests = Object.values(
    state.metamask.pendingApprovals,
  ).filter(({ type }) => type === approvalType);

  return pendingApprovalRequests.length > 0;
}
