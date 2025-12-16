import { act } from '@testing-library/react';
import { RpcEndpointType } from '@metamask/network-controller';
import { renderHookWithProviderTyped } from '../../test/lib/render-helpers';
import { selectFirstUnavailableEvmNetwork } from '../selectors/multichain/networks';
import { getNetworkConnectionBanner } from '../selectors/selectors';
import { updateNetworkConnectionBanner } from '../store/actions';
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
const mockUpdateNetworkConnectionBanner = jest.mocked(
  updateNetworkConnectionBanner,
);
const mockGetNetworkConfigurationsByChainId = jest.mocked(
  getNetworkConfigurationsByChainId,
);

describe('useNetworkConnectionBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

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
          });
        });

        it('creates a MetaMetrics event to capture that the status changed', () => {
          mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
            networkName: 'Ethereum Mainnet',
            networkClientId: 'mainnet',
            chainId: '0x1',
            isInfuraEndpoint: true,
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
        });
        mockGetNetworkConnectionBanner.mockReturnValue({
          status: 'degraded',
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
          isInfuraEndpoint: true,
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
        });
      });

      it('creates a MetaMetrics event to capture that the status changed', () => {
        mockSelectFirstUnavailableEvmNetwork.mockReturnValue({
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
          isInfuraEndpoint: true,
        });
        mockGetNetworkConnectionBanner.mockReturnValue({
          status: 'degraded',
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
          isInfuraEndpoint: true,
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
});
