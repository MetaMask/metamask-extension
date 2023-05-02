import { ApprovalType } from '@metamask/controller-utils';
import { hasPendingApprovalsSelector } from './approvals';

describe('approval selectors', () => {
  const mockedState = {
    metamask: {
      pendingApprovalCount: 3,
      pendingApprovals: {
        '1': {
          id: '1',
          origin: 'origin',
          time: Date.now(),
          type: ApprovalType.WatchAsset,
          requestData: {},
          requestState: null,
        },
        '2': {
          id: '2',
          origin: 'origin',
          time: Date.now(),
          type: ApprovalType.Transaction,
          requestData: {},
          requestState: null,
        },
      },
      unapprovedTxs: {
        '2': {
          id: '2',
        },
      },
    },
  };

  describe('hasPendingApprovalsSelector', () => {
    it('should return true if there is a pending approval request', () => {
      const result = hasPendingApprovalsSelector(
        mockedState,
        ApprovalType.WatchAsset,
      );

      expect(result).toBe(true);
    });

    it('should return false if there is no pending approval request', () => {
      const result = hasPendingApprovalsSelector(
        mockedState,
        ApprovalType.SnapDialogPrompt,
      );

      expect(result).toBe(false);
    });
  });
});
