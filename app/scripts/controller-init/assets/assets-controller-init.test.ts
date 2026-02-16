import { AssetsController } from '@metamask/assets-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import { getRootMessenger } from '../../lib/messenger';
import {
  getAssetsControllerMessenger,
  getAssetsControllerInitMessenger,
  AssetsControllerMessenger,
  AssetsControllerInitMessenger,
} from '../messengers/assets/assets-controller-messenger';
import { ASSETS_UNIFY_STATE_VERSION_1 } from '../../../../shared/lib/assets-unify-state/remote-feature-flag';
import { AssetsControllerInit } from './assets-controller-init';

jest.mock('@metamask/assets-controller', () => ({
  ...jest.requireActual('@metamask/assets-controller'),
  AssetsController: jest.fn().mockImplementation(() => ({
    state: {},
  })),
}));

jest.mock('@metamask/core-backend', () => ({
  createApiPlatformClient: jest.fn().mockReturnValue({ mockApiClient: true }),
}));

function getInitRequestMock(
  options: {
    featureFlagEnabled?: boolean;
    featureVersion?: string | null;
    minimumVersion?: string | null;
    useTokenDetection?: boolean;
  } = {},
): jest.Mocked<
  ControllerInitRequest<
    AssetsControllerMessenger,
    AssetsControllerInitMessenger
  >
> {
  const {
    featureFlagEnabled = false,
    featureVersion = ASSETS_UNIFY_STATE_VERSION_1,
    minimumVersion = null,
    useTokenDetection = true,
  } = options;

  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAssetsControllerMessenger(baseMessenger),
    initMessenger: getAssetsControllerInitMessenger(baseMessenger),
  };

  // Mock getController for RemoteFeatureFlagController
  requestMock.getController.mockImplementation((controllerName) => {
    if (controllerName === 'RemoteFeatureFlagController') {
      return {
        state: {
          remoteFeatureFlags: {
            assetsUnifyState: {
              enabled: featureFlagEnabled,
              featureVersion,
              minimumVersion,
            },
          },
        },
      } as unknown as ReturnType<typeof requestMock.getController>;
    }
    throw new Error(`Unexpected controller name: ${controllerName}`);
  });

  // Mock initMessenger.call for PreferencesController
  requestMock.initMessenger.call = jest.fn().mockImplementation((action) => {
    if (action === 'PreferencesController:getState') {
      return { useTokenDetection };
    }
    if (action === 'AuthenticationController:getBearerToken') {
      return Promise.resolve('mock-bearer-token');
    }
    throw new Error(`Unexpected action: ${action}`);
  });

  return requestMock;
}

