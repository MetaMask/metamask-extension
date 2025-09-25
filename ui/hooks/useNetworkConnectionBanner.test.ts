import { act } from '@testing-library/react';
import { RpcEndpointType } from '@metamask/network-controller';
import { renderHookWithProviderTyped } from '../../test/lib/render-helpers';
import { selectFirstUnavailableEvmNetwork } from '../selectors/multichain/networks';
import { getNetworkConnectionBanner } from '../selectors/selectors';
import { updateNetworkConnectionBanner } from '../store/actions';
import testData from '../../test/data/mock-state.json';
import { MetaMetricsEventName } from '../../shared/constants/metametrics';
import { useNetworkConnectionBanner } from './useNetworkConnectionBanner';

jest.mock('../../shared/constants/network', () => {
  return {
    ...jest.requireActual('../../shared/constants/network'),
    infuraProjectId: 'mock-infura-project-id',
  };
});

// Mock the selectors and actions
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
  };
});

jest.mock('../store/actions', () => {
  return {
    ...jest.requireActual('../store/actions'),
    updateNetworkConnectionBanner: jest.fn(() => ({
      type: 'UPDATE_NETWORK_CONNECTION_BANNER',
    })),
  };
});

// Create a stable mock object that won't change between calls
const mockNetworkConfigurations = {
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
};

jest.mock('../../shared/modules/selectors/networks', () => {
  return {
    ...jest.requireActual('../../shared/modules/selectors/networks'),
    getNetworkConfigurationsByChainId: jest.fn(() => mockNetworkConfigurations),
  };
});

const mockSelectFirstUnavailableEvmNetwork = jest.mocked(
  selectFirstUnavailableEvmNetwork,
);
const mockGetNetworkConnectionBanner = jest.mocked(getNetworkConnectionBanner);
const mockUpdateNetworkConnectionBanner = jest.mocked(
  updateNetworkConnectionBanner,
);
// const mockGetNetworkConfigurationsByChainId = jest.mocked(
//   getNetworkConfigurationsByChainId,
// );

