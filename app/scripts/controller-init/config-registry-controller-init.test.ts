import {
  ConfigRegistryController,
  ConfigRegistryApiService,
  type ConfigRegistryControllerState,
} from '@metamask/config-registry-controller';
import { getRootMessenger } from '../lib/messenger';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getConfigRegistryControllerMessenger,
  getConfigRegistryControllerInitMessenger,
} from './messengers/config-registry-controller-messenger';
import { ConfigRegistryControllerInit } from './config-registry-controller-init';
import type {
  ConfigRegistryControllerInitMessenger,
  ConfigRegistryControllerMessenger,
} from './messengers/config-registry-controller-messenger';
import type { ControllerInitRequest } from './types';

jest.mock('@metamask/config-registry-controller');

const defaultConfigRegistryControllerState: ConfigRegistryControllerState = {
  configs: { networks: {} },
  version: null,
  lastFetched: null,
  etag: null,
};

const mockConfigRegistryController = jest.mocked(ConfigRegistryController);
const mockConfigRegistryApiService = jest.mocked(ConfigRegistryApiService);

function buildInitRequestMock(
  remoteFeatureFlags?: Record<string, unknown>,
): jest.Mocked<
  ControllerInitRequest<
    ConfigRegistryControllerMessenger,
    ConfigRegistryControllerInitMessenger
  >
> {
  const baseControllerMessenger = getRootMessenger<never, never>();

  const controllerMessenger = getConfigRegistryControllerMessenger(
    baseControllerMessenger,
  );

  const initMessenger = getConfigRegistryControllerInitMessenger(
    baseControllerMessenger,
  );

  jest.spyOn(initMessenger, 'call').mockImplementation((action: string) => {
    if (action === 'RemoteFeatureFlagController:getState') {
      return {
        remoteFeatureFlags: remoteFeatureFlags ?? {},
      } as never;
    }
    return undefined as never;
  });

  jest.spyOn(initMessenger, 'subscribe').mockImplementation(() => {
    return jest.fn();
  });

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger,
    initMessenger,
  };
}

/**
 * Returns a spy on controllerMessenger.call for tests that assert fetchConfig usage.
 * @param request - Controller init request mock containing controllerMessenger.
 */
function spyOnControllerMessengerCall(
  request: jest.Mocked<
    ControllerInitRequest<
      ConfigRegistryControllerMessenger,
      ConfigRegistryControllerInitMessenger
    >
  >,
) {
  return jest.spyOn(
    request.controllerMessenger as unknown as { call: jest.Mock },
    'call',
  );
}

