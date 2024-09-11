import { ApprovalType } from '@metamask/controller-utils';

import { ConfirmMetamaskState } from '../types/confirm';
import {
  getIsRedesignedConfirmationsDeveloperEnabled,
  latestPendingConfirmationSelector,
  pendingConfirmationsSelector,
} from './confirm';

describe('confirm selectors', () => {
  const mockedState: ConfirmMetamaskState = {
    metamask: {
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
        '3': {
          id: '3',
          origin: 'origin',
          time: Date.now() - 20,
          type: ApprovalType.PersonalSign,
          requestData: {},
          requestState: null,
          expectsResult: false,
        },
      },
      approvalFlows: [],
    },
  };

  describe('pendingConfirmationsSelector', () => {
    it('should return pending confirmations from state', () => {
      const result = pendingConfirmationsSelector(mockedState);

      expect(result).toStrictEqual([
        mockedState.metamask.pendingApprovals[2],
        mockedState.metamask.pendingApprovals[3],
      ]);
    });
  });

  describe('latestPendingConfirmationSelector', () => {
    it('should return latest pending confirmation from state', () => {
      const result = latestPendingConfirmationSelector(mockedState);

      expect(result).toStrictEqual(mockedState.metamask.pendingApprovals[2]);
    });
  });

  describe('#getIsRedesignedConfirmationsDeveloperEnabled', () => {
    it('returns true if redesigned confirmations developer setting is enabled', () => {
      const mockState = {
        metamask: {
          preferences: {
            isRedesignedConfirmationsDeveloperEnabled: true,
          },
        },
      };
      const result = getIsRedesignedConfirmationsDeveloperEnabled(mockState);
      expect(result).toBe(true);
    });

    it('returns false if redesigned confirmations developer setting is disabled', () => {
      const mockState = {
        metamask: {
          preferences: {
            isRedesignedConfirmationsDeveloperEnabled: false,
          },
        },
      };
      const result = getIsRedesignedConfirmationsDeveloperEnabled(mockState);
      expect(result).toBe(false);
    });
  });
});
