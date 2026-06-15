import { act } from '@testing-library/react';
import { NetworkStatus } from '@metamask/network-controller';

import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { NETWORKS_ROUTE } from '../../../../helpers/constants/routes';
import * as SendContext from '../../context/send';
import { setEditedNetwork } from '../../../../store/actions';
import { useUnreliableNetworkRpc } from './useUnreliableNetworkRpc';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/send/asset' }),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [{ get: () => null }],
}));

jest.mock('../../../../store/actions', () => {
  const actual = jest.requireActual('../../../../store/actions');
  return {
    ...actual,
    setEditedNetwork: jest.fn(() => ({ type: 'SET_EDITED_NETWORK_TEST' })),
  };
});

const mockSetEditedNetwork = jest.mocked(setEditedNetwork);

const mockSendContext = (chainId: string | undefined) => {
  jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
    chainId,
  } as unknown as SendContext.SendContextType);
};

const buildState = (overrides: { status?: NetworkStatus }) => ({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    networksMetadata: {
      ...mockState.metamask.networksMetadata,
      // matches networkClientId of chainId 0x5 (Goerli) in mock-state
      goerli: {
        EIPS: { 1559: true },
        status: overrides.status ?? NetworkStatus.Available,
      },
    },
  },
});

describe('useUnreliableNetworkRpc', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns isUnreliable=false when chainId is not a hex (non-EVM)', () => {
    mockSendContext('bip122:000000000019d6689c085ae165831e93');
    const { result } = renderHookWithProvider(
      useUnreliableNetworkRpc,
      buildState({ status: NetworkStatus.Unknown }),
    );

    expect(result.current.isUnreliable).toBe(false);
    expect(result.current.networkName).toBeUndefined();
  });

  it('returns isUnreliable=false when network is available', () => {
    mockSendContext('0x5');
    const { result } = renderHookWithProvider(
      useUnreliableNetworkRpc,
      buildState({ status: NetworkStatus.Available }),
    );

    expect(result.current.isUnreliable).toBe(false);
    expect(result.current.networkName).toBe('Goerli');
  });

  it('returns isUnreliable=true when network status is not Available', () => {
    mockSendContext('0x5');
    const { result } = renderHookWithProvider(
      useUnreliableNetworkRpc,
      buildState({ status: NetworkStatus.Unavailable }),
    );

    expect(result.current.isUnreliable).toBe(true);
    expect(result.current.networkName).toBe('Goerli');
  });

  it('returns isUnreliable=false when the chain has no network configuration', () => {
    mockSendContext('0xdeadbeef');
    const { result } = renderHookWithProvider(
      useUnreliableNetworkRpc,
      mockState,
    );

    expect(result.current.isUnreliable).toBe(false);
    expect(result.current.networkName).toBeUndefined();
  });

  it('navigateToEditNetwork dispatches setEditedNetwork and navigates', () => {
    mockSendContext('0x5');
    const { result } = renderHookWithProvider(
      useUnreliableNetworkRpc,
      buildState({ status: NetworkStatus.Unavailable }),
    );

    act(() => {
      result.current.navigateToEditNetwork();
    });

    expect(mockSetEditedNetwork).toHaveBeenCalledWith({
      chainId: '0x5',
      trackRpcUpdateFromBanner: true,
    });
    expect(mockNavigate).toHaveBeenCalledWith(NETWORKS_ROUTE);
  });

  it('navigateToEditNetwork is a no-op for non-hex chainId', () => {
    mockSendContext('bip122:000000000019d6689c085ae165831e93');
    const { result } = renderHookWithProvider(
      useUnreliableNetworkRpc,
      mockState,
    );

    act(() => {
      result.current.navigateToEditNetwork();
    });

    expect(mockSetEditedNetwork).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
