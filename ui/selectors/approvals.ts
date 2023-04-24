import { ApprovalRequest } from '@metamask/approval-controller';
import { ApprovalType, Json } from '@metamask/controller-utils';

type ApprovalsMetaMaskState = {
  metamask: {
    pendingApprovals: Record<
      string,
      ApprovalRequest<Record<string, Json> | null>
    >;
  };
};

export function hasPendingApprovalsSelector(
  state: ApprovalsMetaMaskState,
  approvalType: ApprovalType,
) {
  const pendingApprovalRequests = Object.values(
    state.metamask.pendingApprovals,
  ).filter(({ type }) => type === approvalType);

  return pendingApprovalRequests.length > 0;
}