describe('ConfigRegistryControllerInit', () => {
  let mockControllerInstance: jest.Mocked<ConfigRegistryController>;

  beforeEach(() => {
    jest.resetAllMocks();

    mockControllerInstance = {
      startPolling: jest.fn(),
      stopAllPolling: jest.fn(),
      state: defaultConfigRegistryControllerState,
    } as unknown as jest.Mocked<ConfigRegistryController>;

    mockConfigRegistryController.mockImplementation(() => {
      return mockControllerInstance;
    });

    mockConfigRegistryApiService.mockImplementation(() => {
      return {} as ConfigRegistryApiService;
    });

    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('controller initialization', () => {
    it('returns controller instance', () => {
      const requestMock = buildInitRequestMock();
      const result = ConfigRegistryControllerInit(requestMock);

      expect(result).toBeDefined();
      expect(result.controller).toBeDefined();
      expect(mockConfigRegistryController).toHaveBeenCalled();
    });

    it('initializes with correct messenger and state', () => {
      const requestMock = buildInitRequestMock();
      const mockPersistedState: ConfigRegistryControllerState = {
        configs: { networks: { 'eip155:1': {} as never } },
        version: '1.0.0',
        lastFetched: Date.now(),
        etag: null,
      };
      const persistedState = requestMock.persistedState as Partial<{
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ConfigRegistryController: ConfigRegistryControllerState;
      }>;
      persistedState.ConfigRegistryController = mockPersistedState;

      ConfigRegistryControllerInit(requestMock);

      expect(mockConfigRegistryController).toHaveBeenCalledWith({
        messenger: requestMock.controllerMessenger,
        state: mockPersistedState,
      });
    });

    it('uses undefined state when no persisted state', () => {
      const requestMock = buildInitRequestMock();

      ConfigRegistryControllerInit(requestMock);

      expect(mockConfigRegistryController).toHaveBeenCalledWith({
        messenger: requestMock.controllerMessenger,
        state: undefined,
      });
    });

    it('throws error when controllerMessenger is missing', () => {
      const requestMock = buildInitRequestMock();
      requestMock.controllerMessenger = null as never;

      expect(() => ConfigRegistryControllerInit(requestMock)).toThrow(
        'ConfigRegistryController requires a controllerMessenger',
      );
    });
  });

  describe('polling and feature flag', () => {
    it('starts polling when configRegistryApiEnabled is true', () => {
      const requestMock = buildInitRequestMock({
        configRegistryApiEnabled: true,
      });
      ConfigRegistryControllerInit(requestMock);

      expect(mockControllerInstance.startPolling).toHaveBeenCalledWith(null);
    });

    it('does not start polling when configRegistryApiEnabled is false', () => {
      const requestMock = buildInitRequestMock({
        configRegistryApiEnabled: false,
      });
      ConfigRegistryControllerInit(requestMock);

      expect(mockControllerInstance.startPolling).not.toHaveBeenCalled();
    });

    it('does not start polling when configRegistryApiEnabled is missing', () => {
      const requestMock = buildInitRequestMock();
      ConfigRegistryControllerInit(requestMock);

      expect(mockControllerInstance.startPolling).not.toHaveBeenCalled();
    });
  });

  describe('initial fetch and feature flag', () => {
    it('does not call fetch when hasPersistedConfigs is true', () => {
      mockControllerInstance.state = {
        configs: { networks: { 'eip155:1': {} as never } },
        version: '1',
        lastFetched: Date.now(),
        etag: null,
      };
      const requestMock = buildInitRequestMock({
        configRegistryApiEnabled: true,
      });
      const callSpy = spyOnControllerMessengerCall(requestMock);

      ConfigRegistryControllerInit(requestMock);

      expect(callSpy).not.toHaveBeenCalledWith(
        'ConfigRegistryApiService:fetchConfig',
        {},
      );
    });

    it('calls fetch when hasPersistedConfigs is false and flag is true', () => {
      jest.useFakeTimers();
      const requestMock = buildInitRequestMock({
        configRegistryApiEnabled: true,
      });
      const callSpy = spyOnControllerMessengerCall(requestMock);
      callSpy.mockImplementation((action: string) => {
        if (action === 'ConfigRegistryApiService:fetchConfig') {
          return Promise.resolve({ modified: false, data: null, etag: null });
        }
        return undefined as never;
      });

      ConfigRegistryControllerInit(requestMock);
      jest.runAllTimers();

      expect(callSpy).toHaveBeenCalledWith(
        'ConfigRegistryApiService:fetchConfig',
        {},
      );
      jest.useRealTimers();
    });

    it('does not call fetch when hasPersistedConfigs is false and flag is false', () => {
      jest.useFakeTimers();
      const requestMock = buildInitRequestMock({
        configRegistryApiEnabled: false,
      });
      const callSpy = spyOnControllerMessengerCall(requestMock);

      ConfigRegistryControllerInit(requestMock);
      jest.runAllTimers();

      expect(callSpy).not.toHaveBeenCalledWith(
        'ConfigRegistryApiService:fetchConfig',
        {},
      );
      jest.useRealTimers();
    });

    it('does not throw when initial fetch rejects', async () => {
      jest.useFakeTimers();
      const requestMock = buildInitRequestMock({
        configRegistryApiEnabled: true,
      });
      spyOnControllerMessengerCall(requestMock).mockImplementation(
        (action: string) => {
          if (action === 'ConfigRegistryApiService:fetchConfig') {
            return Promise.reject(new Error('fetch failed'));
          }
          return undefined as never;
        },
      );

      expect(() => ConfigRegistryControllerInit(requestMock)).not.toThrow();
      jest.runAllTimers();
      await Promise.resolve();
      await Promise.resolve();

      jest.useRealTimers();
    });

    it('updates controller state when initial fetch returns modified true and data', async () => {
      jest.useFakeTimers();
      const controllerWithUpdate = mockControllerInstance as unknown as {
        update: jest.Mock;
      };
      controllerWithUpdate.update = jest.fn();
      const requestMock = buildInitRequestMock({
        configRegistryApiEnabled: true,
      });
      const chainConfig = {
        chainId: 'eip155:1',
        name: 'Ethereum Mainnet',
        rpcProviders: {
          default: {
            url: 'https://eth.llamarpc.com',
            type: 'custom',
            networkClientId: 'evm-1',
          },
          fallbacks: [],
        },
        config: {
          isActive: true,
          isTestnet: false,
          isDefault: true,
          isFeatured: true,
          isDeprecated: false,
          isDeletable: false,
          priority: 0,
        },
      };
      spyOnControllerMessengerCall(requestMock).mockImplementation(
        (action: string) => {
          if (action === 'ConfigRegistryApiService:fetchConfig') {
            return Promise.resolve({
              modified: true,
              data: {
                data: {
                  chains: [chainConfig],
                  version: '1.0',
                },
              },
              etag: 'test-etag',
            });
          }
          return undefined as never;
        },
      );

      ConfigRegistryControllerInit(requestMock);
      jest.runAllTimers();
      await Promise.resolve();
      await Promise.resolve();

      expect(controllerWithUpdate.update).toHaveBeenCalledTimes(1);
      const producer = controllerWithUpdate.update.mock.calls[0][0];
      const state = {
        configs: { networks: {} as Record<string, unknown> },
        version: null as string | null,
        lastFetched: null as number | null,
        etag: null as string | null,
      };
      producer(state);
      expect(state.configs.networks['eip155:1']).toEqual(chainConfig);
      expect(state.version).toBe('1.0');
      expect(state.lastFetched).not.toBeNull();
      expect(state.etag).toBe('test-etag');

      jest.useRealTimers();
    });

    it('does not call controller.update when fetch returns data without chains array', async () => {
      jest.useFakeTimers();
      const controllerWithUpdate = mockControllerInstance as unknown as {
        update: jest.Mock;
      };
      controllerWithUpdate.update = jest.fn();
      const requestMock = buildInitRequestMock({
        configRegistryApiEnabled: true,
      });
      spyOnControllerMessengerCall(requestMock).mockImplementation(
        (action: string) => {
          if (action === 'ConfigRegistryApiService:fetchConfig') {
            return Promise.resolve({
              modified: true,
              data: {
                data: { version: '1.0' },
              },
              etag: 'x',
            });
          }
          return undefined as never;
        },
      );

      ConfigRegistryControllerInit(requestMock);
      jest.runAllTimers();
      await Promise.resolve();
      await Promise.resolve();

      expect(controllerWithUpdate.update).not.toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('does not call controller.update when fetch returns data.data.chains not an array', async () => {
      jest.useFakeTimers();
      const controllerWithUpdate = mockControllerInstance as unknown as {
        update: jest.Mock;
      };
      controllerWithUpdate.update = jest.fn();
      const requestMock = buildInitRequestMock({
        configRegistryApiEnabled: true,
      });
      spyOnControllerMessengerCall(requestMock).mockImplementation(
        (action: string) => {
          if (action === 'ConfigRegistryApiService:fetchConfig') {
            return Promise.resolve({
              modified: true,
              data: {
                data: { chains: null, version: '1.0' },
              },
              etag: 'x',
            });
          }
          return undefined as never;
        },
      );

      ConfigRegistryControllerInit(requestMock);
      jest.runAllTimers();
      await Promise.resolve();
      await Promise.resolve();

      expect(controllerWithUpdate.update).not.toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('when flag becomes true later (stateChange)', () => {
    it('triggers initial fetch and startPolling when stateChange fires with configRegistryApiEnabled true and no configs', () => {
      jest.useFakeTimers();
      const requestMock = buildInitRequestMock({
        configRegistryApiEnabled: false,
      });
      const callSpy = spyOnControllerMessengerCall(requestMock);
      callSpy.mockImplementation((action: string) => {
        if (action === 'ConfigRegistryApiService:fetchConfig') {
          return Promise.resolve({ modified: false, data: null, etag: null });
        }
        return undefined as never;
      });

      const subscribeSpy = jest.spyOn(requestMock.initMessenger, 'subscribe');
      ConfigRegistryControllerInit(requestMock);

      expect(mockControllerInstance.startPolling).not.toHaveBeenCalled();

      const stateChangeHandler = subscribeSpy.mock.calls.find(
        (call) => call[0] === 'RemoteFeatureFlagController:stateChange',
      )?.[1] as () => void;
      expect(stateChangeHandler).toBeDefined();

      requestMock.initMessenger.call = jest.fn((action: string) => {
        if (action === 'RemoteFeatureFlagController:getState') {
          return {
            remoteFeatureFlags: { configRegistryApiEnabled: true },
          } as never;
        }
        return undefined as never;
      }) as typeof requestMock.initMessenger.call;

      stateChangeHandler();
      jest.runAllTimers();

      expect(callSpy).toHaveBeenCalledWith(
        'ConfigRegistryApiService:fetchConfig',
        {},
      );
      expect(mockControllerInstance.startPolling).toHaveBeenCalledWith(null);
      jest.useRealTimers();
    });

    it('does not trigger fetch when stateChange fires but controller already has configs', () => {
      jest.useFakeTimers();
      mockControllerInstance.state = {
        configs: { networks: { 'eip155:1': {} as never } },
        version: '1',
        lastFetched: Date.now(),
        etag: null,
      };
      const requestMock = buildInitRequestMock({
        configRegistryApiEnabled: false,
      });
      const callSpy = spyOnControllerMessengerCall(requestMock);

      const subscribeSpy = jest.spyOn(requestMock.initMessenger, 'subscribe');
      ConfigRegistryControllerInit(requestMock);

      const stateChangeHandler = subscribeSpy.mock.calls.find(
        (call) => call[0] === 'RemoteFeatureFlagController:stateChange',
      )?.[1] as () => void;
      requestMock.initMessenger.call = jest.fn((action: string) => {
        if (action === 'RemoteFeatureFlagController:getState') {
          return {
            remoteFeatureFlags: { configRegistryApiEnabled: true },
          } as never;
        }
        return undefined as never;
      }) as typeof requestMock.initMessenger.call;

      stateChangeHandler();
      jest.runAllTimers();

      expect(callSpy).not.toHaveBeenCalledWith(
        'ConfigRegistryApiService:fetchConfig',
        {},
      );
      jest.useRealTimers();
    });
  });
});
