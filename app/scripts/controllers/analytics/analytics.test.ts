import {
  ActionConstraint,
  Messenger,
  MOCK_ANY_NAMESPACE,
  MockAnyNamespace,
} from '@metamask/messenger';
import type {
  AnalyticsControllerGetStateAction,
  AnalyticsControllerIdentifyAction,
  AnalyticsControllerTrackEventAction,
  AnalyticsControllerTrackViewAction,
} from '@metamask/analytics-controller';
import type { MultichainNetworkControllerGetStateAction } from '@metamask/multichain-network-controller';
import type {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { createEventBuilder } from '../../../../shared/lib/analytics/create-event-builder';
import type { PreferencesControllerGetStateAction } from '../preferences-controller';
import type { MetaMetricsControllerGetStateAction } from '../metametrics-controller';
import { getAnalyticsControllerInitMessenger } from '../../messenger-client-init/messengers/analytics-controller-messenger';
import {
  configureAnalytics,
  getProfileIdentityProperties,
  identify,
  trackEvent,
  updateProfileSessionData,
} from './analytics';

function createConfiguredMessenger() {
  const trackEventHandler = jest.fn();
  const trackViewHandler = jest.fn();
  const identifyHandler = jest.fn();
  const rootMessenger = new Messenger<
    MockAnyNamespace,
    | PreferencesControllerGetStateAction
    | MultichainNetworkControllerGetStateAction
    | NetworkControllerGetStateAction
    | NetworkControllerGetNetworkClientByIdAction
    | RemoteFeatureFlagControllerGetStateAction
    | MetaMetricsControllerGetStateAction
    | AnalyticsControllerGetStateAction
    | AnalyticsControllerTrackEventAction
    | AnalyticsControllerIdentifyAction
    | AnalyticsControllerTrackViewAction
    | ActionConstraint,
    never
  >({
    namespace: MOCK_ANY_NAMESPACE,
  });

  rootMessenger.registerActionHandler(
    'PreferencesController:getState',
    () =>
      ({
        currentLocale: 'en_US',
        useExternalServices: true,
      }) as never,
  );
  rootMessenger.registerActionHandler(
    'NetworkController:getState',
    () =>
      ({
        selectedNetworkClientId: 'mainnet',
      }) as never,
  );
  rootMessenger.registerActionHandler(
    'NetworkController:getNetworkClientById',
    () =>
      ({
        configuration: {
          chainId: '0x1',
        },
      }) as never,
  );
  rootMessenger.registerActionHandler(
    'RemoteFeatureFlagController:getState',
    () =>
      ({
        remoteFeatureFlags: {},
      }) as never,
  );
  rootMessenger.registerActionHandler(
    'MultichainNetworkController:getState',
    () =>
      ({
        isEvmSelected: true,
        selectedMultichainNetworkChainId: 'eip155:1',
      }) as never,
  );
  rootMessenger.registerActionHandler(
    'MetaMetricsController:getState',
    () =>
      ({
        dataCollectionForMarketing: false,
        marketingCampaignCookieId: 'campaign-id',
      }) as never,
  );
  rootMessenger.registerActionHandler(
    'AnalyticsController:getState',
    () =>
      ({
        analyticsId: 'analytics-id',
        optedIn: true,
      }) as never,
  );
  rootMessenger.registerActionHandler(
    'AnalyticsController:trackEvent',
    trackEventHandler as never,
  );
  rootMessenger.registerActionHandler(
    'AnalyticsController:identify',
    identifyHandler as never,
  );
  rootMessenger.registerActionHandler(
    'AnalyticsController:trackView',
    trackViewHandler as never,
  );

  const analyticsMessenger = getAnalyticsControllerInitMessenger(rootMessenger);

  configureAnalytics({
    messenger: analyticsMessenger,
  });

  return {
    identifyHandler,
    trackEventHandler,
    trackViewHandler,
  };
}

const SAMPLE_SRP_SESSION_DATA = {
  entropySourceId1: {
    token: {
      accessToken: '',
      expiresIn: 0,
      obtainedAt: 0,
    },
    profile: {
      identifierId: 'identifierId',
      profileId: 'profileId',
      canonicalProfileId: 'canonicalProfileId',
      metaMetricsId: 'testid',
    },
  },
};

const PROFILE_IDENTITY_EVENT_PROPERTIES = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  profile_id: 'profileId',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  canonical_profile_id: 'canonicalProfileId',
};

describe('analytics', () => {
  beforeEach(() => {
    updateProfileSessionData(undefined);
  });

  it('normalizes lightweight built events before delivery', () => {
    const { trackEventHandler } = createConfiguredMessenger();

    trackEvent(
      createEventBuilder('Test Event')
        .addCategory('Test Category')
        .build({ environmentType: 'popup' }),
    );

    expect(trackEventHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Event',
        properties: expect.objectContaining({
          category: 'Test Category',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'popup',
        }),
      }),
      expect.objectContaining({
        page: expect.any(Object),
      }),
    );
  });

  it('preserves Segment special fields from builder event properties', () => {
    const { trackEventHandler } = createConfiguredMessenger();

    trackEvent(
      createEventBuilder('Revenue Event')
        .addCategory('Revenue Category')
        .addProperties({
          foo: 'bar',
          revenue: 1,
          value: 2,
          currency: 'USD',
        })
        .build(),
    );

    expect(trackEventHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Revenue Event',
        properties: expect.objectContaining({
          foo: 'bar',
          category: 'Revenue Category',
          revenue: 1,
          value: 2,
          currency: 'USD',
        }),
      }),
      expect.any(Object),
    );
  });

  it('validates identify traits before delivery', () => {
    const { identifyHandler } = createConfiguredMessenger();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    identify({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      install_date_ext: '2024-01-01',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      test_null: null,
    } as never);

    expect(identifyHandler).toHaveBeenCalledWith(
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        install_date_ext: '2024-01-01',
      },
      undefined,
    );
    expect(warnSpy).toHaveBeenCalledWith(
      'analytics#identify: "test_null" value is not a valid trait type',
    );

    warnSpy.mockRestore();
  });

  it('caches profile identity for downstream enrichment', () => {
    updateProfileSessionData(undefined);
    expect(getProfileIdentityProperties()).toEqual({});

    updateProfileSessionData(SAMPLE_SRP_SESSION_DATA);
    expect(getProfileIdentityProperties()).toEqual(
      PROFILE_IDENTITY_EVENT_PROPERTIES,
    );
  });
});
