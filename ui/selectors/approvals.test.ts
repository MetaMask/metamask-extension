import { ApprovalType } from '@metamask/controller-utils';
import {
  getApprovalFlows,
  getPendingApprovals,
  hasPendingApprovals,
} from './approvals';

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
          loadingText: 'loadingText1',
        },
        {
          id: '2',
          loadingText: 'loadingText2',
        },
      ],
    },
  };

  describe('hasPendingApprovals', () => {
    it('should return true if there is a pending approval request', () => {
      const result = hasPendingApprovals(mockedState, [
        ApprovalType.WatchAsset,
      ]);

      expect(result).toBe(true);
    });

    it('should return false if there is no pending approval request', () => {
      const result = hasPendingApprovals(mockedState, [
        ApprovalType.SnapDialogPrompt,
      ]);

      expect(result).toBe(false);
    });
  });

  describe('getApprovalFlows', () => {
    it('should return existing approval flows', () => {
      const result = getApprovalFlows(mockedState);

      expect(result).toStrictEqual(mockedState.metamask.approvalFlows);
    });
  });

  describe('getPendingApprovals', () => {
    it('should return all pending approvals', () => {
      const result = getPendingApprovals(mockedState);

      expect(result).toStrictEqual(
        Object.values(mockedState.metamask.pendingApprovals),
      );
    });
  });
});
