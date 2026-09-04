import {
  ActionConstraint,
  Messenger,
  MOCK_ANY_NAMESPACE,
  MockAnyNamespace,
} from '@metamask/messenger';
import type {
  AnalyticsControllerGetStateAction,
  AnalyticsControllerIdentifyAction,
  AnalyticsControllerOptInAction,
  AnalyticsControllerOptOutAction,
  AnalyticsControllerResetConsentDecisionAction,
  AnalyticsControllerTrackEventAction,
  AnalyticsControllerTrackViewAction,
} from '@metamask/analytics-controller';
import type { MultichainNetworkControllerGetStateAction } from '@metamask/multichain-network-controller';
import type {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { ENVIRONMENT } from '../../../../shared/constants/build';
import { createEventBuilder } from '../../../../shared/lib/analytics/create-event-builder';
import type { PreferencesControllerGetStateAction } from '../preferences-controller';
import type { MetaMetricsControllerGetStateAction } from '../metametrics-controller';
import type {
  MetaMetricsControllerClearTracesAfterMetricsOptInAction,
  MetaMetricsControllerSetMarketingCampaignCookieIdAction,
  MetaMetricsControllerTrackTracesAfterMetricsOptInAction,
  MetaMetricsControllerUpdateExtensionUninstallUrlAction,
} from '../metametrics-controller-method-action-types';
import { getAnalyticsControllerInitMessenger } from '../../messenger-client-init/messengers/analytics-controller-messenger';
import {
  configureAnalytics,
  getProfileIdentityProperties,
  identify,
  setParticipateInMetaMetrics,
  trackEvent,
  updateProfileSessionData,
} from './analytics';

const TEST_ANALYTICS_ID = 'analytics-id';
const TEST_GA_COOKIE_ID = '123456.123455';

function createConfiguredMessenger({
  optedIn = true,
  consentDecisionMade = true,
  marketingCampaignCookieId = 'campaign-id',
}: {
  optedIn?: boolean;
  consentDecisionMade?: boolean;
  marketingCampaignCookieId?: string | null;
} = {}) {
  const analyticsControllerState = {
    analyticsId: TEST_ANALYTICS_ID,
    optedIn,
    consentDecisionMade,
  };
  const metaMetricsControllerState = {
    dataCollectionForMarketing: false,
    marketingCampaignCookieId,
  };
  const trackEventHandler = jest.fn();
  const trackViewHandler = jest.fn();
  const identifyHandler = jest.fn();
  const optInHandler = jest.fn(async () => {
    analyticsControllerState.optedIn = true;
    analyticsControllerState.consentDecisionMade = true;
  });
  const optOutHandler = jest.fn(() => {
    analyticsControllerState.optedIn = false;
    analyticsControllerState.consentDecisionMade = true;
  });
  const resetConsentDecisionHandler = jest.fn(() => {
    analyticsControllerState.optedIn = false;
    analyticsControllerState.consentDecisionMade = false;
  });
  const trackTracesHandler = jest.fn();
  const clearTracesHandler = jest.fn();
  const setMarketingCampaignCookieIdHandler = jest.fn();
  const updateExtensionUninstallUrlHandler = jest.fn();
  const rootMessenger = new Messenger<
    MockAnyNamespace,
    | PreferencesControllerGetStateAction
    | MultichainNetworkControllerGetStateAction
    | NetworkControllerGetStateAction
    | NetworkControllerGetNetworkClientByIdAction
    | RemoteFeatureFlagControllerGetStateAction
    | MetaMetricsControllerGetStateAction
    | MetaMetricsControllerTrackTracesAfterMetricsOptInAction
    | MetaMetricsControllerClearTracesAfterMetricsOptInAction
    | MetaMetricsControllerSetMarketingCampaignCookieIdAction
    | MetaMetricsControllerUpdateExtensionUninstallUrlAction
    | AnalyticsControllerGetStateAction
    | AnalyticsControllerTrackEventAction
    | AnalyticsControllerIdentifyAction
    | AnalyticsControllerTrackViewAction
    | AnalyticsControllerOptInAction
    | AnalyticsControllerOptOutAction
    | AnalyticsControllerResetConsentDecisionAction
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
    () => metaMetricsControllerState as never,
  );
  rootMessenger.registerActionHandler(
    'MetaMetricsController:trackTracesAfterMetricsOptIn',
    trackTracesHandler as never,
  );
  rootMessenger.registerActionHandler(
    'MetaMetricsController:clearTracesAfterMetricsOptIn',
    clearTracesHandler as never,
  );
  rootMessenger.registerActionHandler(
    'MetaMetricsController:setMarketingCampaignCookieId',
    ((cookieId: string | null) => {
      metaMetricsControllerState.marketingCampaignCookieId = cookieId;
      setMarketingCampaignCookieIdHandler(cookieId);
    }) as never,
  );
  rootMessenger.registerActionHandler(
    'MetaMetricsController:updateExtensionUninstallUrl',
    updateExtensionUninstallUrlHandler as never,
  );
  rootMessenger.registerActionHandler(
    'AnalyticsController:getState',
    () => analyticsControllerState as never,
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
  rootMessenger.registerActionHandler(
    'AnalyticsController:optIn',
    optInHandler as never,
  );
  rootMessenger.registerActionHandler(
    'AnalyticsController:optOut',
    optOutHandler as never,
  );
  rootMessenger.registerActionHandler(
    'AnalyticsController:resetConsentDecision',
    resetConsentDecisionHandler as never,
  );

  const analyticsMessenger = getAnalyticsControllerInitMessenger(rootMessenger);

  configureAnalytics({
    messenger: analyticsMessenger,
  });

  return {
    identifyHandler,
    trackEventHandler,
    trackViewHandler,
    optInHandler,
    optOutHandler,
    resetConsentDecisionHandler,
    trackTracesHandler,
    clearTracesHandler,
    setMarketingCampaignCookieIdHandler,
    updateExtensionUninstallUrlHandler,
    analyticsControllerState,
    metaMetricsControllerState,
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

  describe('setParticipateInMetaMetrics', () => {
    it('opts in and out via AnalyticsController and records the consent decision', async () => {
      const {
        analyticsControllerState,
        optInHandler,
        optOutHandler,
        trackTracesHandler,
        clearTracesHandler,
      } = createConfiguredMessenger({
        optedIn: false,
        consentDecisionMade: false,
      });

      expect(analyticsControllerState.consentDecisionMade).toBe(false);

      await setParticipateInMetaMetrics(true);
      expect(optInHandler).toHaveBeenCalledTimes(1);
      expect(trackTracesHandler).toHaveBeenCalledTimes(1);
      expect(clearTracesHandler).toHaveBeenCalledTimes(1);
      expect(analyticsControllerState.optedIn).toBe(true);
      expect(analyticsControllerState.consentDecisionMade).toBe(true);

      await setParticipateInMetaMetrics(false);
      expect(optOutHandler).toHaveBeenCalledTimes(1);
      expect(clearTracesHandler).toHaveBeenCalledTimes(2);
      expect(analyticsControllerState.optedIn).toBe(false);
      expect(analyticsControllerState.consentDecisionMade).toBe(true);
    });

    it('resets the consent decision when set to null', async () => {
      const { analyticsControllerState, resetConsentDecisionHandler } =
        createConfiguredMessenger({
          optedIn: true,
          consentDecisionMade: true,
        });

      await setParticipateInMetaMetrics(null);

      expect(resetConsentDecisionHandler).toHaveBeenCalledTimes(1);
      expect(analyticsControllerState.optedIn).toBe(false);
      expect(analyticsControllerState.consentDecisionMade).toBe(false);
    });

    it('does not nullify the analyticsId when set to false', async () => {
      const { analyticsControllerState } = createConfiguredMessenger();

      const analyticsId = await setParticipateInMetaMetrics(false);

      expect(analyticsId).toStrictEqual(TEST_ANALYTICS_ID);
      expect(analyticsControllerState.analyticsId).toStrictEqual(
        TEST_ANALYTICS_ID,
      );
    });

    it('nullifies the marketingCampaignCookieId when participation is toggled off', async () => {
      const {
        metaMetricsControllerState,
        setMarketingCampaignCookieIdHandler,
      } = createConfiguredMessenger({
        marketingCampaignCookieId: TEST_GA_COOKIE_ID,
      });

      expect(
        metaMetricsControllerState.marketingCampaignCookieId,
      ).toStrictEqual(TEST_GA_COOKIE_ID);

      await setParticipateInMetaMetrics(false);

      expect(setMarketingCampaignCookieIdHandler).toHaveBeenCalledWith(null);
      expect(metaMetricsControllerState.marketingCampaignCookieId).toBeNull();
    });

    describe('the extension uninstall URL', () => {
      const originalEnvironment = process.env.METAMASK_ENVIRONMENT;
      const originalBuildType = process.env.METAMASK_BUILD_TYPE;

      afterEach(() => {
        process.env.METAMASK_ENVIRONMENT = originalEnvironment;
        process.env.METAMASK_BUILD_TYPE = originalBuildType;
      });

      it('updates it when opting in on a main production build', async () => {
        process.env.METAMASK_BUILD_TYPE = 'main';
        process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;
        const { updateExtensionUninstallUrlHandler } =
          createConfiguredMessenger();

        await setParticipateInMetaMetrics(true);

        expect(updateExtensionUninstallUrlHandler).toHaveBeenCalledTimes(1);
        expect(updateExtensionUninstallUrlHandler).toHaveBeenCalledWith(
          true,
          TEST_ANALYTICS_ID,
        );
      });

      it('updates it when opting out on a main production build', async () => {
        process.env.METAMASK_BUILD_TYPE = 'main';
        process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;
        const { updateExtensionUninstallUrlHandler } =
          createConfiguredMessenger();

        await setParticipateInMetaMetrics(false);

        expect(updateExtensionUninstallUrlHandler).toHaveBeenCalledTimes(1);
        expect(updateExtensionUninstallUrlHandler).toHaveBeenCalledWith(
          false,
          TEST_ANALYTICS_ID,
        );
      });

      it('does not update it when participation is reset to null', async () => {
        process.env.METAMASK_BUILD_TYPE = 'main';
        process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;
        const { updateExtensionUninstallUrlHandler } =
          createConfiguredMessenger();

        await setParticipateInMetaMetrics(null);

        expect(updateExtensionUninstallUrlHandler).not.toHaveBeenCalled();
      });

      it('does not update it in development', async () => {
        process.env.METAMASK_BUILD_TYPE = 'main';
        process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.DEVELOPMENT;
        const { updateExtensionUninstallUrlHandler } =
          createConfiguredMessenger();

        await setParticipateInMetaMetrics(true);

        expect(updateExtensionUninstallUrlHandler).not.toHaveBeenCalled();
      });

      it('does not update it for a non-main build', async () => {
        process.env.METAMASK_BUILD_TYPE = 'flask';
        process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;
        const { updateExtensionUninstallUrlHandler } =
          createConfiguredMessenger();

        await setParticipateInMetaMetrics(true);

        expect(updateExtensionUninstallUrlHandler).not.toHaveBeenCalled();
      });
    });
  });
});
