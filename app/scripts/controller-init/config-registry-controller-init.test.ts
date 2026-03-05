import {
  ConfigRegistryController,
  ConfigRegistryApiService,
  type ConfigRegistryControllerState,
} from '@metamask/config-registry-controller';
import { getDefaultConfigRegistryControllerState } from '../../../shared/modules/config-registry-utils';
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
      stopAllPolling: jest.fn(),
      state: getDefaultConfigRegistryControllerState(),
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
      requestMock.persistedState.ConfigRegistryController = mockPersistedState;

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
});
