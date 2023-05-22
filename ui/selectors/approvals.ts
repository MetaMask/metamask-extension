import { ApprovalControllerState } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';

type ApprovalsMetaMaskState = {
  metamask: {
    pendingApprovals: ApprovalControllerState['pendingApprovals'];
  };
};

export function hasPendingApprovalsSelector(
  state: ApprovalsMetaMaskState,
  approvalType: ApprovalType,
) {
  const pendingApprovalRequests = filterPendingApprovals(state, approvalType);

  return pendingApprovalRequests.length > 0;
}

export function getPendingApprovalsRequestDataSelector(
  state: ApprovalsMetaMaskState,
  approvalType: ApprovalType,
) {
  return filterPendingApprovals(state, approvalType).map(
    ({ requestData }) => requestData,
  );
}

function filterPendingApprovals(
  state: ApprovalsMetaMaskState,
  approvalType: ApprovalType,
) {
  return Object.values(state.metamask.pendingApprovals).filter(
    ({ type }) => type === approvalType,
  );
}
