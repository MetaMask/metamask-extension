import { ApprovalRequest } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';

import mockState from '../../../../../test/data/mock-state.json';
import { getMockPersonalSignConfirmState } from '../../../../../test/data/confirmations/helper';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import * as AlertActions from '../../../../ducks/confirm-alerts/confirm-alerts';

import { useUpdateEthereumChainAlerts } from './useUpdateEthereumChainAlerts';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const PENDING_APPROVAL_MOCK = {
  id: 'testApprovalId',
  requestData: { testProperty: 'testValue' },
  type: ApprovalType.AddEthereumChain,
  origin: 'https://metamask.github.io',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as ApprovalRequest<any>;

const PERMISSION_MOCK = {
  id: 'testApprovalId',
  requestData: {
    testProperty: 'testValue',
    metadata: { isSwitchEthereumChain: true },
  },
  type: ApprovalType.WalletRequestPermissions,
  origin: 'https://metamask.github.io',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as unknown as ApprovalRequest<any>;

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

const SWITCH_ETH_CHAIN_ALERT = [
  {
    ...ADD_ETH_CHAIN_ALERT[0],
    message:
      'Switching network will cancel 1 pending transactions from this site.',
  },
] as AlertActions.Alert[];

describe('useUpdateEthereumChainAlerts', () => {
  const state = getMockPersonalSignConfirmState();
  it('returns alert for approval type addEthereumChain if there are pending confirmations', () => {
    const { result } = renderHookWithProvider(
      () => useUpdateEthereumChainAlerts(PENDING_APPROVAL_MOCK),
      {
        ...state,
        metamask: {
          ...state.metamask,
          pendingApprovals: {
            ...state.metamask.pendingApprovals,
            [PENDING_APPROVAL_MOCK.id]: PENDING_APPROVAL_MOCK,
          },
        },
      },
    );
    expect(result.current).toStrictEqual(ADD_ETH_CHAIN_ALERT);
  });

  it('returns alert for approval type switchEthereumChain if there are pending confirmations', () => {
    const { result } = renderHookWithProvider(
      () =>
        useUpdateEthereumChainAlerts({
          ...PENDING_APPROVAL_MOCK,
          type: ApprovalType.SwitchEthereumChain,
        }),
      {
        ...state,
        metamask: {
          ...state.metamask,
          pendingApprovals: {
            ...state.metamask.pendingApprovals,
            [PENDING_APPROVAL_MOCK.id]: PENDING_APPROVAL_MOCK,
          },
        },
      },
    );
    expect(result.current).toStrictEqual(SWITCH_ETH_CHAIN_ALERT);
  });

  it('returns alert for permission request  with isLegacySwitchEthereumChain if there are pending confirmations', () => {
    const { result } = renderHookWithProvider(
      () =>
        useUpdateEthereumChainAlerts({
          ...PERMISSION_MOCK,
          type: ApprovalType.SwitchEthereumChain,
        }),
      {
        ...state,
        metamask: {
          ...state.metamask,
          pendingApprovals: {
            ...state.metamask.pendingApprovals,
            [PERMISSION_MOCK.id]: PERMISSION_MOCK,
          },
        },
      },
    );
    expect(result.current).toStrictEqual(SWITCH_ETH_CHAIN_ALERT);
  });

  it('does not returns alert if there are no pending confirmations', () => {
    const { result } = renderHookWithProvider(
      () => useUpdateEthereumChainAlerts(PENDING_APPROVAL_MOCK),
      mockState,
    );
    expect(result.current).toStrictEqual([]);
  });

  it('does not returns alert for un-supported pending confirmation type', () => {
    const { result } = renderHookWithProvider(
      () =>
        useUpdateEthereumChainAlerts({
          ...PENDING_APPROVAL_MOCK,
          type: ApprovalType.PersonalSign,
        }),
      mockState,
    );
    expect(result.current).toStrictEqual([]);
  });
});
