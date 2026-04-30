import { AssetsController } from '@metamask/assets-controller';
import { createApiPlatformClient } from '@metamask/core-backend';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import { getRootMessenger } from '../../lib/messenger';
import {
  getAssetsControllerMessenger,
  getAssetsControllerInitMessenger,
  AssetsControllerMessenger,
  AssetsControllerInitMessenger,
} from '../messengers/assets/assets-controller-messenger';
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
    useTokenDetection?: boolean;
    completedOnboarding?: boolean;
  } = {},
): jest.Mocked<
  MessengerClientInitRequest<
    AssetsControllerMessenger,
    AssetsControllerInitMessenger
  >
> {
  const { useTokenDetection = true, completedOnboarding = true } = options;

  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAssetsControllerMessenger(baseMessenger),
    initMessenger: getAssetsControllerInitMessenger(baseMessenger),
  };

  requestMock.initMessenger.call = jest.fn().mockImplementation((action) => {
    if (action === 'OnboardingController:getState') {
      return { completedOnboarding };
    }
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

/**
 * Builds a test setup that also exposes the base messenger so tests can
 * publish events and exercise the subscriber callbacks registered by
 * `subscribeToBasicFunctionalityChange`.
 *
 * @param options - Test configuration options.
 * @param options.completedOnboarding - Whether onboarding is completed (default: true).
 * @param options.useExternalServices - Whether external services are enabled (default: true).
 * @returns The base messenger and the init request mock.
 */
function buildSubscribeTestSetup(
  options: {
    completedOnboarding?: boolean;
    useExternalServices?: boolean;
  } = {},
) {
  const completedOnboarding = options.completedOnboarding ?? true;
  const useExternalServices = options.useExternalServices ?? true;

  const baseMessenger = getRootMessenger<never, never>();
  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAssetsControllerMessenger(baseMessenger),
    initMessenger: getAssetsControllerInitMessenger(baseMessenger),
  };

  requestMock.initMessenger.call = jest.fn().mockImplementation((action) => {
    if (action === 'OnboardingController:getState') {
      return { completedOnboarding };
    }
    if (action === 'PreferencesController:getState') {
      return { useExternalServices };
    }
    if (action === 'AuthenticationController:getBearerToken') {
      return Promise.resolve('mock-bearer-token');
    }
    throw new Error(`Unexpected action: ${action}`);
  });

  return { baseMessenger, requestMock };
}

describe('AssetsControllerInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the controller', () => {
    const { messengerClient } = AssetsControllerInit(getInitRequestMock());
    expect(messengerClient).toBeDefined();
  });

  it('creates AssetsController with correct parameters', () => {
    const requestMock = getInitRequestMock();
    AssetsControllerInit(requestMock);

    expect(AssetsController).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      isEnabled: expect.any(Function),
      isBasicFunctionality: expect.any(Function),
      subscribeToBasicFunctionalityChange: expect.any(Function),
      queryApiClient: expect.any(Object),
      rpcDataSourceConfig: {
        tokenDetectionEnabled: expect.any(Function),
        balanceInterval: 30_000,
        detectionInterval: 180_000,
      },
      priceDataSourceConfig: { pollInterval: 180_000 },
      stakedBalanceDataSourceConfig: {
        pollInterval: 30_000,
        enabled: false,
      },
      trace: expect.any(Function),
      isOnboarded: expect.any(Function),
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
      isBasicFunctionality: expect.any(Function),
      subscribeToBasicFunctionalityChange: expect.any(Function),
      queryApiClient: expect.any(Object),
      rpcDataSourceConfig: {
        tokenDetectionEnabled: expect.any(Function),
        balanceInterval: 30_000,
        detectionInterval: 180_000,
      },
      priceDataSourceConfig: { pollInterval: 180_000 },
      stakedBalanceDataSourceConfig: {
        pollInterval: 30_000,
        enabled: false,
      },
      trace: expect.any(Function),
      isOnboarded: expect.any(Function),
    });
  });

  it('passes tokenDetectionEnabled from preferences', () => {
    const requestMock = getInitRequestMock({ useTokenDetection: false });
    AssetsControllerInit(requestMock);

    const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
    const config = constructorCall.rpcDataSourceConfig;
    if (!config?.tokenDetectionEnabled) {
      throw new Error('Expected rpcDataSourceConfig.tokenDetectionEnabled');
    }
    const tokenDetectionEnabledGetter = config.tokenDetectionEnabled;

    expect(typeof tokenDetectionEnabledGetter).toBe('function');
    expect(tokenDetectionEnabledGetter()).toBe(false);
  });

  it('defaults tokenDetectionEnabled to true when useTokenDetection is absent from preferences state', () => {
    const requestMock = getInitRequestMock();
    requestMock.initMessenger.call = jest.fn().mockImplementation((action) => {
      if (action === 'OnboardingController:getState') {
        return { completedOnboarding: true };
      }
      if (action === 'PreferencesController:getState') {
        // useTokenDetection intentionally absent
        return {};
      }
      if (action === 'AuthenticationController:getBearerToken') {
        return Promise.resolve('mock-bearer-token');
      }
      throw new Error(`Unexpected action: ${action}`);
    });

    AssetsControllerInit(requestMock);

    const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
    const config = constructorCall.rpcDataSourceConfig;
    if (!config?.tokenDetectionEnabled) {
      throw new Error('Expected rpcDataSourceConfig.tokenDetectionEnabled');
    }

    expect(config.tokenDetectionEnabled()).toBe(true);
  });

  it('defaults tokenDetectionEnabled to true when preferences call fails', () => {
    const requestMock = getInitRequestMock();
    requestMock.initMessenger.call = jest.fn().mockImplementation((action) => {
      if (action === 'OnboardingController:getState') {
        return { completedOnboarding: true };
      }
      if (action === 'PreferencesController:getState') {
        throw new Error('Failed to get preferences');
      }
      if (action === 'AuthenticationController:getBearerToken') {
        return Promise.resolve('mock-bearer-token');
      }
      throw new Error(`Unexpected action: ${action}`);
    });

    AssetsControllerInit(requestMock);

    const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
    const config = constructorCall.rpcDataSourceConfig;
    if (!config?.tokenDetectionEnabled) {
      throw new Error('Expected rpcDataSourceConfig.tokenDetectionEnabled');
    }
    const tokenDetectionEnabledGetter = config.tokenDetectionEnabled;

    expect(typeof tokenDetectionEnabledGetter).toBe('function');
    expect(tokenDetectionEnabledGetter()).toBe(true);
  });

  describe('isEnabled', () => {
    it('always returns true', () => {
      AssetsControllerInit(getInitRequestMock());

      const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
      const isEnabled = constructorCall.isEnabled as () => boolean;

      expect(isEnabled()).toBe(true);
    });
  });

  describe('isBasicFunctionality function', () => {
    it('returns false during onboarding', () => {
      const requestMock = getInitRequestMock({ completedOnboarding: false });
      AssetsControllerInit(requestMock);

      const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
      const isBasicFunctionality =
        constructorCall.isBasicFunctionality as () => boolean;

      expect(isBasicFunctionality()).toBe(false);
    });

    it('returns useExternalServices value after onboarding completes', () => {
      const requestMock = getInitRequestMock({ completedOnboarding: true });
      requestMock.initMessenger.call = jest
        .fn()
        .mockImplementation((action) => {
          if (action === 'OnboardingController:getState') {
            return { completedOnboarding: true };
          }
          if (action === 'PreferencesController:getState') {
            return { useExternalServices: false };
          }
          if (action === 'AuthenticationController:getBearerToken') {
            return Promise.resolve('mock-bearer-token');
          }
          throw new Error(`Unexpected action: ${action}`);
        });

      AssetsControllerInit(requestMock);

      const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
      const isBasicFunctionality =
        constructorCall.isBasicFunctionality as () => boolean;

      expect(isBasicFunctionality()).toBe(false);
    });

    it('returns true when useExternalServices is true after onboarding', () => {
      const requestMock = getInitRequestMock({ completedOnboarding: true });
      requestMock.initMessenger.call = jest
        .fn()
        .mockImplementation((action) => {
          if (action === 'OnboardingController:getState') {
            return { completedOnboarding: true };
          }
          if (action === 'PreferencesController:getState') {
            return { useExternalServices: true };
          }
          if (action === 'AuthenticationController:getBearerToken') {
            return Promise.resolve('mock-bearer-token');
          }
          throw new Error(`Unexpected action: ${action}`);
        });

      AssetsControllerInit(requestMock);

      const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
      const isBasicFunctionality =
        constructorCall.isBasicFunctionality as () => boolean;

      expect(isBasicFunctionality()).toBe(true);
    });

    it('defaults to true when OnboardingController call throws', () => {
      const requestMock = getInitRequestMock();
      requestMock.initMessenger.call = jest
        .fn()
        .mockImplementation((action) => {
          if (action === 'OnboardingController:getState') {
            throw new Error('Failed to get onboarding state');
          }
          if (action === 'PreferencesController:getState') {
            return { useExternalServices: false };
          }
          if (action === 'AuthenticationController:getBearerToken') {
            return Promise.resolve('mock-bearer-token');
          }
          throw new Error(`Unexpected action: ${action}`);
        });

      AssetsControllerInit(requestMock);

      const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
      const isBasicFunctionality =
        constructorCall.isBasicFunctionality as () => boolean;

      expect(isBasicFunctionality()).toBe(true);
    });

    it('defaults to true when useExternalServices is absent from preferences state', () => {
      const requestMock = getInitRequestMock({ completedOnboarding: true });
      requestMock.initMessenger.call = jest
        .fn()
        .mockImplementation((action) => {
          if (action === 'OnboardingController:getState') {
            return { completedOnboarding: true };
          }
          if (action === 'PreferencesController:getState') {
            // useExternalServices intentionally absent
            return {};
          }
          if (action === 'AuthenticationController:getBearerToken') {
            return Promise.resolve('mock-bearer-token');
          }
          throw new Error(`Unexpected action: ${action}`);
        });

      AssetsControllerInit(requestMock);

      const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
      const isBasicFunctionality =
        constructorCall.isBasicFunctionality as () => boolean;

      expect(isBasicFunctionality()).toBe(true);
    });
  });

  describe('isOnboarded function', () => {
    it('returns true when onboarding is completed', () => {
      const requestMock = getInitRequestMock({ completedOnboarding: true });
      AssetsControllerInit(requestMock);

      const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
      const isOnboarded = constructorCall.isOnboarded as () => boolean;

      expect(isOnboarded()).toBe(true);
    });

    it('returns false when onboarding is not completed', () => {
      const requestMock = getInitRequestMock({ completedOnboarding: false });
      AssetsControllerInit(requestMock);

      const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
      const isOnboarded = constructorCall.isOnboarded as () => boolean;

      expect(isOnboarded()).toBe(false);
    });

    it('returns false when OnboardingController call throws', () => {
      const requestMock = getInitRequestMock();
      requestMock.initMessenger.call = jest
        .fn()
        .mockImplementation((action) => {
          if (action === 'OnboardingController:getState') {
            throw new Error('Failed to get onboarding state');
          }
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
      const isOnboarded = constructorCall.isOnboarded as () => boolean;

      expect(isOnboarded()).toBe(false);
    });
  });

  describe('queryApiClient', () => {
    it('creates the API client with correct clientProduct', () => {
      // Use jest.isolateModules so assets-controller-init gets a fresh module
      // instance with apiClient = null, guaranteeing createApiPlatformClient is called.
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
        const freshModule = require('./assets-controller-init') as any;
        freshModule.AssetsControllerInit(getInitRequestMock());
      });

      expect(createApiPlatformClient).toHaveBeenCalledWith({
        clientProduct: 'metamask-extension',
        getBearerToken: expect.any(Function),
      });
    });

    it('reuses the cached API client across multiple init calls', () => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
        const freshModule = require('./assets-controller-init') as any;
        freshModule.AssetsControllerInit(getInitRequestMock());
        freshModule.AssetsControllerInit(getInitRequestMock());
      });

      expect(createApiPlatformClient).toHaveBeenCalledTimes(1);
    });

    it('getBearerToken resolves with the bearer token on success', async () => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
        const freshModule = require('./assets-controller-init') as any;
        freshModule.AssetsControllerInit(getInitRequestMock());
      });

      const callArgs = jest.mocked(createApiPlatformClient).mock.calls[0];
      if (!callArgs) {
        throw new Error('Expected createApiPlatformClient to have been called');
      }
      const { getBearerToken } = callArgs[0];
      if (!getBearerToken) {
        throw new Error('Expected getBearerToken to be defined');
      }
      expect(await getBearerToken()).toBe('mock-bearer-token');
    });

    it('getBearerToken returns undefined when authentication throws', async () => {
      const requestMock = getInitRequestMock();
      requestMock.initMessenger.call = jest
        .fn()
        .mockImplementation((action) => {
          if (action === 'OnboardingController:getState') {
            return { completedOnboarding: true };
          }
          if (action === 'PreferencesController:getState') {
            return { useTokenDetection: true };
          }
          if (action === 'AuthenticationController:getBearerToken') {
            return Promise.reject(new Error('Auth failed'));
          }
          throw new Error(`Unexpected action: ${action}`);
        });

      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
        const freshModule = require('./assets-controller-init') as any;
        freshModule.AssetsControllerInit(requestMock);
      });

      const callArgs = jest.mocked(createApiPlatformClient).mock.calls[0];
      if (!callArgs) {
        throw new Error('Expected createApiPlatformClient to have been called');
      }
      const { getBearerToken } = callArgs[0];
      if (!getBearerToken) {
        throw new Error('Expected getBearerToken to be defined');
      }
      expect(await getBearerToken()).toBeUndefined();
    });
  });

  describe('subscribeToBasicFunctionalityChange function', () => {
    /**
     * Replaces the real `subscribe` on both messengers with jest mocks so tests
     * can capture the registered listener functions and invoke them directly,
     * bypassing the messenger's namespace-prefixed publish restriction.
     *
     * @param requestMock - The init request mock whose messenger subscribe methods will be replaced.
     * @returns A map from event name to the captured listener function.
     */
    function captureSubscribeListeners(
      requestMock: ReturnType<typeof buildSubscribeTestSetup>['requestMock'],
    ) {
      const listeners: Record<string, (selectedValue: unknown) => void> = {};

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (requestMock.controllerMessenger as any).subscribe = jest
        .fn()
        .mockImplementation((event: string, listener: (v: unknown) => void) => {
          listeners[event] = listener;
        });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (requestMock.initMessenger as any).subscribe = jest
        .fn()
        .mockImplementation((event: string, listener: (v: unknown) => void) => {
          listeners[event] = listener;
        });

      return listeners;
    }

    it('calls onChange with isBasicFunctionality() when PreferencesController state changes', () => {
      const { requestMock } = buildSubscribeTestSetup({
        completedOnboarding: true,
        useExternalServices: true,
      });
      const listeners = captureSubscribeListeners(requestMock);

      AssetsControllerInit(requestMock);

      const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
      const subscribeToBasicFunctionalityChange =
        constructorCall.subscribeToBasicFunctionalityChange as (
          onChange: (value: boolean) => void,
        ) => void;

      const onChange = jest.fn();
      subscribeToBasicFunctionalityChange(onChange);

      // Invoke the captured listener with the selector's output value.
      // The listener ignores the argument and calls isBasicFunctionality(),
      // which (via the mock) returns true (onboarded + useExternalServices=true).
      listeners['PreferencesController:stateChange'](false);

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('calls onChange with isBasicFunctionality() when onboarding completes', () => {
      const { requestMock } = buildSubscribeTestSetup({
        completedOnboarding: true,
        useExternalServices: true,
      });
      const listeners = captureSubscribeListeners(requestMock);

      AssetsControllerInit(requestMock);

      const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
      const subscribeToBasicFunctionalityChange =
        constructorCall.subscribeToBasicFunctionalityChange as (
          onChange: (value: boolean) => void,
        ) => void;

      const onChange = jest.fn();
      subscribeToBasicFunctionalityChange(onChange);

      // Invoke the OnboardingController listener with completedOnboarding=true;
      // the if-guard is satisfied so onChange receives isBasicFunctionality()=true.
      listeners['OnboardingController:stateChange'](true);

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('does not call onChange when OnboardingController stateChange fires with completedOnboarding=false', () => {
      const { requestMock } = buildSubscribeTestSetup({
        completedOnboarding: false,
        useExternalServices: true,
      });
      const listeners = captureSubscribeListeners(requestMock);

      AssetsControllerInit(requestMock);

      const constructorCall = jest.mocked(AssetsController).mock.calls[0][0];
      const subscribeToBasicFunctionalityChange =
        constructorCall.subscribeToBasicFunctionalityChange as (
          onChange: (value: boolean) => void,
        ) => void;

      const onChange = jest.fn();
      subscribeToBasicFunctionalityChange(onChange);

      // The if (completedOnboarding) guard prevents onChange from being called.
      listeners['OnboardingController:stateChange'](false);

      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