describe('AssetsControllerInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the controller', () => {
    const { controller } = AssetsControllerInit(getInitRequestMock());
    expect(controller).toBeDefined();
  });

  it('creates AssetsController with correct parameters', () => {
    const requestMock = getInitRequestMock();
    AssetsControllerInit(requestMock);

    expect(AssetsController).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      isEnabled: expect.any(Function),
      queryApiClient: expect.any(Object),
      rpcDataSourceConfig: { tokenDetectionEnabled: true },
    });
  });

  it('uses persisted state when available', () => {
    const persistedState = {
      AssetsController: {
        assetsMetadata: {},
        assetsBalance: {},
        assetsPrice: {},
      },
    };

    const requestMock = getInitRequestMock();
    requestMock.persistedState = persistedState;

    AssetsControllerInit(requestMock);

    expect(AssetsController).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: persistedState.AssetsController,
      isEnabled: expect.any(Function),
      queryApiClient: expect.any(Object),
      rpcDataSourceConfig: { tokenDetectionEnabled: true },
    });
  });

  it('passes tokenDetectionEnabled from preferences', () => {
    const requestMock = getInitRequestMock({ useTokenDetection: false });
    AssetsControllerInit(requestMock);

    expect(AssetsController).toHaveBeenCalledWith(
      expect.objectContaining({
        rpcDataSourceConfig: { tokenDetectionEnabled: false },
      }),
    );
  });

  it('defaults tokenDetectionEnabled to true when preferences call fails', () => {
    const requestMock = getInitRequestMock();
    requestMock.initMessenger.call = jest.fn().mockImplementation((action) => {
      if (action === 'PreferencesController:getState') {
        throw new Error('Failed to get preferences');
      }
      if (action === 'AuthenticationController:getBearerToken') {
        return Promise.resolve('mock-bearer-token');
      }
      throw new Error(`Unexpected action: ${action}`);
    });

    AssetsControllerInit(requestMock);

    expect(AssetsController).toHaveBeenCalledWith(
      expect.objectContaining({
        rpcDataSourceConfig: { tokenDetectionEnabled: true },
      }),
    );
  });

  describe('isEnabled function', () => {
    it('returns true when feature flag is enabled with correct version', () => {
      const requestMock = getInitRequestMock({
        featureFlagEnabled: true,
        featureVersion: ASSETS_UNIFY_STATE_VERSION_1,
      });

      AssetsControllerInit(requestMock);

      // Get the isEnabled function that was passed to the controller
      const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
      const isEnabled = constructorCall.isEnabled as () => boolean;

      expect(isEnabled()).toBe(true);
    });

    it('returns false when feature flag is disabled', () => {
      const requestMock = getInitRequestMock({
        featureFlagEnabled: false,
      });

      AssetsControllerInit(requestMock);

      const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
      const isEnabled = constructorCall.isEnabled as () => boolean;

      expect(isEnabled()).toBe(false);
    });

    it('returns false when feature version does not match', () => {
      const requestMock = getInitRequestMock({
        featureFlagEnabled: true,
        featureVersion: '999', // Wrong version
      });

      AssetsControllerInit(requestMock);

      const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
      const isEnabled = constructorCall.isEnabled as () => boolean;

      expect(isEnabled()).toBe(false);
    });

    it('returns false when feature flag is not present', () => {
      const baseMessenger = getRootMessenger<never, never>();

      const requestMock = {
        ...buildControllerInitRequestMock(),
        controllerMessenger: getAssetsControllerMessenger(baseMessenger),
        initMessenger: getAssetsControllerInitMessenger(baseMessenger),
      };

      requestMock.getController.mockImplementation((controllerName) => {
        if (controllerName === 'RemoteFeatureFlagController') {
          return {
            state: {
              remoteFeatureFlags: {},
            },
          } as unknown as ReturnType<typeof requestMock.getController>;
        }
        throw new Error(`Unexpected controller name: ${controllerName}`);
      });

      // Mock initMessenger.call
      requestMock.initMessenger.call = jest
        .fn()
        .mockImplementation((action) => {
          if (action === 'PreferencesController:getState') {
            return { useTokenDetection: true };
          }
          if (action === 'AuthenticationController:getBearerToken') {
            return Promise.resolve('mock-bearer-token');
          }
          throw new Error(`Unexpected action: ${action}`);
        });

      AssetsControllerInit(requestMock);

      const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
      const isEnabled = constructorCall.isEnabled as () => boolean;

      expect(isEnabled()).toBe(false);
    });

    it('returns false when getController throws an error', () => {
      const baseMessenger = getRootMessenger<never, never>();

      const requestMock = {
        ...buildControllerInitRequestMock(),
        controllerMessenger: getAssetsControllerMessenger(baseMessenger),
        initMessenger: getAssetsControllerInitMessenger(baseMessenger),
      };

      requestMock.getController.mockImplementation(() => {
        throw new Error('Controller not found');
      });

      // Mock initMessenger.call
      requestMock.initMessenger.call = jest
        .fn()
        .mockImplementation((action) => {
          if (action === 'PreferencesController:getState') {
            return { useTokenDetection: true };
          }
          if (action === 'AuthenticationController:getBearerToken') {
            return Promise.resolve('mock-bearer-token');
          }
          throw new Error(`Unexpected action: ${action}`);
        });

      AssetsControllerInit(requestMock);

      const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
      const isEnabled = constructorCall.isEnabled as () => boolean;

      expect(isEnabled()).toBe(false);
    });
  });
});
