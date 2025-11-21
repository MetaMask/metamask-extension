import { ApprovalType } from '@metamask/controller-utils';
import { QuoteResponse } from '@metamask/bridge-controller';

import { ConfirmMetamaskState } from '../types/confirm';
import {
  oldestPendingConfirmationSelector,
  pendingConfirmationsSelector,
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
