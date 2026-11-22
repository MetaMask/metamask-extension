import {
  RampsController,
  RampsEnvironment,
  getDefaultRampsControllerState,
  type RampsControllerMessenger,
} from '@metamask/ramps-controller';
import { getRampsEnvironment } from '../../../shared/lib/ramps/environment';
import { getRootMessenger } from '../lib/messenger';
import { captureException } from '../../../shared/lib/sentry';
import { trackEvent } from '../controllers/analytics';
import type { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getRampsControllerInitMessenger,
  getRampsControllerMessenger,
  type RampsControllerInitMessenger,
} from './messengers';
import { RampsControllerInit } from './ramps-controller-init';

const mockRampsController = {
  state: { orders: [] as { status: string }[] },
  init: jest.fn().mockResolvedValue(undefined),
  getCountries: jest.fn(),
  startOrderPolling: jest.fn(),
  stopOrderPolling: jest.fn(),
  setUserRegion: jest.fn(),
  setSelectedToken: jest.fn(),
  setSelectedProvider: jest.fn(),
  setSelectedPaymentMethod: jest.fn(),
  getTokens: jest.fn(),
  getProviders: jest.fn(),
  getPaymentMethods: jest.fn(),
  getQuotes: jest.fn(),
  getBuyWidgetData: jest.fn(),
  addPrecreatedOrder: jest.fn(),
  addOrder: jest.fn(),
  removeOrder: jest.fn(),
  getOrder: jest.fn(),
  getOrderFromCallback: jest.fn(),
  syncOrdersWithUserStorage: jest.fn(),
};

let mockInit: jest.Mock;
let mockStartOrderPolling: jest.Mock;
let mockStopOrderPolling: jest.Mock;

/**
 * Reads the `isNetworkAccessAllowed` check the controller was constructed with.
 *
 * @returns The network access check passed to the `RampsController` constructor.
 */
function getNetworkAccessAllowedCheck(): () => boolean {
  const [options] = jest.mocked(RampsController).mock.lastCall ?? [];
  return (options as unknown as { isNetworkAccessAllowed: () => boolean })
    .isNetworkAccessAllowed;
}

jest.mock('@metamask/ramps-controller', () => {
  const actual = jest.requireActual('@metamask/ramps-controller');
  return {
    ...actual,
    RampsController: jest.fn().mockImplementation(() => mockRampsController),
  };
});

jest.mock('../../../shared/lib/sentry', () => ({
  ...jest.requireActual('../../../shared/lib/sentry'),
  captureException: jest.fn(),
}));

jest.mock('../controllers/analytics', () => ({
  trackEvent: jest.fn(),
}));

jest.mock('../../../shared/lib/ramps/environment', () => ({
  getRampsEnvironment: jest.fn(),
}));

type InitRequestMock = jest.Mocked<
  MessengerClientInitRequest<
    RampsControllerMessenger,
    RampsControllerInitMessenger
  >
>;

function createInitMessenger({
  completedOnboarding = true,
  useExternalServices = true,
}: {
  completedOnboarding?: boolean;
  useExternalServices?: boolean;
} = {}): {
  initMessenger: RampsControllerInitMessenger;
  setCompletedOnboarding: (value: boolean) => void;
  setUseExternalServices: (value: boolean) => void;
} {
  let onboardingComplete = completedOnboarding;
  let externalServices = useExternalServices;

  const baseMessenger = getRootMessenger<never, never>();
  const initMessenger = getRampsControllerInitMessenger(baseMessenger);

  initMessenger.call = jest.fn().mockImplementation((action) => {
    if (action === 'OnboardingController:getState') {
      return {
        completedOnboarding: onboardingComplete,
        seedPhraseBackedUp: null,
        firstTimeFlowType: null,
      };
    }
    if (action === 'PreferencesController:getState') {
      return { useExternalServices: externalServices };
    }
    throw new Error(`Unexpected action: ${action}`);
  });

  return {
    initMessenger,
    setCompletedOnboarding: (value: boolean) => {
      onboardingComplete = value;
    },
    setUseExternalServices: (value: boolean) => {
      externalServices = value;
    },
  };
}

function getInitRequestMock(
  options?: Parameters<typeof createInitMessenger>[0],
): InitRequestMock {
  const baseMessenger = getRootMessenger<never, never>();
  const { initMessenger } = createInitMessenger(options);

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getRampsControllerMessenger(baseMessenger),
    initMessenger,
    persistedState: {},
  };
}

