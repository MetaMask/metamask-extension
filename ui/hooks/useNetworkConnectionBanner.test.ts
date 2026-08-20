import { act } from '@testing-library/react';
import { renderHookWithProviderTyped } from '../../test/lib/render-helpers-navigate';
import { createMockRouteMessenger } from '../../test/lib/mock-route-messenger';
import type { RouteMessenger } from '../messengers/route-messenger';
import { setShowInfuraSwitchToast } from '../components/app/toast-master/utils';
import mockState from '../../test/data/mock-state.json';
import { MetaMetricsEventName } from '../../shared/constants/metametrics';
import { useNetworkConnectionBanner } from './useNetworkConnectionBanner';

const mockSelectStatus = jest.fn();
const mockSelectNetwork = jest.fn();

jest.mock('@metamask/network-connection-banner-controller', () => ({
  networkConnectionBannerControllerSelectors: {
    selectNetworkConnectionBannerStatus: (state: unknown) =>
      mockSelectStatus(state),
    selectNetworkConnectionBannerNetwork: (state: unknown) =>
      mockSelectNetwork(state),
  },
}));

const mockTrackEvent = jest.fn();

jest.mock('./useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

jest.mock('../components/app/toast-master/utils', () => ({
  ...jest.requireActual('../components/app/toast-master/utils'),
  setShowInfuraSwitchToast: jest.fn((value) => ({
    type: 'SET_SHOW_INFURA_SWITCH_TOAST',
    payload: value,
  })),
}));

jest.mock('../store/background-connection', () => ({
  ...jest.requireActual('../store/background-connection'),
  submitRequestToBackground: jest.fn().mockResolvedValue(true),
}));

const mockSetShowInfuraSwitchToast = jest.mocked(setShowInfuraSwitchToast);

const SWITCH_TO_INFURA_ACTION =
  'NetworkConnectionBannerController:switchToDefaultInfuraRpcEndpoint';

/**
 * Configure the mocked controller selectors to describe a failing network.
 *
 * @param overrides - Partial `FailedNetwork` fields to override the defaults.
 * @returns The full failing-network object the selector will return.
 */
function mockFailedNetwork(overrides: Record<string, unknown> = {}) {
  const network = {
    networkClientId: 'test-client',
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/{infuraProjectId}',
    chainId: '0x1',
    isInfuraEndpoint: true,
    switchableInfuraNetworkClientId: null,
    ...overrides,
  };
  mockSelectNetwork.mockReturnValue(network);
  return network;
}

/**
 * Render the hook with a real route messenger so `useMessenger` resolves the
 * same way it does in the app. Pass a messenger with registered action
 * handlers to exercise the outbound calls.
 *
 * @param routeMessenger - The mock route messenger to provide.
 * @returns The rendered hook result.
 */
function renderBannerHook(
  routeMessenger: RouteMessenger = createMockRouteMessenger(),
) {
  return renderHookWithProviderTyped(
    () => useNetworkConnectionBanner(),
    mockState,
    '/',
    undefined,
    undefined,
    undefined,
    routeMessenger,
  );
}

describe('useNetworkConnectionBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectStatus.mockReturnValue('available');
    mockSelectNetwork.mockReturnValue(null);
  });

  it('returns the banner state from the controller selectors', () => {
    const { result } = renderBannerHook();

    expect(result.current.status).toBe('available');
    expect(result.current.network).toBeNull();
  });

  it('fires the banner-shown analytics event when transitioning to a visible status', async () => {
    mockSelectStatus.mockReturnValue('degraded');
    mockFailedNetwork();

    await act(async () => {
      renderBannerHook();
      // Flush microtasks for the analytics dispatch.
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.NetworkConnectionBannerShown,
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
    renderBannerHook();

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  describe('switchToInfura', () => {
    it('is a no-op when the banner is not visible', async () => {
      const switchToInfura = jest.fn().mockResolvedValue(undefined);
      const messenger = createMockRouteMessenger({
        [SWITCH_TO_INFURA_ACTION]: switchToInfura,
      });

      const { result } = renderBannerHook(messenger);

      await act(async () => {
        await result.current.switchToInfura();
      });

      expect(switchToInfura).not.toHaveBeenCalled();
    });

    it('is a no-op when there is no switchable Infura endpoint', async () => {
      mockSelectStatus.mockReturnValue('degraded');
      mockFailedNetwork({
        isInfuraEndpoint: false,
        switchableInfuraNetworkClientId: null,
      });

      const switchToInfura = jest.fn().mockResolvedValue(undefined);
      const messenger = createMockRouteMessenger({
        [SWITCH_TO_INFURA_ACTION]: switchToInfura,
      });

      const { result } = renderBannerHook(messenger);

      await act(async () => {
        await result.current.switchToInfura();
      });

      expect(switchToInfura).not.toHaveBeenCalled();
    });

    it('switches to the Infura endpoint via the controller and shows the success toast', async () => {
      mockSelectStatus.mockReturnValue('unavailable');
      mockFailedNetwork({
        rpcUrl: 'https://eth-mainnet.alchemyapi.io/v2/abc',
        isInfuraEndpoint: false,
        switchableInfuraNetworkClientId: 'mainnet',
      });

      const switchToInfura = jest.fn().mockResolvedValue(undefined);
      const messenger = createMockRouteMessenger({
        [SWITCH_TO_INFURA_ACTION]: switchToInfura,
      });

      const { result } = renderBannerHook(messenger);

      await act(async () => {
        await result.current.switchToInfura();
      });

      expect(switchToInfura).toHaveBeenCalledWith('0x1');
      expect(mockSetShowInfuraSwitchToast).toHaveBeenCalledWith(true);
    });

    it('does not show the success toast when the switch fails', async () => {
      mockSelectStatus.mockReturnValue('unavailable');
      mockFailedNetwork({
        rpcUrl: 'https://eth-mainnet.alchemyapi.io/v2/abc',
        isInfuraEndpoint: false,
        switchableInfuraNetworkClientId: 'mainnet',
      });

      const switchToInfura = jest
        .fn()
        .mockRejectedValueOnce(new Error('No Infura endpoint available'));
      const messenger = createMockRouteMessenger({
        [SWITCH_TO_INFURA_ACTION]: switchToInfura,
      });
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      const { result } = renderBannerHook(messenger);

      await act(async () => {
        await result.current.switchToInfura();
      });

      expect(mockSetShowInfuraSwitchToast).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
