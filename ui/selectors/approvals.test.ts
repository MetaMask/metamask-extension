import { ApprovalType } from '@metamask/controller-utils';
import {
  type ApprovalsMetaMaskState,
  getApprovalFlows,
  getApprovalsByOrigin,
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

    it('should return same reference when state has not changed (memoization)', () => {
      const result1 = getPendingApprovals(mockedState);
      const result2 = getPendingApprovals(mockedState);

      expect(result1).toBe(result2);
    });

    it('should return new reference when pendingApprovals change', () => {
      const result1 = getPendingApprovals(mockedState);

      const modifiedState = {
        ...mockedState,
        metamask: {
          ...mockedState.metamask,
          pendingApprovals: {
            ...mockedState.metamask.pendingApprovals,
            '3': {
              id: '3',
              origin: 'origin',
              time: Date.now(),
              type: ApprovalType.EthSignTypedData,
              requestData: {},
              requestState: null,
              expectsResult: false,
            },
          },
        },
      };

      const result2 = getPendingApprovals(modifiedState);

      expect(result1).not.toBe(result2);
      expect(result2.length).toBe(3);
    });

    it('should handle empty pendingApprovals', () => {
      const emptyState = {
        metamask: {
          pendingApprovals: {},
          approvalFlows: [],
        },
      };

      const result = getPendingApprovals(emptyState);

      expect(result).toStrictEqual([]);
    });

    it('should handle null/undefined pendingApprovals', () => {
      const nullState = {
        metamask: {
          pendingApprovals: null,
          approvalFlows: [],
        },
      };

      const result = getPendingApprovals(
        nullState as unknown as ApprovalsMetaMaskState,
      );

      expect(result).toStrictEqual([]);
    });
  });

  describe('pendingApprovalsSortedSelector', () => {
    it('should return all pending approvals', () => {
      const result = getPendingApprovals(mockedState);

      expect(result).toStrictEqual(
        Object.values(mockedState.metamask.pendingApprovals),
      );
    });
  });

  describe('getApprovalsByOrigin', () => {
    it('should return approval from specified origin', () => {
      const result = getApprovalsByOrigin(
        {
          ...mockedState,
          metamask: {
            ...mockedState.metamask,
            pendingApprovals: {
              ...mockedState.metamask.pendingApprovals,
              '3': {
                id: '3',
                origin: 'test',
                time: Date.now(),
                type: ApprovalType.Transaction,
                requestData: {},
                requestState: null,
                expectsResult: false,
              },
            },
          },
        },
        'origin',
      );

      expect(result).toStrictEqual(
        Object.values(mockedState.metamask.pendingApprovals),
      );
    });
  });
});
