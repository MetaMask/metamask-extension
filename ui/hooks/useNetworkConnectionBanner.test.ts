import { act } from '@testing-library/react';
import { RpcEndpointType } from '@metamask/network-controller';
import { renderHookWithProviderTyped } from '../../test/lib/render-helpers-navigate';
import { selectFirstUnavailableEvmNetwork } from '../selectors/multichain/networks';
import {
  getNetworkConnectionBanner,
  getIsDeviceOffline,
} from '../selectors/selectors';
import { updateNetworkConnectionBanner, updateNetwork } from '../store/actions';
import { setShowInfuraSwitchToast } from '../components/app/toast-master/utils';
import mockState from '../../test/data/mock-state.json';
import { MetaMetricsEventName } from '../../shared/constants/metametrics';
import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
import { useNetworkConnectionBanner } from './useNetworkConnectionBanner';

jest.mock('../../shared/constants/network', () => {
  return {
    ...jest.requireActual('../../shared/constants/network'),
    infuraProjectId: 'mock-infura-project-id',
  };
});

jest.mock('../selectors/multichain/networks', () => {
  return {
    ...jest.requireActual('../selectors/multichain/networks'),
    selectFirstUnavailableEvmNetwork: jest.fn(),
  };
});

jest.mock('../selectors/selectors', () => {
  return {
    ...jest.requireActual('../selectors/selectors'),
    getNetworkConnectionBanner: jest.fn(),
    getIsDeviceOffline: jest.fn(),
  };
});

jest.mock('../store/actions', () => {
  return {
    ...jest.requireActual('../store/actions'),
    updateNetworkConnectionBanner: jest.fn(() => ({
      type: 'UPDATE_NETWORK_CONNECTION_BANNER',
    })),
    // Return a thunk-like function that returns a promise
    updateNetwork: jest.fn(
      () => () => Promise.resolve({ type: 'UPDATE_NETWORK' }),
    ),
  };
});

jest.mock('../components/app/toast-master/utils', () => {
  return {
    ...jest.requireActual('../components/app/toast-master/utils'),
    setShowInfuraSwitchToast: jest.fn((value) => ({
      type: 'SET_SHOW_INFURA_SWITCH_TOAST',
      payload: value,
    })),
  };
});

jest.mock('../../shared/modules/selectors/networks', () => {
  return {
    ...jest.requireActual('../../shared/modules/selectors/networks'),
    getNetworkConfigurationsByChainId: jest.fn(),
  };
});

const mockSelectFirstUnavailableEvmNetwork = jest.mocked(
  selectFirstUnavailableEvmNetwork,
);
const mockGetNetworkConnectionBanner = jest.mocked(getNetworkConnectionBanner);
const mockGetIsDeviceOffline = jest.mocked(getIsDeviceOffline);
const mockUpdateNetworkConnectionBanner = jest.mocked(
  updateNetworkConnectionBanner,
);
const mockGetNetworkConfigurationsByChainId = jest.mocked(
  getNetworkConfigurationsByChainId,
);
const mockUpdateNetwork = jest.mocked(updateNetwork);
const mockSetShowInfuraSwitchToast = jest.mocked(setShowInfuraSwitchToast);

