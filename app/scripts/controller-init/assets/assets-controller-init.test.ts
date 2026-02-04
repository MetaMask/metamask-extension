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
    registerDataSources: jest.fn(),
    state: {},
  })),
  initMessengers: jest.fn().mockReturnValue({}),
  initDataSources: jest.fn().mockReturnValue({}),
}));

jest.mock('@metamask/core-backend', () => ({
  createApiPlatformClient: jest.fn().mockReturnValue({}),
}));

function getInitRequestMock(
  options: {
    featureFlagEnabled?: boolean;
    featureVersion?: string | null;
    minimumVersion?: string | null;
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
  } = options;

  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAssetsControllerMessenger(baseMessenger),
    initMessenger: getAssetsControllerInitMessenger(baseMessenger),
  };

  // Mock getController for RemoteFeatureFlagController
  // @ts-expect-error: Partial mock.
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
      };
    }
    throw new Error(`Unexpected controller name: ${controllerName}`);
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
    });
  });

  it('registers data sources with the controller', () => {
    const { controller } = AssetsControllerInit(getInitRequestMock());

    expect(controller.registerDataSources).toHaveBeenCalledWith([
      'BackendWebsocketDataSource',
      'AccountsApiDataSource',
      'RpcDataSource',
      'SnapDataSource',
      'TokenDataSource',
      'PriceDataSource',
      'DetectionMiddleware',
    ]);
  });

  it('uses persisted state when available', () => {
    const persistedState = {
      AssetsController: {
        assets: { '0x1': { tokens: [] } },
      },
    };

    const requestMock = getInitRequestMock();
    // @ts-expect-error: Partial mock.
    requestMock.persistedState = persistedState;

    AssetsControllerInit(requestMock);

    expect(AssetsController).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: persistedState.AssetsController,
      isEnabled: expect.any(Function),
    });
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

      // @ts-expect-error: Partial mock.
      requestMock.getController.mockImplementation((controllerName) => {
        if (controllerName === 'RemoteFeatureFlagController') {
          return {
            state: {
              remoteFeatureFlags: {},
            },
          };
        }
        throw new Error(`Unexpected controller name: ${controllerName}`);
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

      // Suppress console.warn for this test
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      AssetsControllerInit(requestMock);

      const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
      const isEnabled = constructorCall.isEnabled as () => boolean;

      expect(isEnabled()).toBe(false);
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });
});
