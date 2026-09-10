import {
  ProfileMetricsController,
  ProfileMetricsControllerMessenger,
} from '@metamask/profile-metrics-controller';
import type { FeatureFlags } from '@metamask/remote-feature-flag-controller';
import { BFT_CHILD_PREFERENCES } from '../../../shared/lib/basic-functionality-consolidation';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getProfileMetricsControllerMessenger,
  type ProfileMetricsControllerInitMessenger,
} from './messengers';
import { ProfileMetricsControllerInit } from './profile-metrics-controller-init';

jest.mock('@metamask/profile-metrics-controller');
jest.mock('../../../shared/lib/manifestFlags');

const mockGetManifestFlags = jest.mocked(getManifestFlags);

function buildChildPreferences(alignedWithBasicFunctionality: boolean) {
  return Object.fromEntries(
    BFT_CHILD_PREFERENCES.map((preference) => [
      preference,
      alignedWithBasicFunctionality,
    ]),
  );
}

function getInitRequestMock({
  optedIn = true,
  pna25Acknowledged = true,
  useExternalServices = true,
  isBasicFunctionalityConsolidatedEnabled = false,
  mixedChildren = false,
  remoteFeatureFlags = {},
}: {
  optedIn?: boolean;
  pna25Acknowledged?: boolean;
  useExternalServices?: boolean;
  isBasicFunctionalityConsolidatedEnabled?: boolean;
  mixedChildren?: boolean;
  remoteFeatureFlags?: FeatureFlags;
} = {}): jest.Mocked<
  MessengerClientInitRequest<
    ProfileMetricsControllerMessenger,
    ProfileMetricsControllerInitMessenger
  >
> {
  const baseMessenger = getRootMessenger<never, never>();

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
    controllerMessenger: getProfileMetricsControllerMessenger(baseMessenger),
    initMessenger: {
      call: jest.fn((action: string) => {
        if (action === 'RemoteFeatureFlagController:getState') {
          return { remoteFeatureFlags: { ...remoteFeatureFlags } };
        }
        throw new Error(`Unexpected init messenger action: ${action}`);
      }),
    } as unknown as ProfileMetricsControllerInitMessenger,
  };

  requestMock.getMessengerClient.mockImplementation((name) => {
    if (name === 'AnalyticsController') {
      return { state: { optedIn, analyticsId: 'test-id' } } as never;
    }
    if (name === 'AppStateController') {
      return { state: { pna25Acknowledged } } as never;
    }
    if (name === 'PreferencesController') {
      return { state: preferencesState } as never;
    }
    throw new Error(`Unexpected messenger client: ${name}`);
  });

  return requestMock;
}

function getAssertUserOptedIn(
  request: jest.Mocked<
    MessengerClientInitRequest<
      ProfileMetricsControllerMessenger,
      ProfileMetricsControllerInitMessenger
    >
  >,
) {
  ProfileMetricsControllerInit(request);
  return jest.mocked(ProfileMetricsController).mock.calls[0][0]
    .assertUserOptedIn;
}

