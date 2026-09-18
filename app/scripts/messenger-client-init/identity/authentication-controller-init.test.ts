import { Controller as AuthenticationController } from '@metamask/profile-sync-controller/auth';
import { Env } from '@metamask/profile-sync-controller/sdk';
import type { FeatureFlags } from '@metamask/remote-feature-flag-controller';
import { BFT_CHILD_PREFERENCES } from '../../../../shared/lib/basic-functionality-consolidation';
import { getManifestFlags } from '../../../../shared/lib/manifestFlags';
import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import {
  getAuthenticationControllerMessenger,
  AuthenticationControllerMessenger,
  AuthenticationControllerInitMessenger,
} from '../messengers/identity';
import { getRootMessenger } from '../../lib/messenger';
import { AuthenticationControllerInit } from './authentication-controller-init';

jest.mock('@metamask/profile-sync-controller/auth');
jest.mock('../../../../shared/lib/manifestFlags');

const mockGetManifestFlags = jest.mocked(getManifestFlags);

function buildChildPreferences(alignedWithBasicFunctionality: boolean) {
  return Object.fromEntries(
    BFT_CHILD_PREFERENCES.map((preference) => [
      preference,
      alignedWithBasicFunctionality,
    ]),
  );
}

function buildInitRequestMock({
  useExternalServices = true,
  isBasicFunctionalityConsolidatedEnabled = false,
  mixedChildren = false,
  remoteFeatureFlags = {},
}: {
  useExternalServices?: boolean;
  isBasicFunctionalityConsolidatedEnabled?: boolean;
  mixedChildren?: boolean;
  remoteFeatureFlags?: FeatureFlags;
} = {}): jest.Mocked<
  MessengerClientInitRequest<
    AuthenticationControllerMessenger,
    AuthenticationControllerInitMessenger
  >
> {
  const baseControllerMessenger = getRootMessenger();

  const preferencesState = {
    useExternalServices,
    ...buildChildPreferences(useExternalServices),
    ...(mixedChildren
      ? { [BFT_CHILD_PREFERENCES[0]]: !useExternalServices }
      : {}),
    preferences: {
      isBasicFunctionalityConsolidatedEnabled,
    },
  };

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAuthenticationControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: {
      call: jest.fn((action: string) => {
        if (action === 'RemoteFeatureFlagController:getState') {
          return { remoteFeatureFlags: { ...remoteFeatureFlags } };
        }
        if (action === 'AnalyticsController:getState') {
          return { analyticsId: 'test-id' };
        }
        throw new Error(`Unexpected init messenger action: ${action}`);
      }),
    } as unknown as AuthenticationControllerInitMessenger,
  };

  requestMock.getMessengerClient.mockImplementation((name) => {
    if (name === 'PreferencesController') {
      return { state: preferencesState } as never;
    }
    throw new Error(`Unexpected messenger client: ${name}`);
  });

  return requestMock;
}

function getIsSocialPairingEnabled() {
  return jest.mocked(AuthenticationController).mock.calls[0][0].config
    ?.isSocialPairingEnabled;
}

describe('AuthenticationControllerInit', () => {
  const AuthenticationControllerClassMock = jest.mocked(
    AuthenticationController,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetManifestFlags.mockReturnValue({
      remoteFeatureFlags: {},
    });
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      AuthenticationControllerInit(requestMock).messengerClient,
    ).toBeInstanceOf(AuthenticationController);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    AuthenticationControllerInit(requestMock);

    expect(AuthenticationControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.AuthenticationController,
      metametrics: {
        getMetaMetricsId: expect.any(Function),
        agent: 'extension',
        getAppVersion: expect.any(Function),
      },
      config: {
        env: Env.PRD,
        isSocialPairingEnabled: expect.any(Function),
      },
    });
  });

  it('does not evaluate isSocialPairingEnabled at init', () => {
    const requestMock = buildInitRequestMock();
    AuthenticationControllerInit(requestMock);

    expect(requestMock.initMessenger.call).not.toHaveBeenCalledWith(
      'RemoteFeatureFlagController:getState',
    );
    expect(requestMock.getMessengerClient).toHaveBeenCalledWith(
      'PreferencesController',
    );
  });

  it('returns false when the remote flag is off and there is no cohort', () => {
    AuthenticationControllerInit(
      buildInitRequestMock({
        remoteFeatureFlags: { extensionBasicFunctionalityToggle: false },
      }),
    );

    expect(getIsSocialPairingEnabled()?.()).toBe(false);
  });

  it('returns true when the cohort marker is set and the remote flag is off', () => {
    AuthenticationControllerInit(
      buildInitRequestMock({
        isBasicFunctionalityConsolidatedEnabled: true,
        remoteFeatureFlags: { extensionBasicFunctionalityToggle: false },
      }),
    );

    expect(getIsSocialPairingEnabled()?.()).toBe(true);
  });

  it('returns true when the remote flag is on and prefs are consistent all-on', () => {
    AuthenticationControllerInit(
      buildInitRequestMock({
        remoteFeatureFlags: { extensionBasicFunctionalityToggle: true },
      }),
    );

    expect(getIsSocialPairingEnabled()?.()).toBe(true);
  });

  it('returns false when the remote flag is on, prefs are mixed, and there is no cohort', () => {
    AuthenticationControllerInit(
      buildInitRequestMock({
        mixedChildren: true,
        remoteFeatureFlags: { extensionBasicFunctionalityToggle: true },
      }),
    );

    expect(getIsSocialPairingEnabled()?.()).toBe(false);
  });

  it('returns true when a manifest override turns the remote flag on', () => {
    mockGetManifestFlags.mockReturnValue({
      remoteFeatureFlags: { extensionBasicFunctionalityToggle: true },
    });

    AuthenticationControllerInit(
      buildInitRequestMock({
        remoteFeatureFlags: { extensionBasicFunctionalityToggle: false },
      }),
    );

    expect(getIsSocialPairingEnabled()?.()).toBe(true);
  });

  it('wires getAppVersion to process.env.METAMASK_VERSION', () => {
    const originalVersion = process.env.METAMASK_VERSION;
    process.env.METAMASK_VERSION = '12.34.5';

    try {
      const requestMock = buildInitRequestMock();
      AuthenticationControllerInit(requestMock);

      const constructorArgs =
        AuthenticationControllerClassMock.mock.calls[0][0];
      expect(constructorArgs.metametrics.getAppVersion?.()).toBe('12.34.5');
    } finally {
      process.env.METAMASK_VERSION = originalVersion;
    }
  });

  it('returns undefined from getAppVersion when METAMASK_VERSION is unset', () => {
    const originalVersion = process.env.METAMASK_VERSION;
    delete process.env.METAMASK_VERSION;

    try {
      const requestMock = buildInitRequestMock();
      AuthenticationControllerInit(requestMock);

      const constructorArgs =
        AuthenticationControllerClassMock.mock.calls[0][0];
      expect(constructorArgs.metametrics.getAppVersion?.()).toBeUndefined();
    } finally {
      process.env.METAMASK_VERSION = originalVersion;
    }
  });
});
