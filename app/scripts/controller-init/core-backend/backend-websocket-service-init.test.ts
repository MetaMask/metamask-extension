import { BackendWebSocketService } from '@metamask/core-backend';
import { Messenger, ActionConstraint } from '@metamask/base-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  BackendWebSocketServiceMessenger,
  BackendWebSocketServiceInitMessenger,
  getBackendWebSocketServiceMessenger,
  getBackendWebSocketServiceInitMessenger,
} from '../messengers/core-backend';
import { BackendWebSocketServiceInit } from './backend-websocket-service-init';

jest.mock('@metamask/core-backend');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    BackendWebSocketServiceMessenger,
    BackendWebSocketServiceInitMessenger
  >
> {
  const baseMessenger = new Messenger<ActionConstraint, never>();

  // Mock RemoteFeatureFlagController:getState
  baseMessenger.registerActionHandler(
    'RemoteFeatureFlagController:getState',
    () =>
      ({
        remoteFeatureFlags: {
          backendWebSocketConnection: {
            value: false,
          },
        },
      }) as never,
  );

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getBackendWebSocketServiceMessenger(baseMessenger),
    initMessenger: getBackendWebSocketServiceInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('BackendWebSocketServiceInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the controller', () => {
    const { controller } = BackendWebSocketServiceInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(BackendWebSocketService);
  });

  it('passes the proper arguments to the controller', () => {
    BackendWebSocketServiceInit(getInitRequestMock());

    const controllerMock = jest.mocked(BackendWebSocketService);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      url: 'wss://gateway.api.cx.metamask.io/v1',
      timeout: 15000,
      reconnectDelay: 1000,
      maxReconnectDelay: 30000,
      requestTimeout: 20000,
      traceFn: expect.any(Function),
      isEnabled: expect.any(Function),
    });
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

  describe('isEnabled callback', () => {
    it('returns false when feature flag is disabled', () => {
      BackendWebSocketServiceInit(getInitRequestMock());

      const { isEnabled } = jest.mocked(BackendWebSocketService).mock
        .calls[0][0];

      expect(isEnabled).toBeDefined();
      expect(isEnabled?.()).toBe(false);
    });

    it('returns false when feature flag check fails', () => {
      const baseMessenger = new Messenger<ActionConstraint, never>();
      baseMessenger.registerActionHandler(
        'RemoteFeatureFlagController:getState',
        () => {
          throw new Error('Feature flag error');
        },
      );

      const requestMock = {
        ...buildControllerInitRequestMock(),
        controllerMessenger: getBackendWebSocketServiceMessenger(baseMessenger),
        initMessenger: getBackendWebSocketServiceInitMessenger(baseMessenger),
      };

      BackendWebSocketServiceInit(requestMock);

      const { isEnabled } = jest.mocked(BackendWebSocketService).mock
        .calls[0][0];

      expect(isEnabled).toBeDefined();
      expect(isEnabled?.()).toBe(false);
    });

    it('returns true when feature flag is enabled', () => {
      const baseMessenger = new Messenger<ActionConstraint, never>();
      baseMessenger.registerActionHandler(
        'RemoteFeatureFlagController:getState',
        () =>
          ({
            remoteFeatureFlags: {
              backendWebSocketConnection: {
                value: true,
              },
            },
          }) as never,
      );

      const requestMock = {
        ...buildControllerInitRequestMock(),
        controllerMessenger: getBackendWebSocketServiceMessenger(baseMessenger),
        initMessenger: getBackendWebSocketServiceInitMessenger(baseMessenger),
      };

      BackendWebSocketServiceInit(requestMock);

      const constructorArgs = jest.mocked(BackendWebSocketService).mock
        .calls[0][0];
      const { isEnabled } = constructorArgs;

      expect(isEnabled).toBeDefined();
      expect(isEnabled?.()).toBe(true);
    });

    it('returns false when feature flag object does not have value property', () => {
      const baseMessenger = new Messenger<ActionConstraint, never>();
      baseMessenger.registerActionHandler(
        'RemoteFeatureFlagController:getState',
        () =>
          ({
            remoteFeatureFlags: {
              backendWebSocketConnection: {
                // Missing 'value' property
                enabled: true,
              },
            },
          }) as never,
      );

      const requestMock = {
        ...buildControllerInitRequestMock(),
        controllerMessenger: getBackendWebSocketServiceMessenger(baseMessenger),
        initMessenger: getBackendWebSocketServiceInitMessenger(baseMessenger),
      };

      BackendWebSocketServiceInit(requestMock);

      const constructorArgs = jest.mocked(BackendWebSocketService).mock
        .calls[0][0];
      const { isEnabled } = constructorArgs;

      expect(isEnabled).toBeDefined();
      expect(isEnabled?.()).toBe(false);
    });

    it('returns false when feature flag is not an object', () => {
      const baseMessenger = new Messenger<ActionConstraint, never>();
      baseMessenger.registerActionHandler(
        'RemoteFeatureFlagController:getState',
        () =>
          ({
            remoteFeatureFlags: {
              backendWebSocketConnection: 'enabled', // Not an object
            },
          }) as never,
      );

      const requestMock = {
        ...buildControllerInitRequestMock(),
        controllerMessenger: getBackendWebSocketServiceMessenger(baseMessenger),
        initMessenger: getBackendWebSocketServiceInitMessenger(baseMessenger),
      };

      BackendWebSocketServiceInit(requestMock);

      const constructorArgs = jest.mocked(BackendWebSocketService).mock
        .calls[0][0];
      const { isEnabled } = constructorArgs;

      expect(isEnabled).toBeDefined();
      expect(isEnabled?.()).toBe(false);
    });

    it('returns false when remoteFeatureFlags is missing', () => {
      const baseMessenger = new Messenger<ActionConstraint, never>();
      baseMessenger.registerActionHandler(
        'RemoteFeatureFlagController:getState',
        () =>
          ({
            // Missing remoteFeatureFlags
          }) as never,
      );

      const requestMock = {
        ...buildControllerInitRequestMock(),
        controllerMessenger: getBackendWebSocketServiceMessenger(baseMessenger),
        initMessenger: getBackendWebSocketServiceInitMessenger(baseMessenger),
      };

      BackendWebSocketServiceInit(requestMock);

      const constructorArgs = jest.mocked(BackendWebSocketService).mock
        .calls[0][0];
      const { isEnabled } = constructorArgs;

      expect(isEnabled).toBeDefined();
      expect(isEnabled?.()).toBe(false);
    });

    it('logs warning when feature flag check fails', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const baseMessenger = new Messenger<ActionConstraint, never>();
      baseMessenger.registerActionHandler(
        'RemoteFeatureFlagController:getState',
        () => {
          throw new Error('Feature flag error');
        },
      );

      const requestMock = {
        ...buildControllerInitRequestMock(),
        controllerMessenger: getBackendWebSocketServiceMessenger(baseMessenger),
        initMessenger: getBackendWebSocketServiceInitMessenger(baseMessenger),
      };

      BackendWebSocketServiceInit(requestMock);

      const constructorArgs = jest.mocked(BackendWebSocketService).mock
        .calls[0][0];
      const { isEnabled } = constructorArgs;

      expect(isEnabled).toBeDefined();
      isEnabled?.();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[BackendWebSocketService] Could not check feature flag, defaulting to NOT connect:',
        expect.any(Error),
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
