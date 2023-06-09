import { ApprovalType } from '@metamask/controller-utils';
import { hasPendingApprovalFlows, hasPendingApprovals } from './approvals';

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
          expectsResult: false,
        },
        '2': {
          id: '2',
          origin: 'origin',
          time: Date.now(),
          type: ApprovalType.Transaction,
          requestData: {},
          requestState: null,
          expectsResult: false,
        },
      },
      approvalFlows: [
        {
          id: '1',
        },
      ],
    },
  };

  describe('hasPendingApprovals', () => {
    it('should return true if there is a pending approval request', () => {
      const result = hasPendingApprovals(mockedState, ApprovalType.WatchAsset);

      expect(result).toBe(true);
    });

    it('should return false if there is no pending approval request', () => {
      const result = hasPendingApprovals(
        mockedState,
        ApprovalType.SnapDialogPrompt,
      );

      expect(result).toBe(false);
    });
  });

  describe('hasPendingApprovalFlows', () => {
    it('should return true if there is at least one pending approval flow', () => {
      const result = hasPendingApprovalFlows(mockedState);

      expect(result).toBe(true);
    });

    it('should return false if there are no pending approval flows', () => {
      const result = hasPendingApprovalFlows({
        metamask: {
          ...mockedState.metamask,
          approvalFlows: [],
        },
      });

      expect(result).toBe(false);
    });
  });
});
