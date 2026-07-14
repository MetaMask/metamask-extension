import {
  RampsController,
  getDefaultRampsControllerState,
  type RampsControllerMessenger,
} from '@metamask/ramps-controller';
import { getRootMessenger } from '../lib/messenger';
import type { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getRampsControllerInitMessenger,
  getRampsControllerMessenger,
  type RampsControllerInitMessenger,
} from './messengers';
import { RampsControllerInit } from './ramps-controller-init';

import { RAMPS_NETWORK_ACCESS_DENIED_MESSAGE } from './ramps-network-gate';

const mockRampsController = {
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
};

let mockInit: jest.Mock;
let mockStartOrderPolling: jest.Mock;
let mockStopOrderPolling: jest.Mock;

const mockGetQuotesParams = {
  amount: 0,
  walletAddress: '0x0',
};

jest.mock('@metamask/ramps-controller', () => {
  const actual = jest.requireActual('@metamask/ramps-controller');
  return {
    ...actual,
    RampsController: jest.fn().mockImplementation(() => mockRampsController),
  };
});

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
  });

  it('initializes the controller with default state', () => {
    const { messengerClient } = RampsControllerInit(getInitRequestMock());
    expect(messengerClient).toBeDefined();
    expect(RampsController).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: getDefaultRampsControllerState(),
    });
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

  it('blocks network methods before onboarding completes', () => {
    const { messengerClient } = RampsControllerInit(
      getInitRequestMock({
        completedOnboarding: false,
        useExternalServices: true,
      }),
    );

    expect(() => messengerClient.getQuotes(mockGetQuotesParams)).toThrow(
      RAMPS_NETWORK_ACCESS_DENIED_MESSAGE,
    );
  });

  it('stopRampsLifecycle stops polling when network access is allowed', async () => {
    const { api } = RampsControllerInit(getInitRequestMock());
    await Promise.resolve();
    await Promise.resolve();
    expect(mockStartOrderPolling).toHaveBeenCalled();

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
