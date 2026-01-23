import { ApprovalType } from '@metamask/controller-utils';
import { QuoteResponse } from '@metamask/bridge-controller';

import { ConfirmMetamaskState } from '../types/confirm';
import {
  oldestPendingConfirmationSelector,
  pendingConfirmationsSortedSelector,
  selectDappSwapComparisonData,
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
      enableEnforcedSimulations: false,
      enableEnforcedSimulationsForTransactions: {},
      enforcedSimulationsSlippage: 0,
      enforcedSimulationsSlippageForTransactions: {},
      dappSwapComparisonData: {
        '1': {
          quotes: [{ test: 'dummyQuote' } as unknown as QuoteResponse],
          latency: 100,
        },
      },
    },
  };

  describe('pendingConfirmationsSortedSelector', () => {
    it('should return pending confirmations sorted by time', () => {
      const result = pendingConfirmationsSortedSelector(mockedState);

      // Should be sorted by time (oldest first)
      expect(result).toStrictEqual([
        mockedState.metamask.pendingApprovals[3], // time: Date.now() - 20
        mockedState.metamask.pendingApprovals[2], // time: Date.now()
      ]);
    });

    it('should return same reference when state has not changed (memoization)', () => {
      const result1 = pendingConfirmationsSortedSelector(mockedState);
      const result2 = pendingConfirmationsSortedSelector(mockedState);

      // Should return the exact same reference, not a new array
      expect(result1).toBe(result2);
    });

    it('should return new reference when underlying state changes', () => {
      const result1 = pendingConfirmationsSortedSelector(mockedState);

      const modifiedState: ConfirmMetamaskState = {
        ...mockedState,
        metamask: {
          ...mockedState.metamask,
          pendingApprovals: {
            ...mockedState.metamask.pendingApprovals,
            '4': {
              id: '4',
              origin: 'origin',
              time: Date.now() - 10,
              type: ApprovalType.Transaction,
              requestData: {},
              requestState: null,
              expectsResult: false,
            },
          },
        },
      };

      const result2 = pendingConfirmationsSortedSelector(modifiedState);

      // Should return a different reference when state changes
      expect(result1).not.toBe(result2);
      // Should include the new approval
      expect(result2).toHaveLength(3);
    });

    it('should filter out non-confirmation approval types', () => {
      const result = pendingConfirmationsSortedSelector(mockedState);

      // Should not include WatchAsset (id: '1')
      expect(result).toHaveLength(2);
      expect(result.find((approval) => approval.id === '1')).toBeUndefined();
    });
  });

  describe('oldestPendingConfirmationSelector', () => {
    it('should return oldest pending confirmation from state', () => {
      const result = oldestPendingConfirmationSelector(mockedState);

      expect(result).toStrictEqual(mockedState.metamask.pendingApprovals[3]);
    });
  });

  describe('selectDappSwapComparisonData', () => {
    it('should return dapp swap comparison data for the given unique id from state', () => {
      const result = selectDappSwapComparisonData(mockedState, '1');

      expect(result).toStrictEqual({
        quotes: [{ test: 'dummyQuote' } as unknown as QuoteResponse],
        latency: 100,
      });
    });
  });
});
