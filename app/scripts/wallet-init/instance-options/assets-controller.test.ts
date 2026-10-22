import { createApiPlatformClient } from '@metamask/core-backend';
import { ASSETS_UNIFY_STATE_FLAG } from '../../../../shared/lib/assets-unify-state/remote-feature-flag';
import { traceAsControllerCallback } from '../../../../shared/lib/trace';
import { getRootMessenger } from '../../lib/messenger';
import {
  getAssetsControllerInitMessenger,
  getAssetsControllerMessenger,
  type AssetsControllerInitMessenger,
} from '../../messenger-client-init/messengers/assets/assets-controller-messenger';
import type { MessengerClientPersistedState } from '../../messenger-client-init/types';
import { getAssetsControllerInstanceOptions } from './assets-controller';

jest.mock('../../../../shared/lib/trace', () => ({
  traceAsControllerCallback: jest.fn((_req, fn) =>
    Promise.resolve(fn?.('traced-context')),
  ),
}));

jest.mock('@metamask/core-backend', () => ({
  createApiPlatformClient: jest.fn().mockReturnValue({ mockApiClient: true }),
}));

function buildRequest({
  completedOnboarding = true,
  useExternalServices = true,
  useTokenDetection = true,
  remoteFeatureFlags = {},
}: {
  completedOnboarding?: boolean;
  useExternalServices?: boolean;
  useTokenDetection?: boolean;
  remoteFeatureFlags?: Record<string, unknown>;
} = {}) {
  const rootMessenger = getRootMessenger<never, never>();
  const initMessenger = getAssetsControllerInitMessenger(rootMessenger);
  const controllerMessenger = getAssetsControllerMessenger(rootMessenger);

  initMessenger.call = jest.fn().mockImplementation((action: string) => {
    if (action === 'OnboardingController:getState') {
      return { completedOnboarding };
    }
    if (action === 'PreferencesController:getState') {
      return { useExternalServices, useTokenDetection };
    }
    if (action === 'AuthenticationController:getBearerToken') {
      return Promise.resolve('mock-bearer-token');
    }
    if (action === 'RemoteFeatureFlagController:getState') {
      return { remoteFeatureFlags };
    }
    throw new Error(`Unexpected action: ${action}`);
  }) as AssetsControllerInitMessenger['call'];

  return {
    controllerMessenger,
    getIsUiOpen: jest.fn(() => true),
    initMessenger,
    persistedState: {} as MessengerClientPersistedState,
  };
}

describe('getAssetsControllerInstanceOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('supplies a queryApiClient', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
      const freshModule = require('./assets-controller') as any;
      const options =
        freshModule.getAssetsControllerInstanceOptions(buildRequest());

      expect(options.queryApiClient).toEqual({ mockApiClient: true });
    });

    expect(createApiPlatformClient).toHaveBeenCalledWith(
      expect.objectContaining({
        clientProduct: 'metamask-extension',
        clientVersion: process.env.METAMASK_VERSION,
        getBearerToken: expect.any(Function),
      }),
    );
  });

  it('reports basic functionality as off before onboarding completes', () => {
    const options = getAssetsControllerInstanceOptions(
      buildRequest({ completedOnboarding: false, useExternalServices: true }),
    );

    expect(options.isBasicFunctionality?.()).toBe(false);
  });

  it('reads useExternalServices after onboarding completes', () => {
    const options = getAssetsControllerInstanceOptions(
      buildRequest({ completedOnboarding: true, useExternalServices: false }),
    );

    expect(options.isBasicFunctionality?.()).toBe(false);
  });

  it('reports the account as not onboarded when setup is incomplete', () => {
    const options = getAssetsControllerInstanceOptions(
      buildRequest({ completedOnboarding: false }),
    );

    expect(options.isOnboarded?.()).toBe(false);
  });

  it('uses the UI-open callback for isEnabled', () => {
    const request = buildRequest();
    request.getIsUiOpen.mockReturnValueOnce(false);
    const options = getAssetsControllerInstanceOptions(request);

    expect(options.isEnabled?.()).toBe(false);
    expect(request.getIsUiOpen).toHaveBeenCalledTimes(1);
  });

  it('skips Sentry tracing when assetsUnifyState.tracesEnabled is off', async () => {
    const options = getAssetsControllerInstanceOptions(buildRequest());
    const fn = jest.fn(() => 'result');

    await expect(
      options.trace?.({ name: 'AssetsControllerFirstInitFetch' }, fn),
    ).resolves.toBe('result');

    expect(fn).toHaveBeenCalledWith();
    expect(traceAsControllerCallback).not.toHaveBeenCalled();
  });

  it('forwards tracing when assetsUnifyState.tracesEnabled is on', async () => {
    const options = getAssetsControllerInstanceOptions(
      buildRequest({
        remoteFeatureFlags: {
          [ASSETS_UNIFY_STATE_FLAG]: { tracesEnabled: true },
        },
      }),
    );
    const fn = jest.fn(() => 'result');
    const request = { name: 'AssetsControllerFirstInitFetch' };

    await expect(options.trace?.(request, fn)).resolves.toBe('result');

    expect(traceAsControllerCallback).toHaveBeenCalledWith(request, fn);
  });
});
