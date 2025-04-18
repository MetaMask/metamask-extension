import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/utils';

export const ReorderType = {
  SnapInstallFlow: 'SnapInstallFlow',
} as const;

export type ReorderOptions = {
  currentSnapInApprovalFlow: string;
};

// Type for wallet_snap structure for TypeScript
type PermissionsObject = {
  wallet_snap?: {
    caveats?: {
      value?: Record<string, unknown>;
    }[];
  };
};

type ReorderCallbacks = {
  [key in keyof typeof ReorderType]: (
    oldApprovals: ApprovalRequest<Record<string, Json>>[],
    newApprovals: ApprovalRequest<Record<string, Json>>[],
    options: ReorderOptions,
  ) => ApprovalRequest<Record<string, Json>>[];
};

const ReorderCallbacks: ReorderCallbacks = {
  [ReorderType.SnapInstallFlow]: (
    oldApprovals,
    newApprovals,
    { currentSnapInApprovalFlow },
  ) => {
    const oldSnapApproval = oldApprovals.find((approval) => {
      const permissions = approval.requestData.permissions as PermissionsObject;
      return (
        permissions?.wallet_snap?.caveats?.[0]?.value?.[
          currentSnapInApprovalFlow
        ] ||
        (approval.type === 'wallet_installSnap' &&
          (approval.requestData.metadata as Record<string, unknown>)?.origin ===
            currentSnapInApprovalFlow) ||
        (approval.type === 'wallet_updateSnap' &&
          (approval.requestData.metadata as Record<string, unknown>)?.origin ===
            currentSnapInApprovalFlow) ||
        (approval.type === 'wallet_installSnapResult' &&
          (approval.requestData.metadata as Record<string, unknown>)?.origin ===
            currentSnapInApprovalFlow)
      );
    });
    if (!oldSnapApproval) {
      return oldApprovals;
    }

    const newSnapApproval = newApprovals.find(
      (approval) =>
        (approval.requestData.metadata as Record<string, unknown>)?.origin ===
        currentSnapInApprovalFlow,
    );
    if (!newSnapApproval) {
      return oldApprovals;
    }

    const filteredApprovals = newApprovals.filter(
      (approval) => approval.id !== newSnapApproval.id,
    );
    const updatedApprovals = [newSnapApproval, ...filteredApprovals];
    return updatedApprovals;
  },
};

type argType = [
  oldApprovals: ApprovalRequest<Record<string, Json>>[],
  newApprovals: ApprovalRequest<Record<string, Json>>[],
  options: ReorderOptions,
];

export function reorderApprovals(
  reorderType: keyof typeof ReorderType,
  ...args: argType
) {
  const reorderCallback = ReorderCallbacks[reorderType];
  if (!reorderCallback) {
    return args[0];
  }

  return reorderCallback(...args);
}
