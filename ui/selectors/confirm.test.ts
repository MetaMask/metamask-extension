import { ApprovalType } from '@metamask/controller-utils';
import { TransactionType } from '@metamask/transaction-controller';
import {
  ConfirmMetamaskState,
  currentConfirmationSelector,
  latestPendingConfirmationSelector,
  pendingConfirmationsSelector,
} from './confirm';

describe('confirm selectors', () => {
  const mockedState: ConfirmMetamaskState = {
    confirm: {
      currentConfirmation: {
        id: '1',
        type: TransactionType.contractInteraction,
      },
    },
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
          type: ApprovalType.EthSign,
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

  describe('currentConfirmationSelector', () => {
    it('should return curently active confirmation from state', () => {
      const result = currentConfirmationSelector(mockedState);

      expect(result).toStrictEqual(mockedState.confirm.currentConfirmation);
    });
  });
});