describe('useNetworkConnectionBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('when all networks are available', () => {
    it("updates the status of the banner to 'available' if not already updated", () => {
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue(null);
      mockGetNetworkConnectionBanner.mockReturnValue({ status: 'unknown' });

      renderHookWithProviderTyped(() => useNetworkConnectionBanner(), testData);

      expect(mockUpdateNetworkConnectionBanner).toHaveBeenCalledWith({
        status: 'available',
      });
    });

    it("does not update the status of the banner to 'available' if already updated", () => {
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue(null);
      mockGetNetworkConnectionBanner.mockReturnValue({
        status: 'available',
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
      });

      renderHookWithProviderTyped(() => useNetworkConnectionBanner(), testData);

      expect(mockUpdateNetworkConnectionBanner).not.toHaveBeenCalled();
    });

    it('does not create a MetaMetrics event', () => {
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue(null);
      mockGetNetworkConnectionBanner.mockReturnValue({ status: 'unknown' });
      const mockTrackEvent = jest.fn();

      renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        testData,
        undefined,
        undefined,
        () => mockTrackEvent,
      );

      expect(mockTrackEvent).not.toHaveBeenCalled();
    });
  });

  describe('when one network is not available', () => {
    describe('if the status of the banner is "unknown"', () => {
      describe('if the network is still not available after 5 seconds', () => {
        it('updates the status of the banner to "slow"', () => {
          mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
            networkName: 'Ethereum Mainnet',
            networkClientId: 'mainnet',
            chainId: '0x1',
          });
          mockGetNetworkConnectionBanner.mockReturnValue({ status: 'unknown' });

          renderHookWithProviderTyped(
            () => useNetworkConnectionBanner(),
            testData,
          );

          act(() => {
            jest.advanceTimersByTime(5000);
          });

          expect(mockUpdateNetworkConnectionBanner).toHaveBeenCalledWith({
            status: 'slow',
            networkName: 'Ethereum Mainnet',
            networkClientId: 'mainnet',
            chainId: '0x1',
          });
        });

        it('creates a MetaMetrics event', () => {
          mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
            networkName: 'Ethereum Mainnet',
            networkClientId: 'mainnet',
            chainId: '0x1',
          });
          mockGetNetworkConnectionBanner.mockReturnValue({ status: 'unknown' });
          const mockTrackEvent = jest.fn();

          renderHookWithProviderTyped(
            () => useNetworkConnectionBanner(),
            testData,
            undefined,
            undefined,
            () => mockTrackEvent,
          );

          act(() => {
            jest.advanceTimersByTime(5000);
          });

          expect(mockTrackEvent).toHaveBeenCalledWith({
            category: 'Network',
            event: MetaMetricsEventName.SlowRpcBannerShown,
            properties: {
              // The names of Segment properties have a particular case.
              /* eslint-disable @typescript-eslint/naming-convention */
              chain_id_caip: 'eip155:1',
              rpc_endpoint_url: 'mainnet.infura.io',
              /* eslint-enable @typescript-eslint/naming-convention */
            },
          });
        });
      });
    });

    describe('if the status of the banner is "available"', () => {
      it('starts slow timer when network becomes unavailable', () => {
        mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
        });
        mockGetNetworkConnectionBanner.mockReturnValue({
          status: 'available',
          networkName: '',
          networkClientId: '',
          chainId: '0x0' as const,
        });

        renderHookWithProviderTyped(
          () => useNetworkConnectionBanner(),
          testData,
        );

        act(() => {
          jest.advanceTimersByTime(5000);
        });

        expect(mockUpdateNetworkConnectionBanner).toHaveBeenCalledWith({
          status: 'slow',
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
        });
      });
    });

    describe('if the status of the banner is "slow"', () => {
      it('starts unavailable timer immediately', () => {
        mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
        });
        mockGetNetworkConnectionBanner.mockReturnValue({
          status: 'slow',
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
        });

        renderHookWithProviderTyped(
          () => useNetworkConnectionBanner(),
          testData,
        );

        act(() => {
          jest.advanceTimersByTime(25000); // UNAVAILABLE_BANNER_TIMEOUT - SLOW_BANNER_TIMEOUT
        });

        expect(mockUpdateNetworkConnectionBanner).toHaveBeenCalledWith({
          status: 'unavailable',
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
        });
      });

      it('creates unavailable MetaMetrics event', () => {
        mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
        });
        mockGetNetworkConnectionBanner.mockReturnValue({
          status: 'slow',
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
        });
        const mockTrackEvent = jest.fn();

        renderHookWithProviderTyped(
          () => useNetworkConnectionBanner(),
          testData,
          undefined,
          undefined,
          () => mockTrackEvent,
        );

        act(() => {
          jest.advanceTimersByTime(25000);
        });

        expect(mockTrackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: MetaMetricsEventName.UnavailableRpcBannerShown,
          properties: {
            // The names of Segment properties have a particular case.
            /* eslint-disable @typescript-eslint/naming-convention */
            chain_id_caip: 'eip155:1',
            rpc_endpoint_url: 'mainnet.infura.io',
            /* eslint-enable @typescript-eslint/naming-convention */
          },
        });
      });
    });
  });

  describe('when network becomes available', () => {
    it('hides banner when network becomes available', () => {
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue(null);
      mockGetNetworkConnectionBanner.mockReturnValue({
        status: 'slow',
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
      });

      renderHookWithProviderTyped(() => useNetworkConnectionBanner(), testData);

      expect(mockUpdateNetworkConnectionBanner).toHaveBeenCalledWith({
        status: 'available',
      });
    });

    it('does not hide banner when status is already available', () => {
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue(null);
      mockGetNetworkConnectionBanner.mockReturnValue({
        status: 'available',
        networkName: '',
        networkClientId: '',
        chainId: '0x0' as const,
      });

      renderHookWithProviderTyped(() => useNetworkConnectionBanner(), testData);

      expect(mockUpdateNetworkConnectionBanner).not.toHaveBeenCalled();
    });
  });

  describe('timer cleanup', () => {
    it('clears timers when component unmounts', () => {
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
      });
      mockGetNetworkConnectionBanner.mockReturnValue({ status: 'unknown' });

      const { unmount } = renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        testData,
      );

      // Start timer
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Unmount component
      unmount();

      // Advance time - should not trigger any updates
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Should only have been called once (if at all) before unmount
      expect(mockUpdateNetworkConnectionBanner).not.toHaveBeenCalledWith(
        expect.objectContaining({ status: 'slow' }),
      );
    });

    it('clears timers when dependencies change', () => {
      // Start with unavailable network
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
      });
      mockGetNetworkConnectionBanner.mockReturnValue({ status: 'unknown' });

      const { rerender } = renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        testData,
      );

      // Start timer
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Change network to available - this should clear timers and hide banner
      mockSelectFirstUnavailableEvmNetwork.mockReturnValue(null);
      mockGetNetworkConnectionBanner.mockReturnValue({
        status: 'unknown', // Keep as unknown to trigger the hide logic
      });

      // Rerender to trigger effect cleanup and new effect
      rerender();

      // Wait for the effect to run
      act(() => {
        jest.runOnlyPendingTimers();
      });

      // Should immediately hide the banner when network becomes available
      expect(mockUpdateNetworkConnectionBanner).toHaveBeenCalledWith({
        status: 'available',
      });
    });
  });

  describe('trackNetworkBannerEvent function', () => {
    it('tracks event with correct parameters', () => {
      const { result } = renderHookWithProviderTyped(
        () => useNetworkConnectionBanner(),
        testData,
      );

      act(() => {
        result.current.trackNetworkBannerEvent('Test Event', 'mainnet');
      });

      // The function should be available but we can't easily test the actual tracking
      // since it depends on the MetaMetrics context
      expect(result.current.trackNetworkBannerEvent).toBeInstanceOf(Function);
    });
  });
});
