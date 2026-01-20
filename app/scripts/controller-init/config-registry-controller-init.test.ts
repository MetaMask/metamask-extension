import {
  ConfigRegistryController,
  ConfigRegistryApiService,
  isConfigRegistryApiEnabled,
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

const mockIsConfigRegistryApiEnabled = jest.mocked(isConfigRegistryApiEnabled);
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

describe('ConfigRegistryControllerInit', () => {
  let mockControllerInstance: jest.Mocked<ConfigRegistryController>;

  beforeEach(() => {
    jest.resetAllMocks();

    mockControllerInstance = {
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
      state: {
        configs: { networks: {} },
        version: null,
        lastFetched: null,
        fetchError: null,
        etag: null,
      },
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
      mockIsConfigRegistryApiEnabled.mockReturnValue(false);
      const requestMock = buildInitRequestMock();
      const result = ConfigRegistryControllerInit(requestMock);

      expect(result).toBeDefined();
      expect(result.controller).toBeDefined();
      expect(mockConfigRegistryController).toHaveBeenCalled();
    });

    it('initializes with correct messenger and state', () => {
      mockIsConfigRegistryApiEnabled.mockReturnValue(false);
      const requestMock = buildInitRequestMock();
      const mockPersistedState = {
        configs: { networks: { '0x1': { key: '0x1', value: {} } } },
        version: '1.0.0',
        lastFetched: Date.now(),
        fetchError: null,
        etag: null,
      };
      requestMock.persistedState.ConfigRegistryController = mockPersistedState;

      ConfigRegistryControllerInit(requestMock);

      expect(mockConfigRegistryController).toHaveBeenCalledWith({
        messenger: requestMock.controllerMessenger,
        state: mockPersistedState,
        apiService: expect.any(Object),
      });
    });

    it('uses undefined state when no persisted state', () => {
      mockIsConfigRegistryApiEnabled.mockReturnValue(false);
      const requestMock = buildInitRequestMock();

      ConfigRegistryControllerInit(requestMock);

      expect(mockConfigRegistryController).toHaveBeenCalledWith({
        messenger: requestMock.controllerMessenger,
        state: undefined,
        apiService: expect.any(Object),
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

  describe('polling behavior', () => {
    it('starts polling when feature flag is enabled', () => {
      mockIsConfigRegistryApiEnabled.mockReturnValue(true);
      const requestMock = buildInitRequestMock();

      ConfigRegistryControllerInit(requestMock);

      expect(mockControllerInstance.startPolling).toHaveBeenCalledWith({});
    });

    it('stops polling when feature flag is disabled', () => {
      mockIsConfigRegistryApiEnabled.mockReturnValue(false);
      const requestMock = buildInitRequestMock();

      ConfigRegistryControllerInit(requestMock);

      expect(mockControllerInstance.stopPolling).toHaveBeenCalled();
    });

    it('executes immediate poll when feature flag enabled and no persisted configs', () => {
      mockIsConfigRegistryApiEnabled.mockReturnValue(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockControllerInstance.state as any).configs = { networks: {} };
      const requestMock = buildInitRequestMock();

      ConfigRegistryControllerInit(requestMock);

      expect(mockControllerInstance.startPolling).toHaveBeenCalled();
    });

    it('does not execute immediate poll when feature flag enabled and persisted configs exist', () => {
      mockIsConfigRegistryApiEnabled.mockReturnValue(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockControllerInstance.state as any).configs = {
        networks: {
          '0x1': { key: '0x1', value: {} },
        },
      };
      const requestMock = buildInitRequestMock();

      ConfigRegistryControllerInit(requestMock);

      expect(mockControllerInstance.startPolling).toHaveBeenCalled();
    });
  });

  describe('feature flag subscription', () => {
    it('subscribes to RemoteFeatureFlagController state changes', () => {
      mockIsConfigRegistryApiEnabled.mockReturnValue(false);
      const requestMock = buildInitRequestMock();

      ConfigRegistryControllerInit(requestMock);

      expect(requestMock.initMessenger.subscribe).toHaveBeenCalledWith(
        'RemoteFeatureFlagController:stateChange',
        expect.any(Function),
      );
    });

    it('toggles polling when feature flag changes', () => {
      mockIsConfigRegistryApiEnabled.mockReturnValue(false);
      const requestMock = buildInitRequestMock();
      let subscriptionCallback:
        | ((
            prevState: {
              remoteFeatureFlags?: { configRegistryApiEnabled?: boolean };
            },
            currState: {
              remoteFeatureFlags?: { configRegistryApiEnabled?: boolean };
            },
          ) => boolean)
        | undefined;

      jest
        .spyOn(requestMock.initMessenger, 'subscribe')
        .mockImplementation((event, callback) => {
          if (event === 'RemoteFeatureFlagController:stateChange') {
            subscriptionCallback = callback as typeof subscriptionCallback;
          }
          return jest.fn();
        });

      ConfigRegistryControllerInit(requestMock);

      mockIsConfigRegistryApiEnabled.mockReturnValue(true);
      if (subscriptionCallback) {
        subscriptionCallback(
          { remoteFeatureFlags: { configRegistryApiEnabled: false } },
          { remoteFeatureFlags: { configRegistryApiEnabled: true } },
        );
      }

      expect(mockControllerInstance.startPolling).toHaveBeenCalled();
    });
  });
});
