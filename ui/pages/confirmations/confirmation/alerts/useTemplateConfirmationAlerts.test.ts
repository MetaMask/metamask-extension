import { ApprovalRequest } from '@metamask/approval-controller';
import { useDispatch } from 'react-redux';

import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import * as AlertActions from '../../../../ducks/confirm-alerts/confirm-alerts';
import * as UpdateEthereumChainAlerts from './useUpdateEthereumChainAlerts';

import { useTemplateConfirmationAlerts } from './useTemplateConfirmationAlerts';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const PENDING_APPROVAL_MOCK = {
  id: 'testApprovalId',
  requestData: { testProperty: 'testValue' },
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as ApprovalRequest<any>;

const MOCK_ADD_ETH_CHAIN_ALERT = [
  {
    key: 'pendingConfirmationFromSameOrigin',
    message: 'dummy_message',
    reason: 'dummy_reason',
    severity: 'warning',
  },
] as AlertActions.Alert[];

describe('updateConfirmationAlerts', () => {
  it('calls updateAlerts to update alerts in state', () => {
    const mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    jest
      .spyOn(UpdateEthereumChainAlerts, 'useUpdateEthereumChainAlerts')
      .mockReturnValue(MOCK_ADD_ETH_CHAIN_ALERT);
    const mockUpdateAlerts = jest.spyOn(AlertActions, 'updateAlerts');

    renderHookWithProvider(
      () => useTemplateConfirmationAlerts(PENDING_APPROVAL_MOCK),
      mockState,
    );

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockUpdateAlerts).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      alerts: MOCK_ADD_ETH_CHAIN_ALERT,
      ownerId: PENDING_APPROVAL_MOCK.id,
      type: 'UPDATE_ALERTS',
    });
    expect(mockUpdateAlerts).toHaveBeenCalledWith(
      PENDING_APPROVAL_MOCK.id,
      MOCK_ADD_ETH_CHAIN_ALERT,
    );
  });
});
