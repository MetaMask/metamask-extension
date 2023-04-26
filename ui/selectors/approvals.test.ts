import { ApprovalType } from '@metamask/controller-utils';
import { transactionMatchesNetwork } from '../../shared/modules/transaction.utils';
import {
  hasPendingApprovalsSelector,
  hasTransactionPendingApprovalsSelector,
} from './approvals';
import { getCurrentChainId } from './selectors';

jest.mock('./selectors', () => ({
  getCurrentChainId: jest.fn(),
}));

jest.mock('../../shared/modules/transaction.utils', () => ({
  transactionMatchesNetwork: jest.fn(),
}));

describe('approval selectors', () => {
  const mockNetworkId = 'mockNetworkId';
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

  describe('hasTransactionPendingApprovalsSelector', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });
    it('should return true if there is a pending transaction on same network', () => {
      getCurrentChainId.mockReturnValue(mockNetworkId);
      transactionMatchesNetwork.mockReturnValue(true);
      const result = hasTransactionPendingApprovalsSelector(mockedState);

      expect(transactionMatchesNetwork).toHaveBeenCalledTimes(1);
      expect(transactionMatchesNetwork).toHaveBeenCalledWith(
        mockedState.metamask.unapprovedTxs['2'],
        mockNetworkId,
      );
      expect(result).toBe(true);
    });
    it('should return false if there is a pending transaction on different network', () => {
      getCurrentChainId.mockReturnValue(mockNetworkId);
      transactionMatchesNetwork.mockReturnValue(false);
      const result = hasTransactionPendingApprovalsSelector(mockedState);

      expect(transactionMatchesNetwork).toHaveBeenCalledTimes(1);
      expect(transactionMatchesNetwork).toHaveBeenCalledWith(
        mockedState.metamask.unapprovedTxs['2'],
        mockNetworkId,
      );
      expect(result).toBe(false);
    });
    it.each([
      // [ApprovalType.EthDecrypt],
      [ApprovalType.EthGetEncryptionPublicKey],
      [ApprovalType.EthSign],
      [ApprovalType.EthSignTypedData],
      [ApprovalType.PersonalSign],
    ])(
      'should return true if there is a pending transaction of %s type ',
      (type) => {
        transactionMatchesNetwork.mockReturnValue(false);
        const result = hasTransactionPendingApprovalsSelector({
          ...mockedState,
          metamask: {
            ...mockedState.metamask,
            pendingApprovals: {
              '2': {
                id: '2',
                origin: 'origin',
                time: Date.now(),
                type,
                requestData: {},
                requestState: null,
              },
            },
          },
        });

        expect(result).toBe(true);
      },
    );
  });
});