describe('ProfileMetricsControllerInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetManifestFlags.mockReturnValue({
      remoteFeatureFlags: {},
    });
  });

  it('initializes the controller', () => {
    const { messengerClient } =
      ProfileMetricsControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(ProfileMetricsController);
  });

  it('passes the proper arguments to the controller', () => {
    ProfileMetricsControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(ProfileMetricsController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      interval: expect.any(Number),
      assertUserOptedIn: expect.any(Function),
      initialDelayDuration: expect.any(Number),
      getMetaMetricsId: expect.any(Function),
    });
    expect(controllerMock.mock.calls[0][0].assertUserOptedIn()).toBe(true);
  });

  it('prevents profile metrics when basic functionality is disabled', () => {
    expect(
      getAssertUserOptedIn(
        getInitRequestMock({ useExternalServices: false }),
      )(),
    ).toBe(false);
  });

  it('keeps MetaMetrics required when the consolidation gate is off and the user is opted out', () => {
    expect(
      getAssertUserOptedIn(
        getInitRequestMock({
          optedIn: false,
          remoteFeatureFlags: { extensionBasicFunctionalityToggle: false },
        }),
      )(),
    ).toBe(false);
  });

  it('keeps MetaMetrics sufficient when the consolidation gate is off and the user is opted in', () => {
    expect(
      getAssertUserOptedIn(
        getInitRequestMock({
          optedIn: true,
          remoteFeatureFlags: { extensionBasicFunctionalityToggle: false },
        }),
      )(),
    ).toBe(true);
  });

  it('allows profile metrics when the consolidation gate is on even if MetaMetrics is opted out', () => {
    expect(
      getAssertUserOptedIn(
        getInitRequestMock({
          optedIn: false,
          isBasicFunctionalityConsolidatedEnabled: true,
          remoteFeatureFlags: { extensionBasicFunctionalityToggle: true },
        }),
      )(),
    ).toBe(true);
  });

  it('still requires Basic Functionality when the consolidation gate is on', () => {
    expect(
      getAssertUserOptedIn(
        getInitRequestMock({
          optedIn: false,
          useExternalServices: false,
          isBasicFunctionalityConsolidatedEnabled: true,
          remoteFeatureFlags: { extensionBasicFunctionalityToggle: true },
        }),
      )(),
    ).toBe(false);
  });

  it('still requires PNA25 acknowledgement when the consolidation gate is on', () => {
    expect(
      getAssertUserOptedIn(
        getInitRequestMock({
          optedIn: false,
          pna25Acknowledged: false,
          isBasicFunctionalityConsolidatedEnabled: true,
          remoteFeatureFlags: { extensionBasicFunctionalityToggle: true },
        }),
      )(),
    ).toBe(false);
  });

  it('allows profile metrics when the cohort marker is set even if the remote flag and MetaMetrics are off', () => {
    expect(
      getAssertUserOptedIn(
        getInitRequestMock({
          optedIn: false,
          isBasicFunctionalityConsolidatedEnabled: true,
          remoteFeatureFlags: { extensionBasicFunctionalityToggle: false },
        }),
      )(),
    ).toBe(true);
  });

  it('treats consistent all-on prefs as the gate when the remote flag is on', () => {
    expect(
      getAssertUserOptedIn(
        getInitRequestMock({
          optedIn: false,
          isBasicFunctionalityConsolidatedEnabled: false,
          remoteFeatureFlags: { extensionBasicFunctionalityToggle: true },
        }),
      )(),
    ).toBe(true);
  });

  it('does not treat mixed child prefs as the gate without a persisted cohort', () => {
    expect(
      getAssertUserOptedIn(
        getInitRequestMock({
          optedIn: false,
          mixedChildren: true,
          isBasicFunctionalityConsolidatedEnabled: false,
          remoteFeatureFlags: { extensionBasicFunctionalityToggle: true },
        }),
      )(),
    ).toBe(false);
  });

  it('re-evaluates the consolidation gate on each assertUserOptedIn call', () => {
    const flags: FeatureFlags = {
      extensionBasicFunctionalityToggle: false,
    };
    const request = getInitRequestMock({
      optedIn: false,
      isBasicFunctionalityConsolidatedEnabled: false,
      remoteFeatureFlags: flags,
    });
    const assertUserOptedIn = getAssertUserOptedIn(request);

    expect(assertUserOptedIn()).toBe(false);

    flags.extensionBasicFunctionalityToggle = true;

    expect(assertUserOptedIn()).toBe(true);
  });

  it('enables the consolidation gate when a manifest override turns the remote flag on', () => {
    mockGetManifestFlags.mockReturnValue({
      remoteFeatureFlags: { extensionBasicFunctionalityToggle: true },
    });

    expect(
      getAssertUserOptedIn(
        getInitRequestMock({
          optedIn: false,
          isBasicFunctionalityConsolidatedEnabled: false,
          remoteFeatureFlags: {
            extensionBasicFunctionalityToggle: {
              enabled: false,
              minimumVersion: '13.38.0',
            },
          },
        }),
      )(),
    ).toBe(true);
  });

  it('disables the consolidation gate when a manifest override turns the remote flag off', () => {
    mockGetManifestFlags.mockReturnValue({
      remoteFeatureFlags: { extensionBasicFunctionalityToggle: false },
    });

    expect(
      getAssertUserOptedIn(
        getInitRequestMock({
          optedIn: false,
          isBasicFunctionalityConsolidatedEnabled: false,
          remoteFeatureFlags: { extensionBasicFunctionalityToggle: true },
        }),
      )(),
    ).toBe(false);
  });
});
