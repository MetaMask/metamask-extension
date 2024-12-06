import { useHistory } from 'react-router-dom';
import { ApprovalType } from '@metamask/controller-utils';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import {
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  SIGNATURE_REQUEST_PATH,
} from '../../../helpers/constants/routes';
import { useConfirmationNavigation } from './useConfirmationNavigation';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(),
}));

jest.mock('../confirmation/templates', () => ({
  TEMPLATED_CONFIRMATION_APPROVAL_TYPES: ['wallet_addEthereumChain'],
}));

const APPROVAL_ID_MOCK = '123-456';
const APPROVAL_ID_2_MOCK = '456-789';

function renderHook(approvalType: ApprovalType) {
  const { result } = renderHookWithProvider(() => useConfirmationNavigation(), {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      pendingApprovals: {
        [APPROVAL_ID_MOCK]: { id: APPROVAL_ID_MOCK, type: approvalType },
        [APPROVAL_ID_2_MOCK]: { id: APPROVAL_ID_2_MOCK, type: approvalType },
      },
    },
  });

  return result.current;
}

describe('useConfirmationNavigation', () => {
  const useHistoryMock = jest.mocked(useHistory);
  const history = { replace: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    useHistoryMock.mockReturnValue(history);
  });

  describe('navigateToId', () => {
    it('navigates to transaction route if confirmation is transaction', () => {
      const result = renderHook(ApprovalType.Transaction);

      result.navigateToId(APPROVAL_ID_MOCK);

      expect(history.replace).toHaveBeenCalledTimes(1);
      expect(history.replace).toHaveBeenCalledWith(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_MOCK}`,
      );
    });

    it('navigates to signature route if confirmation is signature', () => {
      const result = renderHook(ApprovalType.EthSignTypedData);

      result.navigateToId(APPROVAL_ID_MOCK);

      expect(history.replace).toHaveBeenCalledTimes(1);
      expect(history.replace).toHaveBeenCalledWith(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_MOCK}${SIGNATURE_REQUEST_PATH}`,
      );
    });

    it('navigates to template route if confirmation is template', () => {
      const result = renderHook(ApprovalType.AddEthereumChain);

      result.navigateToId(APPROVAL_ID_MOCK);

      expect(history.replace).toHaveBeenCalledTimes(1);
      expect(history.replace).toHaveBeenCalledWith(
        `${CONFIRMATION_V_NEXT_ROUTE}/${APPROVAL_ID_MOCK}`,
      );
    });

    it('does not navigate if no matching confirmation found', () => {
      const result = renderHook(ApprovalType.AddEthereumChain);

      result.navigateToId('invalidId');

      expect(history.replace).toHaveBeenCalledTimes(0);
    });

    it('does not navigate if no confirmation ID provided', () => {
      const result = renderHook(ApprovalType.AddEthereumChain);

      result.navigateToId();

      expect(history.replace).toHaveBeenCalledTimes(0);
    });
  });

  describe('navigateToIndex', () => {
    it('navigates to the confirmation at the given index', () => {
      const result = renderHook(ApprovalType.Transaction);

      result.navigateToIndex(1);

      expect(history.replace).toHaveBeenCalledTimes(1);
      expect(history.replace).toHaveBeenCalledWith(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_2_MOCK}`,
      );
    });
  });

  describe('count', () => {
    it('returns the number of confirmations', () => {
      const result = renderHook(ApprovalType.Transaction);
      expect(result.count).toBe(2);
    });
  });

  describe('getIndex', () => {
    it('returns the index of the given confirmation', () => {
      const result = renderHook(ApprovalType.Transaction);
      expect(result.getIndex(APPROVAL_ID_2_MOCK)).toBe(1);
    });

    it('returns 0 if no confirmation ID is provided', () => {
      const result = renderHook(ApprovalType.Transaction);
      expect(result.getIndex()).toBe(0);
    });
  });

  describe('confirmations', () => {
    it('returns the list of confirmations', () => {
      const result = renderHook(ApprovalType.Transaction);
      expect(result.confirmations.map(({ id }: { id: string }) => id)).toEqual([
        APPROVAL_ID_MOCK,
        APPROVAL_ID_2_MOCK,
      ]);
    });
  });
});
