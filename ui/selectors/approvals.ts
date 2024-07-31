import { ApprovalControllerState } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { createSelector } from 'reselect';
import { createDeepEqualSelector } from './util';

export type ApprovalsMetaMaskState = {
  metamask: {
    pendingApprovals: ApprovalControllerState['pendingApprovals'];
    approvalFlows: ApprovalControllerState['approvalFlows'];
  };
};

export function hasPendingApprovals(
  state: ApprovalsMetaMaskState,
  approvalTypes: ApprovalType[],
  predicate?: (
    approval: ApprovalControllerState['pendingApprovals'][string],
  ) => boolean,
) {
  const pendingApprovalRequests = Object.values(
    state.metamask.pendingApprovals,
  ).filter(({ type }) => approvalTypes.includes(type as ApprovalType));

  if (predicate) {
    return pendingApprovalRequests.some(predicate);
  }

  return pendingApprovalRequests.length > 0;
}

export const getApprovalRequestsByType = (
  state: ApprovalsMetaMaskState,
  approvalType: ApprovalType,
  predicate?: (
    approval: ApprovalControllerState['pendingApprovals'][string],
  ) => boolean,
) => {
  const pendingApprovalRequests = Object.values(
    state.metamask.pendingApprovals,
  ).filter(({ type }) => type === approvalType);

  if (predicate) {
    return pendingApprovalRequests.filter(predicate);
  }

  return pendingApprovalRequests;
};

export function getApprovalFlows(state: ApprovalsMetaMaskState) {
  return state.metamask.approvalFlows;
}

export function getPendingApprovals(state: ApprovalsMetaMaskState) {
  return Object.values(state.metamask.pendingApprovals ?? []);
}

export function pendingApprovalsSortedSelector(state: ApprovalsMetaMaskState) {
  return getPendingApprovals(state).sort((a1, a2) => a1.time - a2.time);
}

const internalSelectPendingApproval = createSelector(
  getPendingApprovals,
  (_state: ApprovalsMetaMaskState, id: string) => id,
  (approvals, id) => approvals.find(({ id: approvalId }) => approvalId === id),
);

export const selectPendingApproval = createDeepEqualSelector(
  internalSelectPendingApproval,
  (approval) => approval,
);
