import { BackendWebSocketService } from '@metamask/core-backend';
import {
  Messenger,
  ActionConstraint,
  MockAnyNamespace,
  MOCK_ANY_NAMESPACE,
} from '@metamask/messenger';
import { Json } from '@metamask/utils';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  BackendWebSocketServiceMessenger,
  BackendWebSocketServiceInitMessenger,
  getBackendWebSocketServiceMessenger,
  getBackendWebSocketServiceInitMessenger,
} from '../messengers/core-backend';
import * as manifestFlagsModule from '../../../../shared/lib/manifestFlags';
import { BackendWebSocketServiceInit } from './backend-websocket-service-init';

jest.mock('@metamask/core-backend');

type InitRequestMock = jest.Mocked<
  MessengerClientInitRequest<
    BackendWebSocketServiceMessenger,
    BackendWebSocketServiceInitMessenger
  >
>;

/**
 * Build a `remoteFeatureFlags` object holding the given raw
 * `backendWebSocketConnection` value, or an empty one when omitted.
 *
 * @param flag - The raw flag value.
 * @returns The `remoteFeatureFlags` object.
 */
function remoteFeatureFlagsFor(flag?: Json): Record<string, Json> {
  return flag === undefined ? {} : { backendWebSocketConnection: flag };
}

/**
 * Mock the manifest flags read by the `isEnabled` callback.
 *
 * @param flag - The raw manifest `backendWebSocketConnection` value, or
 * `undefined` to expose no manifest override.
 */
function mockManifestFlags(flag?: Json) {
  jest
    .spyOn(manifestFlagsModule, 'getManifestFlags')
    .mockReturnValue({ remoteFeatureFlags: remoteFeatureFlagsFor(flag) });
}

/**
 * Build an init request whose `RemoteFeatureFlagController:getState` action is
 * handled by the given function.
 *
 * @param getState - Handler for the `RemoteFeatureFlagController:getState`
 * action.
 * @returns The init request mock.
 */
function getInitRequestMockWithState(getState: () => unknown): InitRequestMock {
  const baseMessenger = new Messenger<
    MockAnyNamespace,
    ActionConstraint,
    never
  >({
    namespace: MOCK_ANY_NAMESPACE,
  });

  baseMessenger.registerActionHandler(
    'RemoteFeatureFlagController:getState',
    getState as never,
  );

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getBackendWebSocketServiceMessenger(baseMessenger),
    initMessenger: getBackendWebSocketServiceInitMessenger(baseMessenger),
  };
}

/**
 * Build an init request whose remote `backendWebSocketConnection` flag holds
 * the given raw value.
 *
 * @param flag - The raw flag value, or `undefined` to omit the flag.
 * @returns The init request mock.
 */
function getInitRequestMockWithRemoteFlag(flag?: Json): InitRequestMock {
  return getInitRequestMockWithState(() => ({
    remoteFeatureFlags: remoteFeatureFlagsFor(flag),
  }));
}

/**
 * Build an init request whose remote `backendWebSocketConnection` flag is
 * disabled.
 *
 * @returns The init request mock.
 */
function getInitRequestMock(): InitRequestMock {
  return getInitRequestMockWithRemoteFlag({ value: false });
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
    type FlagCase = {
      description: string;
      manifestFlag?: Json;
      remoteFlag?: Json;
      expected: boolean;
    };

    // The manifest override wins whenever it is present; otherwise the remote
    // flag decides. Both sources accept a bare boolean (as resolved from the
    // remote config) or a `{ value }` object (as used by overrides and mocks).
    const flagCases: FlagCase[] = [
      {
        description: 'the remote flag is an object set to false',
        remoteFlag: { value: false },
        expected: false,
      },
      {
        description: 'the remote flag is an object set to true',
        remoteFlag: { value: true },
        expected: true,
      },
      {
        description: 'the remote flag is a bare true',
        remoteFlag: true,
        expected: true,
      },
      {
        description: 'the remote flag is a bare false',
        remoteFlag: false,
        expected: false,
      },
      {
        description: 'the remote flag is an object without a value property',
        remoteFlag: { enabled: true },
        expected: false,
      },
      {
        description: 'the remote flag is neither an object nor a boolean',
        remoteFlag: 'enabled',
        expected: false,
      },
      {
        description: 'the remote flag is absent',
        remoteFlag: undefined,
        expected: false,
      },
      {
        description: 'the manifest override enables a remotely disabled flag',
        manifestFlag: { value: true },
        remoteFlag: { value: false },
        expected: true,
      },
      {
        description: 'the manifest override disables a remotely enabled flag',
        manifestFlag: { value: false },
        remoteFlag: true,
        expected: false,
      },
      {
        description: 'the manifest override is a bare boolean',
        manifestFlag: true,
        remoteFlag: { value: false },
        expected: true,
      },
    ];

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(flagCases)(
      'returns $expected when $description',
      ({ manifestFlag, remoteFlag, expected }: FlagCase) => {
        mockManifestFlags(manifestFlag);

        BackendWebSocketServiceInit(
          getInitRequestMockWithRemoteFlag(remoteFlag),
        );

        const { isEnabled } = jest.mocked(BackendWebSocketService).mock
          .calls[0][0];

        expect(isEnabled).toBeDefined();
        expect(isEnabled?.()).toBe(expected);
      },
    );

    it('returns false when remoteFeatureFlags is missing', () => {
      BackendWebSocketServiceInit(getInitRequestMockWithState(() => ({})));

      const { isEnabled } = jest.mocked(BackendWebSocketService).mock
        .calls[0][0];

      expect(isEnabled).toBeDefined();
      expect(isEnabled?.()).toBe(false);
    });

    it('returns false when feature flag check fails', () => {
      BackendWebSocketServiceInit(
        getInitRequestMockWithState(() => {
          throw new Error('Feature flag error');
        }),
      );

      const { isEnabled } = jest.mocked(BackendWebSocketService).mock
        .calls[0][0];

      expect(isEnabled).toBeDefined();
      expect(isEnabled?.()).toBe(false);
    });

    it('logs warning when feature flag check fails', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      BackendWebSocketServiceInit(
        getInitRequestMockWithState(() => {
          throw new Error('Feature flag error');
        }),
      );

      const { isEnabled } = jest.mocked(BackendWebSocketService).mock
        .calls[0][0];

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
