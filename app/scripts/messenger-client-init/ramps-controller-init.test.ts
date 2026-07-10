import {
  Messenger,
  ActionConstraint,
  MockAnyNamespace,
  MOCK_ANY_NAMESPACE,
} from '@metamask/messenger';
import {
  RampsController,
  getDefaultRampsControllerState,
  type RampsControllerMessenger,
} from '@metamask/ramps-controller';
import { PreferencesControllerGetStateAction } from '../controllers/preferences-controller';
import { getRootMessenger } from '../lib/messenger';
import type { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getRampsControllerInitMessenger,
  getRampsControllerMessenger,
  type RampsControllerInitMessenger,
} from './messengers';
import { RampsControllerInit } from './ramps-controller-init';

jest.mock('@metamask/ramps-controller', () => {
  const actual = jest.requireActual('@metamask/ramps-controller');
  return {
    ...actual,
    RampsController: jest.fn().mockImplementation(() => ({
      init: jest.fn().mockResolvedValue(undefined),
      startOrderPolling: jest.fn(),
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
    })),
  };
});

type InitRequestMock = jest.Mocked<
  MessengerClientInitRequest<
    RampsControllerMessenger,
    RampsControllerInitMessenger
  >
>;

function createInitMessenger(
  {
    completedOnboarding = true,
    useExternalServices = true,
  }: {
    completedOnboarding?: boolean;
    useExternalServices?: boolean;
  } = {},
): {
  initMessenger: RampsControllerInitMessenger;
  setCompletedOnboarding: (value: boolean) => void;
} {
  let onboardingComplete = completedOnboarding;

  const baseMessenger = new Messenger<
    MockAnyNamespace,
    | PreferencesControllerGetStateAction
    | ActionConstraint
    | 'OnboardingController:getState',
    | 'OnboardingController:stateChange'
    | 'PreferencesController:stateChange'
  >({ namespace: MOCK_ANY_NAMESPACE });

  baseMessenger.registerActionHandler('OnboardingController:getState', () => ({
    completedOnboarding: onboardingComplete,
    seedPhraseBackedUp: null,
    firstTimeFlowType: null,
  }));

  baseMessenger.registerActionHandler(
    'PreferencesController:getState',
    () =>
      ({
        useExternalServices,
      }) as never,
  );

  return {
    initMessenger: getRampsControllerInitMessenger(baseMessenger as never),
    setCompletedOnboarding: (value: boolean) => {
      onboardingComplete = value;
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

describe('RampsControllerInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    const { messengerClient } = RampsControllerInit(getInitRequestMock());
    await Promise.resolve();
    expect(messengerClient.init).toHaveBeenCalled();
    await Promise.resolve();
    expect(messengerClient.startOrderPolling).toHaveBeenCalled();
  });

  it('does not call init during onboarding', async () => {
    const { messengerClient } = RampsControllerInit(
      getInitRequestMock({
        completedOnboarding: false,
        useExternalServices: true,
      }),
    );
    await Promise.resolve();
    expect(messengerClient.init).not.toHaveBeenCalled();
    expect(messengerClient.startOrderPolling).not.toHaveBeenCalled();
  });

  it('does not call init when basic functionality is disabled', async () => {
    const { messengerClient } = RampsControllerInit(
      getInitRequestMock({
        completedOnboarding: true,
        useExternalServices: false,
      }),
    );
    await Promise.resolve();
    expect(messengerClient.init).not.toHaveBeenCalled();
    expect(messengerClient.startOrderPolling).not.toHaveBeenCalled();
  });

  it('starts lifecycle when onboarding completes', async () => {
    const { initMessenger, setCompletedOnboarding } = createInitMessenger({
      completedOnboarding: false,
      useExternalServices: true,
    });
    const onboardingListeners: ((state: { completedOnboarding: boolean }) => void)[] = [];
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
    expect(messengerClient.init).not.toHaveBeenCalled();

    setCompletedOnboarding(true);
    onboardingListeners[0]?.({ completedOnboarding: true });

    await Promise.resolve();
    await Promise.resolve();
    expect(messengerClient.init).toHaveBeenCalled();
    expect(messengerClient.startOrderPolling).toHaveBeenCalled();
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
  });

  it('does not start order polling when init rejects', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const startOrderPolling = jest.fn();
    jest.mocked(RampsController).mockImplementationOnce(
      () =>
        ({
          init: jest.fn().mockRejectedValue(new Error('init failed')),
          startOrderPolling,
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
        }) as never,
    );

    RampsControllerInit(getInitRequestMock());
    await Promise.resolve();
    await Promise.resolve();

    expect(startOrderPolling).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'RampsController failed to initialize',
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });
});
