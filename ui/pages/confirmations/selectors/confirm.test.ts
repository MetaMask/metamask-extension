import { ApprovalType } from '@metamask/controller-utils';

import { ConfirmMetamaskState } from '../types/confirm';
import {
  oldestPendingConfirmationSelector,
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

  describe('oldestPendingConfirmationSelector', () => {
    it('should return oldest pending confirmation from state', () => {
      const result = oldestPendingConfirmationSelector(mockedState);

      expect(result).toStrictEqual(mockedState.metamask.pendingApprovals[3]);
    });
  });
});
