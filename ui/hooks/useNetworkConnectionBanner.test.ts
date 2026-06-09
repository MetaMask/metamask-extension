import { act } from '@testing-library/react';
import { RpcEndpointType } from '@metamask/network-controller';
import { renderHookWithProviderTyped } from '../../test/lib/render-helpers-navigate';
import { getNetworkConnectionBanner } from '../selectors/selectors';
import { updateNetwork } from '../store/actions';
import { setShowInfuraSwitchToast } from '../components/app/toast-master/utils';
import mockState from '../../test/data/mock-state.json';
import { MetaMetricsEventName } from '../../shared/constants/metametrics';
import { getNetworkConfigurationsByChainId } from '../../shared/lib/selectors/networks';
import { useNetworkConnectionBanner } from './useNetworkConnectionBanner';

jest.mock('../selectors/selectors', () => ({
  ...jest.requireActual('../selectors/selectors'),
  getNetworkConnectionBanner: jest.fn(),
}));

jest.mock('../store/actions', () => ({
  ...jest.requireActual('../store/actions'),
  updateNetwork: jest.fn(
    () => () => Promise.resolve({ type: 'UPDATE_NETWORK' }),
  ),
}));

jest.mock('../components/app/toast-master/utils', () => ({
  ...jest.requireActual('../components/app/toast-master/utils'),
  setShowInfuraSwitchToast: jest.fn((value) => ({
    type: 'SET_SHOW_INFURA_SWITCH_TOAST',
    payload: value,
  })),
}));

jest.mock('../../shared/lib/selectors/networks', () => ({
  ...jest.requireActual('../../shared/lib/selectors/networks'),
  getNetworkConfigurationsByChainId: jest.fn(),
}));

jest.mock('../store/background-connection', () => ({
  ...jest.requireActual('../store/background-connection'),
  submitRequestToBackground: jest.fn().mockResolvedValue(true),
}));

const mockGetNetworkConnectionBanner = jest.mocked(getNetworkConnectionBanner);
const mockGetNetworkConfigurationsByChainId = jest.mocked(
  getNetworkConfigurationsByChainId,
);
const mockUpdateNetwork = jest.mocked(updateNetwork);
const mockSetShowInfuraSwitchToast = jest.mocked(setShowInfuraSwitchToast);

describe('useNetworkConnectionBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNetworkConfigurationsByChainId.mockReturnValue({
      '0x1': {
        chainId: '0x1',
        name: 'Ethereum Mainnet',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'custom-client',
            url: 'https://eth-mainnet.alchemyapi.io/v2/abc',
            type: RpcEndpointType.Custom,
          },
          {
            networkClientId: 'mainnet',
            url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
            type: RpcEndpointType.Infura,
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://etherscan.io'],
        defaultBlockExplorerUrlIndex: 0,
      },
    });
  });

  it('returns the banner state from the selector', () => {
    mockGetNetworkConnectionBanner.mockReturnValue({ status: 'available' });

    const { result } = renderHookWithProviderTyped(
      () => useNetworkConnectionBanner(),
      mockState,
    );

    expect(result.current.status).toBe('available');
  });

  it('fires the banner-shown analytics event when transitioning to a visible status', async () => {
    const mockTrackEvent = jest.fn();
    mockGetNetworkConnectionBanner.mockReturnValue({
      status: 'degraded',
      networkName: 'Ethereum Mainnet',
      networkClientId: 'mainnet',
      chainId: '0x1',
      isInfuraEndpoint: true,
    });

    await act(async () => {
      renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        mockState,
        undefined,
        undefined,
        () => mockTrackEvent,
      );
      // Flush microtasks for the analytics dispatch.
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: MetaMetricsEventName.NetworkConnectionBannerShown,
        properties: expect.objectContaining({
          /* eslint-disable @typescript-eslint/naming-convention */
          banner_type: 'degraded',
          chain_id_caip: 'eip155:1',
          /* eslint-enable @typescript-eslint/naming-convention */
        }),
      }),
    );
  });

  it('does not fire analytics when the banner status stays available', () => {
    const mockTrackEvent = jest.fn();
    mockGetNetworkConnectionBanner.mockReturnValue({ status: 'available' });

    renderHookWithProviderTyped(
      () => useNetworkConnectionBanner(),
      mockState,
      undefined,
      undefined,
      () => mockTrackEvent,
    );

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  describe('switchToInfura', () => {
    it('is a no-op when the banner is not visible', async () => {
      mockGetNetworkConnectionBanner.mockReturnValue({ status: 'available' });

      const { result } = renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        mockState,
      );

      await act(async () => {
        await result.current.switchToInfura();
      });

      expect(mockUpdateNetwork).not.toHaveBeenCalled();
    });

    it('is a no-op when no Infura endpoint index is available', async () => {
      mockGetNetworkConnectionBanner.mockReturnValue({
        status: 'degraded',
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
        isInfuraEndpoint: false,
      });

      const { result } = renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        mockState,
      );

      await act(async () => {
        await result.current.switchToInfura();
      });

      expect(mockUpdateNetwork).not.toHaveBeenCalled();
    });

    it('updates the network with the Infura endpoint as default and shows the success toast', async () => {
      mockGetNetworkConnectionBanner.mockReturnValue({
        status: 'unavailable',
        networkName: 'Ethereum Mainnet',
        networkClientId: 'custom-client',
        chainId: '0x1',
        isInfuraEndpoint: false,
        infuraEndpointIndex: 1,
      });

      const { result } = renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        mockState,
      );

      await act(async () => {
        await result.current.switchToInfura();
      });

      expect(mockUpdateNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: '0x1',
          defaultRpcEndpointIndex: 1,
        }),
        { replacementSelectedRpcEndpointIndex: 1 },
      );
      expect(mockSetShowInfuraSwitchToast).toHaveBeenCalledWith(true);
    });
  });
});
