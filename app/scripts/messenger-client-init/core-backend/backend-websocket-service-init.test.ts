import { BackendWebSocketService } from '@metamask/core-backend';
import {
  Messenger,
  ActionConstraint,
  MockAnyNamespace,
  MOCK_ANY_NAMESPACE,
} from '@metamask/messenger';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  BackendWebSocketServiceMessenger,
  BackendWebSocketServiceInitMessenger,
  getBackendWebSocketServiceMessenger,
  getBackendWebSocketServiceInitMessenger,
} from '../messengers/core-backend';
import { trace } from '../../../../shared/lib/trace';
import { BackendWebSocketServiceInit } from './backend-websocket-service-init';

jest.mock('@metamask/core-backend');
jest.mock('../../../../shared/lib/trace', () => ({
  trace: jest.fn((_request, fn) => (fn ? fn() : undefined)),
}));

type InitRequestMock = jest.Mocked<
  MessengerClientInitRequest<
    BackendWebSocketServiceMessenger,
    BackendWebSocketServiceInitMessenger
  >
>;

/**
 * Build an init request with real restricted messengers.
 *
 * @returns The init request mock.
 */
function getInitRequestMock(): InitRequestMock {
  const baseMessenger = new Messenger<
    MockAnyNamespace,
    ActionConstraint,
    never
  >({
    namespace: MOCK_ANY_NAMESPACE,
  });

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getBackendWebSocketServiceMessenger(baseMessenger),
    initMessenger: getBackendWebSocketServiceInitMessenger(baseMessenger),
  };
}

describe('BackendWebSocketServiceInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initializes the controller', () => {
    const { messengerClient } =
      BackendWebSocketServiceInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(BackendWebSocketService);
  });

  it('passes the proper arguments to the controller', () => {
    BackendWebSocketServiceInit(getInitRequestMock());

    const controllerMock = jest.mocked(BackendWebSocketService);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      url: 'wss://gateway.api.cx.metamask.io/v1',
      traceFn: expect.any(Function),
      isBasicFunctionality: expect.any(Function),
      subscribeToBasicFunctionalityChange: expect.any(Function),
    });
  });

  it('roots every websocket trace in its own trace', () => {
    BackendWebSocketServiceInit(getInitRequestMock());

    const { traceFn } = jest.mocked(BackendWebSocketService).mock.calls[0][0];
    const callback = jest.fn();

    traceFn?.({ name: 'WebSocket Connect' }, callback);

    expect(trace).toHaveBeenCalledWith(
      { name: 'WebSocket Connect', root: true },
      callback,
    );
  });

  it('returns null for both state keys', () => {
    const result = BackendWebSocketServiceInit(getInitRequestMock());

    expect(result.memStateKey).toBeNull();
    expect(result.persistedStateKey).toBeNull();
  });

  it('uses environment variable for WebSocket URL when provided', () => {
    const originalEnv = process.env.MM_BACKEND_WEBSOCKET_URL;
    process.env.MM_BACKEND_WEBSOCKET_URL = 'wss://custom-backend.example.com';

    BackendWebSocketServiceInit(getInitRequestMock());

    const controllerMock = jest.mocked(BackendWebSocketService);
    expect(controllerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'wss://custom-backend.example.com',
      }),
    );

    process.env.MM_BACKEND_WEBSOCKET_URL = originalEnv;
  });

  describe('isBasicFunctionality', () => {
    it('returns false before onboarding is complete', () => {
      const request = getInitRequestMock();
      jest.spyOn(request.initMessenger, 'call').mockImplementation(((
        action: string,
      ) => {
        if (action === 'OnboardingController:getState') {
          return { completedOnboarding: false };
        }
        if (action === 'PreferencesController:getState') {
          return { useExternalServices: true };
        }
        return undefined;
      }) as never);

      BackendWebSocketServiceInit(request);
      const { isBasicFunctionality } = jest.mocked(BackendWebSocketService).mock
        .calls[0][0];

      expect(isBasicFunctionality?.()).toBe(false);
    });

    it('returns the useExternalServices preference after onboarding', () => {
      const request = getInitRequestMock();
      jest.spyOn(request.initMessenger, 'call').mockImplementation(((
        action: string,
      ) => {
        if (action === 'OnboardingController:getState') {
          return { completedOnboarding: true };
        }
        if (action === 'PreferencesController:getState') {
          return { useExternalServices: false };
        }
        return undefined;
      }) as never);

      BackendWebSocketServiceInit(request);
      const { isBasicFunctionality } = jest.mocked(BackendWebSocketService).mock
        .calls[0][0];

      expect(isBasicFunctionality?.()).toBe(false);
    });

    it('returns true when preference state cannot be read', () => {
      const request = getInitRequestMock();
      jest.spyOn(request.initMessenger, 'call').mockImplementation(((
        action: string,
      ) => {
        if (
          action === 'OnboardingController:getState' ||
          action === 'PreferencesController:getState'
        ) {
          throw new Error('state unavailable');
        }
        return undefined;
      }) as never);

      BackendWebSocketServiceInit(request);
      const { isBasicFunctionality } = jest.mocked(BackendWebSocketService).mock
        .calls[0][0];

      expect(isBasicFunctionality?.()).toBe(true);
    });

    it('notifies when useExternalServices changes', () => {
      const request = getInitRequestMock();
      const onChange = jest.fn();
      let preferenceListener: (() => void) | undefined;
      jest.spyOn(request.initMessenger, 'subscribe').mockImplementation(((
        event: string,
        listener: () => void,
      ) => {
        if (event === 'PreferencesController:stateChange') {
          preferenceListener = listener;
        }
        return undefined;
      }) as never);

      BackendWebSocketServiceInit(request);
      const { subscribeToBasicFunctionalityChange, isBasicFunctionality } =
        jest.mocked(BackendWebSocketService).mock.calls[0][0];

      jest.spyOn(request.initMessenger, 'call').mockImplementation(((
        action: string,
      ) => {
        if (action === 'OnboardingController:getState') {
          return { completedOnboarding: true };
        }
        if (action === 'PreferencesController:getState') {
          return { useExternalServices: false };
        }
        return undefined;
      }) as never);

      subscribeToBasicFunctionalityChange?.(onChange);
      preferenceListener?.();

      expect(onChange).toHaveBeenCalledWith(false);
      expect(isBasicFunctionality?.()).toBe(false);
    });
  });
});
