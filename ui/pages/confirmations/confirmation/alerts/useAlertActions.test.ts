import { ApprovalRequest } from '@metamask/approval-controller';

import mockState from '../../../../../test/data/mock-state.json';
import { getMockPersonalSignConfirmState } from '../../../../../test/data/confirmations/helper';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import { AlertActionKey } from '../../../../components/app/confirm/info/row/constants';
import * as ConfirmationNavigation from '../../hooks/useConfirmationNavigation';
import { useAlertsActions } from './useAlertsActions';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const PENDING_APPROVAL_MOCK = {
  id: 'testApprovalId',
  origin: 'https://metamask.github.io',
  requestData: { testProperty: 'testValue' },

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as ApprovalRequest<any>;

describe('useAlertActions', () => {
  it('returns method processAction to process alert actions', () => {
    const { result } = renderHookWithProvider(
      () => useAlertsActions(() => undefined, PENDING_APPROVAL_MOCK),
      mockState,
    );
    expect(typeof result.current).toBe('function');
  });

  it('handles action "ShowPendingConfirmation"', () => {
    const mockNavigateToIndex = jest.fn();
    const mockHideAlertModal = jest.fn();
    jest
      .spyOn(ConfirmationNavigation, 'useConfirmationNavigation')
      .mockReturnValue({
        getIndex: jest.fn(),
        navigateToIndex: mockNavigateToIndex,

        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    const { result } = renderHookWithProvider(
      () => useAlertsActions(mockHideAlertModal, PENDING_APPROVAL_MOCK),
      getMockPersonalSignConfirmState(),
    );
    result.current(AlertActionKey.ShowPendingConfirmation);
    expect(mockNavigateToIndex).toHaveBeenCalledTimes(1);
    expect(mockHideAlertModal).toHaveBeenCalledTimes(1);
  });
});
