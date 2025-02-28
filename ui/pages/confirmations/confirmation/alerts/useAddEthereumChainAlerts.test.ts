import { ApprovalRequest } from '@metamask/approval-controller';

import mockState from '../../../../../test/data/mock-state.json';
import { getMockPersonalSignConfirmState } from '../../../../../test/data/confirmations/helper';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import * as AlertActions from '../../../../ducks/confirm-alerts/confirm-alerts';

import { useAddEthereumChainAlerts } from './useAddEthereumChainAlerts';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const PENDING_APPROVAL_MOCK = {
  id: 'testApprovalId',
  requestData: { testProperty: 'testValue' },
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as ApprovalRequest<any>;

const ADD_ETH_CHAIN_ALERT = [
  {
    actions: [
      { key: 'showPendingConfirmation', label: 'Review pending transactions' },
    ],
    key: 'pendingConfirmationFromSameOrigin',
    message:
      'Updating network will cancel 1 pending transactions from this site.',
    reason: 'Are you sure?',
    severity: 'warning',
  },
] as AlertActions.Alert[];

describe('useAddEthereumChainAlerts', () => {
  it('returns alert if there are pending confirmations', () => {
    const { result } = renderHookWithProvider(
      () => useAddEthereumChainAlerts(PENDING_APPROVAL_MOCK),
      getMockPersonalSignConfirmState(),
    );
    expect(result.current).toStrictEqual(ADD_ETH_CHAIN_ALERT);
  });

  it('does not returns alert if there are no pending confirmations', () => {
    const { result } = renderHookWithProvider(
      () => useAddEthereumChainAlerts(PENDING_APPROVAL_MOCK),
      mockState,
    );
    expect(result.current).toStrictEqual([]);
  });
});