describe('useNetworkConnectionBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Default to online
    mockGetIsDeviceOffline.mockReturnValue(false);

    mockGetNetworkConfigurationsByChainId.mockReturnValue({
      '0x1': {
        name: 'Ethereum Mainnet',
        chainId: '0x1',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'mainnet',
            url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
            type: RpcEndpointType.Infura,
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://etherscan.io'],
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('when all networks are available', () => {
    it("updates the status of the banner to 'available' if not already updated", () => {
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue(null);
      mockGetNetworkConnectionBanner.mockReturnValue({ status: 'unknown' });

      renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        mockState,
      );

      expect(mockUpdateNetworkConnectionBanner).toHaveBeenCalledWith({
        status: 'available',
      });
    });

    it("does not update the status of the banner to 'available' if already updated", () => {
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue(null);
      mockGetNetworkConnectionBanner.mockReturnValue({
        status: 'available',
      });

      renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        mockState,
      );

      expect(mockUpdateNetworkConnectionBanner).not.toHaveBeenCalled();
    });

    it('does not create a MetaMetrics event', () => {
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue(null);
      mockGetNetworkConnectionBanner.mockReturnValue({ status: 'unknown' });
      const mockTrackEvent = jest.fn();

      renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        mockState,
        undefined,
        undefined,
        () => mockTrackEvent,
      );

      expect(mockTrackEvent).not.toHaveBeenCalled();
    });
  });

  describe('when at least one network is not available yet', () => {
    describe('if the status of the banner is "unknown"', () => {
      describe('if at least one network is still not available after 5 seconds', () => {
        it('updates the status of the banner to "degraded"', () => {
          mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
            networkName: 'Ethereum Mainnet',
            networkClientId: 'mainnet',
            chainId: '0x1',
            isInfuraEndpoint: true,
            infuraEndpointIndex: undefined,
          });
          mockGetNetworkConnectionBanner.mockReturnValue({ status: 'unknown' });

          renderHookWithProviderTyped(
            () => useNetworkConnectionBanner(),
            mockState,
          );
          act(() => {
            jest.advanceTimersByTime(5000);
          });

          expect(mockUpdateNetworkConnectionBanner).toHaveBeenCalledWith({
            status: 'degraded',
            networkName: 'Ethereum Mainnet',
            networkClientId: 'mainnet',
            chainId: '0x1',
            isInfuraEndpoint: true,
            infuraEndpointIndex: undefined,
          });
        });

        it('creates a MetaMetrics event to capture that the status changed', () => {
          mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
            networkName: 'Ethereum Mainnet',
            networkClientId: 'mainnet',
            chainId: '0x1',
            isInfuraEndpoint: true,
            infuraEndpointIndex: undefined,
          });
          mockGetNetworkConnectionBanner.mockReturnValue({ status: 'unknown' });
          const mockTrackEvent = jest.fn();

          renderHookWithProviderTyped(
            () => useNetworkConnectionBanner(),
            mockState,
            undefined,
            undefined,
            () => mockTrackEvent,
          );
          act(() => {
            jest.advanceTimersByTime(5000);
          });

          expect(mockTrackEvent).toHaveBeenCalledWith({
            category: 'Network',
            event: MetaMetricsEventName.NetworkConnectionBannerShown,
            properties: {
              // The names of Segment properties have a particular case.
              /* eslint-disable @typescript-eslint/naming-convention */
              banner_type: 'degraded',
              chain_id_caip: 'eip155:1',
              rpc_domain: 'mainnet.infura.io',
              rpc_endpoint_url: 'mainnet.infura.io',
              /* eslint-enable @typescript-eslint/naming-convention */
            },
          });
        });
      });
    });

    describe('if the status of the banner is "available"', () => {
      it('updates the status of the banner to "degraded" after 5 seconds', () => {
        mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
          isInfuraEndpoint: true,
          infuraEndpointIndex: undefined,
        });
        mockGetNetworkConnectionBanner.mockReturnValue({
          status: 'available',
        });

        renderHookWithProviderTyped(
          () => useNetworkConnectionBanner(),
          mockState,
        );
        act(() => {
          jest.advanceTimersByTime(5000);
        });

        expect(mockUpdateNetworkConnectionBanner).toHaveBeenCalledWith({
          status: 'degraded',
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
          isInfuraEndpoint: true,
          infuraEndpointIndex: undefined,
        });
      });
    });

    describe('if the status of the banner is "degraded"', () => {
      it('updates the status of the banner to "unavailable" after 25 seconds', () => {
        mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
          isInfuraEndpoint: true,
          infuraEndpointIndex: undefined,
        });
        mockGetNetworkConnectionBanner.mockReturnValue({
          status: 'degraded',
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
          isInfuraEndpoint: true,
          infuraEndpointIndex: undefined,
        });

        renderHookWithProviderTyped(
          () => useNetworkConnectionBanner(),
          mockState,
        );
        act(() => {
          jest.advanceTimersByTime(25000);
        });

        expect(mockUpdateNetworkConnectionBanner).toHaveBeenCalledWith({
          status: 'unavailable',
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
          isInfuraEndpoint: true,
          infuraEndpointIndex: undefined,
        });
      });

      it('creates a MetaMetrics event to capture that the status changed', () => {
        mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
          isInfuraEndpoint: true,
          infuraEndpointIndex: undefined,
        });
        mockGetNetworkConnectionBanner.mockReturnValue({
          status: 'degraded',
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
          isInfuraEndpoint: true,
          infuraEndpointIndex: undefined,
        });
        const mockTrackEvent = jest.fn();

        renderHookWithProviderTyped(
          () => useNetworkConnectionBanner(),
          mockState,
          undefined,
          undefined,
          () => mockTrackEvent,
        );
        act(() => {
          jest.advanceTimersByTime(25000);
        });

        expect(mockTrackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: MetaMetricsEventName.NetworkConnectionBannerShown,
          properties: {
            // The names of Segment properties have a particular case.
            /* eslint-disable @typescript-eslint/naming-convention */
            banner_type: 'unavailable',
            chain_id_caip: 'eip155:1',
            rpc_domain: 'mainnet.infura.io',
            rpc_endpoint_url: 'mainnet.infura.io',
            /* eslint-enable @typescript-eslint/naming-convention */
          },
        });
      });
    });
  });

  describe('when some network is unavailable and then all become available', () => {
    it('clears timers and updates the status of the banner to "available"', () => {
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
        isInfuraEndpoint: true,
        infuraEndpointIndex: undefined,
      });
      mockGetNetworkConnectionBanner.mockReturnValue({ status: 'unknown' });

      const { rerender } = renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        mockState,
      );
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue(null);
      rerender();
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Would have updated status to "degraded" if not for resetting timers
      expect(mockUpdateNetworkConnectionBanner).toHaveBeenCalledWith({
        status: 'available',
      });
    });
  });

  describe('on unmount', () => {
    it('clears any timers to show the degraded and unavailable banners', () => {
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
        isInfuraEndpoint: true,
        infuraEndpointIndex: undefined,
      });
      mockGetNetworkConnectionBanner.mockReturnValue({ status: 'unknown' });

      const { unmount } = renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        mockState,
      );
      unmount();
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Would have updated status to "degraded" if not for resetting timers
      expect(mockUpdateNetworkConnectionBanner).not.toHaveBeenCalled();
    });
  });

  describe('when device is offline', () => {
    beforeEach(() => {
      mockGetIsDeviceOffline.mockReturnValue(true);
    });

    it('does not show degraded banner even if network is unavailable', () => {
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
        isInfuraEndpoint: true,
        infuraEndpointIndex: undefined,
      });
      mockGetNetworkConnectionBanner.mockReturnValue({ status: 'unknown' });

      renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        mockState,
      );
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should reset to available, not show degraded
      expect(mockUpdateNetworkConnectionBanner).toHaveBeenCalledWith({
        status: 'available',
      });
      expect(mockUpdateNetworkConnectionBanner).not.toHaveBeenCalledWith(
        expect.objectContaining({ status: 'degraded' }),
      );
    });

    it('resets banner to available when device goes offline while showing degraded', () => {
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
        isInfuraEndpoint: true,
        infuraEndpointIndex: undefined,
      });
      mockGetNetworkConnectionBanner.mockReturnValue({
        status: 'degraded',
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
        isInfuraEndpoint: true,
        infuraEndpointIndex: undefined,
      });

      renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        mockState,
      );

      expect(mockUpdateNetworkConnectionBanner).toHaveBeenCalledWith({
        status: 'available',
      });
    });

    it('does not update banner if already available when offline', () => {
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
        isInfuraEndpoint: true,
        infuraEndpointIndex: undefined,
      });
      mockGetNetworkConnectionBanner.mockReturnValue({ status: 'available' });

      renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        mockState,
      );

      expect(mockUpdateNetworkConnectionBanner).not.toHaveBeenCalled();
    });

    it('does not progress from degraded to unavailable when device goes offline', () => {
      // Device is offline with degraded banner showing
      mockGetIsDeviceOffline.mockReturnValue(true);
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
        isInfuraEndpoint: true,
        infuraEndpointIndex: undefined,
      });
      mockGetNetworkConnectionBanner.mockReturnValue({
        status: 'degraded',
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
        isInfuraEndpoint: true,
        infuraEndpointIndex: undefined,
      });

      renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        mockState,
      );

      // Clear to only track new calls
      mockUpdateNetworkConnectionBanner.mockClear();

      // Wait for what would have been the unavailable timeout
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Should NOT progress to unavailable since device is offline
      expect(mockUpdateNetworkConnectionBanner).not.toHaveBeenCalledWith(
        expect.objectContaining({ status: 'unavailable' }),
      );
    });

    it('resumes normal behavior when device comes back online', () => {
      // Start offline
      mockGetIsDeviceOffline.mockReturnValue(true);
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
        isInfuraEndpoint: true,
        infuraEndpointIndex: undefined,
      });
      // Use 'unknown' so it will try to start timers when coming back online
      mockGetNetworkConnectionBanner.mockReturnValue({ status: 'unknown' });

      const { rerender } = renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        mockState,
      );

      // Clear any calls from initial render
      mockUpdateNetworkConnectionBanner.mockClear();

      // Device comes back online
      mockGetIsDeviceOffline.mockReturnValue(false);
      rerender();

      // Advance timer to trigger degraded
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should now show degraded banner
      expect(mockUpdateNetworkConnectionBanner).toHaveBeenCalledWith({
        status: 'degraded',
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
        isInfuraEndpoint: true,
        infuraEndpointIndex: undefined,
      });
    });
  });

  describe('switchToInfura', () => {
    it('calls updateNetwork and shows toast when infuraEndpointIndex is available', async () => {
      const networkConfig = {
        '0xa4b1': {
          name: 'Arbitrum One',
          chainId: '0xa4b1' as const,
          nativeCurrency: 'ETH',
          rpcEndpoints: [
            {
              networkClientId: 'custom-arbitrum',
              url: 'https://custom.arbitrum.rpc',
              type: RpcEndpointType.Custom,
            },
            {
              networkClientId: 'arbitrum-mainnet' as const,
              url: 'https://arbitrum-mainnet.infura.io/v3/{infuraProjectId}',
              type: RpcEndpointType.Infura,
            },
          ],
          defaultRpcEndpointIndex: 0,
          blockExplorerUrls: ['https://arbiscan.io'],
          defaultBlockExplorerUrlIndex: 0,
        },
      };

      mockGetNetworkConfigurationsByChainId.mockReturnValue(
        networkConfig as unknown as ReturnType<
          typeof mockGetNetworkConfigurationsByChainId
        >,
      );
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue(null);
      mockGetNetworkConnectionBanner.mockReturnValue({
        status: 'unavailable',
        networkName: 'Arbitrum One',
        networkClientId: 'custom-arbitrum',
        chainId: '0xa4b1',
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
          chainId: '0xa4b1',
          defaultRpcEndpointIndex: 1,
        }),
        { replacementSelectedRpcEndpointIndex: 1 },
      );
      expect(mockSetShowInfuraSwitchToast).toHaveBeenCalledWith(true);
    });

    it('does nothing when status is available', async () => {
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue(null);
      mockGetNetworkConnectionBanner.mockReturnValue({ status: 'available' });

      const { result } = renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        mockState,
      );

      await act(async () => {
        await result.current.switchToInfura();
      });

      expect(mockUpdateNetwork).not.toHaveBeenCalled();
      expect(mockSetShowInfuraSwitchToast).not.toHaveBeenCalled();
    });

    it('does nothing when infuraEndpointIndex is undefined', async () => {
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue(null);
      mockGetNetworkConnectionBanner.mockReturnValue({
        status: 'unavailable',
        networkName: 'Custom Network',
        networkClientId: 'custom-network',
        chainId: '0x1000',
        isInfuraEndpoint: false,
        infuraEndpointIndex: undefined,
      });

      const { result } = renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        mockState,
      );

      await act(async () => {
        await result.current.switchToInfura();
      });

      expect(mockUpdateNetwork).not.toHaveBeenCalled();
      expect(mockSetShowInfuraSwitchToast).not.toHaveBeenCalled();
    });

    it('does not show toast when updateNetwork fails', async () => {
      // Mock updateNetwork to return a thunk that rejects
      mockUpdateNetwork.mockImplementationOnce(
        () => () => Promise.reject(new Error('Network update failed')),
      );

      const networkConfig = {
        '0xa4b1': {
          name: 'Arbitrum One',
          chainId: '0xa4b1' as const,
          nativeCurrency: 'ETH',
          rpcEndpoints: [
            {
              networkClientId: 'custom-arbitrum',
              url: 'https://custom.arbitrum.rpc',
              type: RpcEndpointType.Custom,
            },
            {
              networkClientId: 'arbitrum-mainnet' as const,
              url: 'https://arbitrum-mainnet.infura.io/v3/{infuraProjectId}',
              type: RpcEndpointType.Infura,
            },
          ],
          defaultRpcEndpointIndex: 0,
          blockExplorerUrls: ['https://arbiscan.io'],
          defaultBlockExplorerUrlIndex: 0,
        },
      };

      mockGetNetworkConfigurationsByChainId.mockReturnValue(
        networkConfig as unknown as ReturnType<
          typeof mockGetNetworkConfigurationsByChainId
        >,
      );
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue(null);
      mockGetNetworkConnectionBanner.mockReturnValue({
        status: 'unavailable',
        networkName: 'Arbitrum One',
        networkClientId: 'custom-arbitrum',
        chainId: '0xa4b1',
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

      expect(mockUpdateNetwork).toHaveBeenCalled();
      // Toast should NOT be shown when update fails
      expect(mockSetShowInfuraSwitchToast).not.toHaveBeenCalled();
    });

    it('returns fresh network details from selector to prevent stale Switch to MetaMask default RPC button', async () => {
      const networkConfig = {
        '0xa4b1': {
          name: 'Arbitrum One',
          chainId: '0xa4b1' as const,
          nativeCurrency: 'ETH',
          rpcEndpoints: [
            {
              networkClientId: 'custom-arbitrum',
              url: 'https://custom.arbitrum.rpc',
              type: RpcEndpointType.Custom,
            },
            {
              networkClientId: 'arbitrum-mainnet' as const,
              url: 'https://arbitrum-mainnet.infura.io/v3/{infuraProjectId}',
              type: RpcEndpointType.Infura,
            },
          ],
          defaultRpcEndpointIndex: 0,
          blockExplorerUrls: ['https://arbiscan.io'],
          defaultBlockExplorerUrlIndex: 0,
        },
      };

      mockGetNetworkConfigurationsByChainId.mockReturnValue(
        networkConfig as unknown as ReturnType<
          typeof mockGetNetworkConfigurationsByChainId
        >,
      );

      // Banner state still has old custom endpoint details (stale)
      mockGetNetworkConnectionBanner.mockReturnValue({
        status: 'unavailable',
        networkName: 'Arbitrum One',
        networkClientId: 'custom-arbitrum',
        chainId: '0xa4b1',
        isInfuraEndpoint: false,
        infuraEndpointIndex: 1,
      });

      // But selector now returns Infura endpoint (fresh data after switch)
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
        networkName: 'Arbitrum One',
        networkClientId: 'arbitrum-mainnet',
        chainId: '0xa4b1',
        isInfuraEndpoint: true,
        infuraEndpointIndex: undefined,
      });

      const { result } = renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        mockState,
      );

      // Hook should return fresh data from selector, not stale Redux state
      // This prevents showing "Switch to MetaMask default RPC" when already on Infura
      expect(result.current).toStrictEqual(
        expect.objectContaining({
          status: 'unavailable',
          isInfuraEndpoint: true,
          infuraEndpointIndex: undefined,
          networkClientId: 'arbitrum-mainnet',
        }),
      );
    });
  });
});