function resetMockRampsController(): void {
  mockRampsController.state = { orders: [] };
  mockInit = jest.fn().mockResolvedValue(undefined);
  mockStartOrderPolling = jest.fn();
  mockStopOrderPolling = jest.fn();
  mockRampsController.init = mockInit;
  mockRampsController.getCountries = jest.fn();
  mockRampsController.startOrderPolling = mockStartOrderPolling;
  mockRampsController.stopOrderPolling = mockStopOrderPolling;
  mockRampsController.setUserRegion = jest.fn();
  mockRampsController.setSelectedToken = jest.fn();
  mockRampsController.setSelectedProvider = jest.fn();
  mockRampsController.setSelectedPaymentMethod = jest.fn();
  mockRampsController.getTokens = jest.fn();
  mockRampsController.getProviders = jest.fn();
  mockRampsController.getPaymentMethods = jest.fn();
  mockRampsController.getQuotes = jest.fn();
  mockRampsController.getBuyWidgetData = jest.fn();
  mockRampsController.addPrecreatedOrder = jest.fn();
  mockRampsController.addOrder = jest.fn();
  mockRampsController.removeOrder = jest.fn();
  mockRampsController.getOrder = jest.fn();
  mockRampsController.getOrderFromCallback = jest.fn();
}

describe('RampsControllerInit', () => {
  beforeEach(() => {
    resetMockRampsController();
    jest.mocked(getRampsEnvironment).mockReturnValue(RampsEnvironment.Staging);
  });

  it('initializes the controller with default state', () => {
    const { messengerClient } = RampsControllerInit(getInitRequestMock());
    expect(messengerClient).toBeDefined();
    expect(RampsController).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: getDefaultRampsControllerState(),
      requestCacheTTL: 60_000,
      isNetworkAccessAllowed: expect.any(Function),
      trace: expect.any(Function),
      onOrderSyncErroneousSituation: expect.any(Function),
    });
  });

  it('keeps the controller default cache TTL in production', () => {
    jest
      .mocked(getRampsEnvironment)
      .mockReturnValue(RampsEnvironment.Production);

    RampsControllerInit(getInitRequestMock());

    expect(RampsController).toHaveBeenCalledWith(
      expect.objectContaining({ requestCacheTTL: undefined }),
    );
  });

  it('reports order sync erroneous situations to sentry and analytics', () => {
    RampsControllerInit(getInitRequestMock());

    const { onOrderSyncErroneousSituation } = jest.mocked(RampsController).mock
      .calls[0][0] as unknown as {
      onOrderSyncErroneousSituation: (
        situationMessage: string,
        sentryContext: Record<string, unknown>,
      ) => void;
    };

    onOrderSyncErroneousSituation('missing remote order', { orderId: '1' });

    expect(jest.mocked(captureException).mock.calls).toMatchSnapshot();
    expect(jest.mocked(trackEvent).mock.calls).toMatchSnapshot();
  });

  it('exposes ramps background API methods', () => {
    const { api } = RampsControllerInit(getInitRequestMock());
    expect(Object.keys(api ?? {}).sort()).toMatchSnapshot();
  });

  it('starts order polling after init resolves when onboarding is complete', async () => {
    RampsControllerInit(getInitRequestMock());
    await Promise.resolve();
    expect(mockInit).toHaveBeenCalled();
    await Promise.resolve();
    expect(mockStartOrderPolling).toHaveBeenCalled();
  });

  it('does not call init during onboarding', async () => {
    RampsControllerInit(
      getInitRequestMock({
        completedOnboarding: false,
        useExternalServices: true,
      }),
    );
    await Promise.resolve();
    expect(mockInit).not.toHaveBeenCalled();
    expect(mockStartOrderPolling).not.toHaveBeenCalled();
  });

  it('does not call init when basic functionality is disabled', async () => {
    RampsControllerInit(
      getInitRequestMock({
        completedOnboarding: true,
        useExternalServices: false,
      }),
    );
    await Promise.resolve();
    expect(mockInit).not.toHaveBeenCalled();
    expect(mockStartOrderPolling).not.toHaveBeenCalled();
  });

  it('starts lifecycle when onboarding completes', async () => {
    const { initMessenger, setCompletedOnboarding } = createInitMessenger({
      completedOnboarding: false,
      useExternalServices: true,
    });
    const onboardingListeners: ((state: {
      completedOnboarding: boolean;
    }) => void)[] = [];
    const subscribeSpy = jest
      .spyOn(initMessenger, 'subscribe')
      .mockImplementation((event, listener) => {
        if (event === 'OnboardingController:stateChange') {
          onboardingListeners.push(
            listener as (state: { completedOnboarding: boolean }) => void,
          );
        }
        return undefined as never;
      });
    const baseMessenger = getRootMessenger<never, never>();
    const { messengerClient } = RampsControllerInit({
      ...buildControllerInitRequestMock(),
      controllerMessenger: getRampsControllerMessenger(baseMessenger),
      initMessenger,
      persistedState: {},
    });

    await Promise.resolve();
    expect(mockInit).not.toHaveBeenCalled();

    setCompletedOnboarding(true);
    onboardingListeners[0]?.({ completedOnboarding: true });

    await Promise.resolve();
    await Promise.resolve();
    expect(mockInit).toHaveBeenCalled();
    expect(mockStartOrderPolling).toHaveBeenCalled();
    subscribeSpy.mockRestore();
  });

  it('exposes startRampsLifecycle on the background API', () => {
    const { api } = RampsControllerInit(
      getInitRequestMock({
        completedOnboarding: false,
        useExternalServices: true,
      }),
    );
    expect(api?.startRampsLifecycle).toEqual(expect.any(Function));
    expect(api?.stopRampsLifecycle).toEqual(expect.any(Function));
  });

  it('passes a network access check to the controller', () => {
    RampsControllerInit(
      getInitRequestMock({
        completedOnboarding: false,
        useExternalServices: true,
      }),
    );

    expect(getNetworkAccessAllowedCheck()()).toBe(false);
  });

  it('allows network access once onboarding is complete and basic functionality is on', () => {
    RampsControllerInit(getInitRequestMock());

    expect(getNetworkAccessAllowedCheck()()).toBe(true);
  });

  it('re-reads onboarding and basic functionality state on every check', () => {
    const baseMessenger = getRootMessenger<never, never>();
    const { initMessenger, setCompletedOnboarding, setUseExternalServices } =
      createInitMessenger({
        completedOnboarding: false,
        useExternalServices: true,
      });

    RampsControllerInit({
      ...buildControllerInitRequestMock(),
      controllerMessenger: getRampsControllerMessenger(baseMessenger),
      initMessenger,
      persistedState: {},
    });

    const isNetworkAccessAllowed = getNetworkAccessAllowedCheck();

    expect(isNetworkAccessAllowed()).toBe(false);

    setCompletedOnboarding(true);
    expect(isNetworkAccessAllowed()).toBe(true);

    setUseExternalServices(false);
    expect(isNetworkAccessAllowed()).toBe(false);
  });

  it('stopRampsLifecycle stops polling when network access is allowed', async () => {
    const { api } = RampsControllerInit(getInitRequestMock());
    await Promise.resolve();
    await Promise.resolve();
    expect(mockStartOrderPolling).toHaveBeenCalled();

    api?.stopRampsLifecycle?.();

    expect(mockStopOrderPolling).toHaveBeenCalled();
  });

  it('keeps polling on UI close while an order is still pending', async () => {
    mockRampsController.state = { orders: [{ status: 'PENDING' }] };
    const { api } = RampsControllerInit(getInitRequestMock());
    await Promise.resolve();
    await Promise.resolve();
    expect(mockStartOrderPolling).toHaveBeenCalled();

    api?.stopRampsLifecycle?.();

    expect(mockStopOrderPolling).not.toHaveBeenCalled();
  });

  // A stub in one of these statuses may never resolve, so it must not hold the
  // lifecycle open — see IN_FLIGHT_ORDER_STATUSES.
  async function expectUiCloseStopsPollingFor(status: string): Promise<void> {
    mockRampsController.state = { orders: [{ status }] };
    const { api } = RampsControllerInit(getInitRequestMock());
    await Promise.resolve();
    await Promise.resolve();

    api?.stopRampsLifecycle?.();

    expect(mockStopOrderPolling).toHaveBeenCalled();
  }

  it('stops polling on UI close for a PRECREATED stub', async () => {
    await expectUiCloseStopsPollingFor('PRECREATED');
  });

  it('stops polling on UI close for an UNKNOWN stub', async () => {
    await expectUiCloseStopsPollingFor('UNKNOWN');
  });

  it('runs stale-stub cleanup again after a UI close/open cycle', async () => {
    mockRampsController.state = { orders: [{ status: 'PRECREATED' }] };
    const { api } = RampsControllerInit(getInitRequestMock());
    await Promise.resolve();
    await Promise.resolve();
    const startCallsAfterBoot = mockStartOrderPolling.mock.calls.length;

    // Close: the stub must not hold the lifecycle open, otherwise
    // `lifecycleStarted` never clears and cleanup can never run again.
    api?.stopRampsLifecycle?.();
    expect(mockStopOrderPolling).toHaveBeenCalled();

    // Reopen: lifecycle restarts, so cleanup gets another chance.
    api?.startRampsLifecycle?.();
    await Promise.resolve();
    await Promise.resolve();
    expect(mockStartOrderPolling.mock.calls.length).toBeGreaterThan(
      startCallsAfterBoot,
    );
  });

  it('stops polling on UI close once every order is terminal', async () => {
    mockRampsController.state = {
      orders: [{ status: 'COMPLETED' }, { status: 'CANCELLED' }],
    };
    const { api } = RampsControllerInit(getInitRequestMock());
    await Promise.resolve();
    await Promise.resolve();

    api?.stopRampsLifecycle?.();

    expect(mockStopOrderPolling).toHaveBeenCalled();
  });

  it('stops polling on UI close with a pending order when network access is revoked', async () => {
    mockRampsController.state = { orders: [{ status: 'PENDING' }] };
    const { initMessenger, setUseExternalServices } = createInitMessenger();
    const baseMessenger = getRootMessenger<never, never>();
    const { api } = RampsControllerInit({
      ...buildControllerInitRequestMock(),
      controllerMessenger: getRampsControllerMessenger(baseMessenger),
      initMessenger,
      persistedState: {},
    });
    await Promise.resolve();
    await Promise.resolve();

    setUseExternalServices(false);
    api?.stopRampsLifecycle?.();

    expect(mockStopOrderPolling).toHaveBeenCalled();
  });

  it('stops order polling when basic functionality is disabled', async () => {
    const { initMessenger, setUseExternalServices } = createInitMessenger({
      completedOnboarding: true,
      useExternalServices: true,
    });

    const preferenceListeners: ((state: {
      useExternalServices: boolean;
    }) => void)[] = [];
    jest
      .spyOn(initMessenger, 'subscribe')
      .mockImplementation((event, listener) => {
        if (event === 'PreferencesController:stateChange') {
          preferenceListeners.push(
            listener as (state: { useExternalServices: boolean }) => void,
          );
        }
        return undefined as never;
      });

    const baseMessenger = getRootMessenger<never, never>();
    RampsControllerInit({
      ...buildControllerInitRequestMock(),
      controllerMessenger: getRampsControllerMessenger(baseMessenger),
      initMessenger,
      persistedState: {},
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(mockStartOrderPolling).toHaveBeenCalled();

    setUseExternalServices(false);
    preferenceListeners[0]?.({ useExternalServices: false });

    expect(mockStopOrderPolling).toHaveBeenCalled();
  });

  it('does not restart polling when init completes after stopRampsLifecycle', async () => {
    let resolveInit: () => void = () => undefined;
    mockInit.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveInit = resolve;
        }),
    );

    const { initMessenger, setUseExternalServices } = createInitMessenger({
      completedOnboarding: true,
      useExternalServices: true,
    });

    const preferenceListeners: ((state: {
      useExternalServices: boolean;
    }) => void)[] = [];
    jest
      .spyOn(initMessenger, 'subscribe')
      .mockImplementation((event, listener) => {
        if (event === 'PreferencesController:stateChange') {
          preferenceListeners.push(
            listener as (state: { useExternalServices: boolean }) => void,
          );
        }
        return undefined as never;
      });

    const baseMessenger = getRootMessenger<never, never>();
    RampsControllerInit({
      ...buildControllerInitRequestMock(),
      controllerMessenger: getRampsControllerMessenger(baseMessenger),
      initMessenger,
      persistedState: {},
    });

    await Promise.resolve();
    expect(mockInit).toHaveBeenCalled();
    expect(mockStartOrderPolling).not.toHaveBeenCalled();

    setUseExternalServices(false);
    preferenceListeners[0]?.({ useExternalServices: false });
    expect(mockStopOrderPolling).toHaveBeenCalled();

    resolveInit();
    await Promise.resolve();

    expect(mockStartOrderPolling).not.toHaveBeenCalled();
  });

  it('does not start order polling when init rejects', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockInit.mockRejectedValueOnce(new Error('init failed'));

    RampsControllerInit(getInitRequestMock());
    await Promise.resolve();
    await Promise.resolve();

    expect(mockStartOrderPolling).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'RampsController failed to initialize',
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });
});
