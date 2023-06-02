import { ApprovalControllerState } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { TransactionMeta } from '../../shared/constants/transaction';

type ApprovalsMetaMaskState = {
  metamask: {
    pendingApprovals: ApprovalControllerState['pendingApprovals'];
    unapprovedTxs: {
      [transactionId: string]: TransactionMeta;
    };
    approvalFlows: ApprovalControllerState['approvalFlows'];
    approvalFlowLoadingText: ApprovalControllerState['approvalFlowLoadingText'];
  };
};

export const getApprovalFlows = (state: ApprovalsMetaMaskState) => {
  return state.metamask.approvalFlows || [];
};

export const hasApprovalFlow = (state: ApprovalsMetaMaskState) => {
  return getApprovalFlows(state).length > 0;
};

export function getApprovalFlowLoadingText(state: ApprovalsMetaMaskState) {
  return state.metamask.approvalFlowLoadingText;
}

export const getApprovalRequestsByType = (
  state: ApprovalsMetaMaskState,
  approvalType: ApprovalType,
) => {
  const pendingApprovalRequests = Object.values(
    state.metamask.pendingApprovals,
  ).filter(({ type }) => type === approvalType);

  return pendingApprovalRequests;
};

export function hasPendingApprovals(
  state: ApprovalsMetaMaskState,
  approvalType: ApprovalType,
) {
  const pendingApprovalRequests = getApprovalRequestsByType(
    state,
    approvalType,
  );

  return pendingApprovalRequests.length > 0;
}
