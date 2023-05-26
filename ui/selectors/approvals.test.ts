import { ApprovalType } from '@metamask/controller-utils';
import { hasPendingApprovalsSelector } from './approvals';

describe('approval selectors', () => {
  const mockedState = {
    metamask: {
      pendingApprovalCount: 2,
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
          type: ApprovalType.EthSignTypedData,
          requestData: {},
          requestState: null,
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
        ApprovalType.Transaction,
      );

      expect(result).toBe(false);
    });
  });
});
