import {
  ApprovalControllerState,
  ApprovalRequest,
} from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { createSelector } from 'reselect';
import { Json } from '@metamask/utils';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';

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
  return Object.values(state.metamask.pendingApprovals ?? {});
}

export function pendingApprovalsSortedSelector(state: ApprovalsMetaMaskState) {
  return getPendingApprovals(state).sort((a1, a2) => a1.time - a2.time);
}

/**
 * Returns pending approvals sorted by time for use in confirmation navigation.
 * Excludes duplicate watch asset approvals as they are combined into a single confirmation.
 */
export const selectPendingApprovalsForNavigation = createDeepEqualSelector(
  pendingApprovalsSortedSelector,
  (sortedPendingApprovals) =>
    sortedPendingApprovals.filter((approval, index) => {
      if (
        isWatchNftApproval(approval) &&
        sortedPendingApprovals.findIndex(isWatchNftApproval) !== index
      ) {
        return false;
      }

      if (
        isWatchTokenApproval(approval) &&
        sortedPendingApprovals.findIndex(isWatchTokenApproval) !== index
      ) {
        return false;
      }

      return true;
    }),
);

const internalSelectPendingApproval = createSelector(
  getPendingApprovals,
  (_state: ApprovalsMetaMaskState, id: string) => id,
  (approvals, id) => approvals.find(({ id: approvalId }) => approvalId === id),
);

export const selectPendingApproval = createDeepEqualSelector(
  internalSelectPendingApproval,
  (approval) => approval,
);

export const getApprovalsByOrigin = (
  state: ApprovalsMetaMaskState,
  origin: string,
) => {
  const pendingApprovals = getPendingApprovals(state);

  return pendingApprovals?.filter(
    (confirmation: ApprovalRequest<Record<string, Json>>) =>
      confirmation.origin === origin,
  );
};

function isWatchTokenApproval(approval: ApprovalRequest<Record<string, Json>>) {
  const tokenId = (approval.requestData?.asset as Record<string, string>)
    ?.tokenId;

  return approval.type === ApprovalType.WatchAsset && !tokenId;
}

function isWatchNftApproval(approval: ApprovalRequest<Record<string, Json>>) {
  const tokenId = (approval.requestData?.asset as Record<string, string>)
    ?.tokenId;

  return approval.type === ApprovalType.WatchAsset && Boolean(tokenId);
}
