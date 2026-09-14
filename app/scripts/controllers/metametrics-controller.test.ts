import type {
  NetworkClientId,
  NetworkState,
} from '@metamask/network-controller';
import type {
  AnalyticsContext,
  AnalyticsControllerIdentifyAction,
  AnalyticsControllerOptInAction,
  AnalyticsControllerOptOutAction,
  AnalyticsControllerResetConsentDecisionAction,
  AnalyticsControllerState,
  AnalyticsControllerTrackEventAction,
  AnalyticsControllerTrackViewAction,
  AnalyticsEventProperties,
  AnalyticsUserTraits,
} from '@metamask/analytics-controller';
import { Browser } from 'webextension-polyfill';
import { deriveStateFromMetadata } from '@metamask/base-controller';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import { merge } from 'lodash';
import { ENVIRONMENT_TYPE_BACKGROUND } from '../../../shared/constants/app';
import { createSegmentMock, segment } from '../lib/segment';
import {
  METAMETRICS_BACKGROUND_PAGE_OBJECT,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
  MetaMetricsUserTraits,
  type MetaMetricsEventOptions,
  type MetaMetricsEventPayload,
} from '../../../shared/constants/metametrics';
import {
  AB_TEST_ANALYTICS_MAPPINGS,
  clearABTestAnalyticsMappings,
} from '../../../shared/lib/ab-testing/ab-test-analytics';
import { createActiveABTestAssignment } from '../../../shared/lib/ab-testing/active-ab-test-assignment';
import * as ManifestFlags from '../../../shared/lib/manifestFlags';
import * as Utils from '../lib/util';
import { mockNetworkState } from '../../../test/stub/networks';
import { flushPromises } from '../../../test/lib/timer-helpers';
import type { Preferences } from '../../../shared/types/preferences';
import * as sentry from '../../../shared/lib/sentry';
import { configureOptOutSegmentEnrichment } from '../lib/segment/custom-segment-tracking';
import { getAnalyticsControllerInitMessenger } from '../messenger-client-init/messengers/analytics-controller-messenger';
import {
  createEnrichmentContext,
  enrichEventContext,
  enrichEventProperties,
  enrichWithABTestAnalytics,
} from './analytics/platform-adapter';
import {
  configureAnalytics,
  getProfileIdentityProperties,
  updateProfileSessionData,
} from './analytics/analytics';
import {
  createEventBuilder,
  identify,
  trackEvent,
  trackPage,
} from './analytics';
import {
  MetaMetricsController,
  AllowedActions,
  AllowedEvents,
  MetaMetricsControllerOptions,
  type MetaMetricsControllerState,
} from './metametrics-controller';
import {
  getDefaultPreferencesControllerState,
  PreferencesControllerState,
} from './preferences-controller';

const TEST_BADGE_FLAG_KEY = 'testTEST338AbtestAttentionBadge';
const TEST_QUICK_AMOUNTS_FLAG_KEY = 'testTEST4135AbtestQuickAmounts';
const TEST_LAYOUT_FLAG_KEY = 'testTEST4242AbtestBalanceLayout';

function trackLegacyMetaMetricsPayload(
  payload: MetaMetricsEventPayload,
  options?: MetaMetricsEventOptions,
): void {
  trackEvent(
    createEventBuilder(payload.event)
      .addProperties({
        ...(payload.properties ?? {}),
        ...(payload.category === undefined
          ? {}
          : { category: payload.category }),
        ...(payload.revenue === undefined ? {} : { revenue: payload.revenue }),
        ...(payload.value === undefined ? {} : { value: payload.value }),
        ...(payload.currency === undefined
          ? {}
          : { currency: payload.currency }),
      })
      .addSensitiveProperties(payload.sensitiveProperties)
      .build({
        environmentType: payload.environmentType,
        page: payload.page,
        referrer: payload.referrer,
        excludeMetaMetricsId: options?.excludeMetaMetricsId,
        matomoEvent: options?.matomoEvent,
      }),
  );
}

const segmentMock = createSegmentMock(2);

const VERSION = '0.0.1-test';
const DEFAULT_CHAIN_ID = '0x1338';
const LOCALE = 'en_US';
const TEST_ANALYTICS_ID = '00000000-0000-4000-8000-000000000001';
const TEST_GA_COOKIE_ID = '123456.123455';

const MOCK_ANALYTICS_CONTROLLER_OPTED_IN: AnalyticsControllerState = {
  optedIn: true,
  consentDecisionMade: true,
  analyticsId: TEST_ANALYTICS_ID,
};
const MOCK_EXTENSION_ID = 'testid';

const MOCK_EXTENSION = {
  runtime: {
    id: MOCK_EXTENSION_ID,
    setUninstallURL: () => undefined,
  },
} as unknown as Browser;

const MOCK_TRAITS = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  test_boolean: true,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  test_string: 'abc',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  test_number: 123,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  test_bool_array: [true, true, false],
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  test_string_array: ['test', 'test', 'test'],
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  test_boolean_array: [1, 2, 3],
  [MetaMetricsUserTrait.CookieId]: 'GA1.1.12345.67890',
  [MetaMetricsUserTrait.GaClientId]: '12345.67890',
} as MetaMetricsUserTraits;

const MOCK_INVALID_TRAITS = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  test_null: null,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  test_array_multi_types: [true, 'a', 1],
} as MetaMetricsUserTraits;

const DEFAULT_TEST_CONTEXT = {
  app: {
    name: 'MetaMask Extension',
    version: VERSION,
  },
  page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
  referrer: undefined,
  userAgent: window.navigator.userAgent,
  marketingCampaignCookieId: null,
};

const DEFAULT_SHARED_PROPERTIES = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  chain_id: DEFAULT_CHAIN_ID,
  locale: LOCALE.replace('_', '-'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  environment_type: 'background',
};

const DEFAULT_EVENT_PROPERTIES = {
  category: 'Unit Test',
  ...DEFAULT_SHARED_PROPERTIES,
};

const DEFAULT_PAGE_PROPERTIES = {
  ...DEFAULT_SHARED_PROPERTIES,
};

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

const SAMPLE_TX_SUBMITTED_PARTIAL_FRAGMENT = {
  id: 'transaction-submitted-0000',
  canDeleteIfAbandoned: true,
  category: 'Unit Test',
  successEvent: 'Transaction Finalized',
  persist: true,
  properties: {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    simulation_response: 'no_balance_change',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    test_stored_prop: 1,
  },
};

const SAMPLE_PERSISTED_EVENT_NO_ID = {
  persist: true,
  category: 'Unit Test',
  successEvent: 'sample persisted event success',
  failureEvent: 'sample persisted event failure',
  properties: {
    test: true,
  },
};

const SAMPLE_PERSISTED_EVENT = {
  id: 'testid',
  ...SAMPLE_PERSISTED_EVENT_NO_ID,
};

const SAMPLE_NON_PERSISTED_EVENT = {
  id: 'testid2',
  persist: false,
  category: 'Unit Test',
  successEvent: 'sample non-persisted event success',
  failureEvent: 'sample non-persisted event failure',
  uniqueIdentifier: 'sample-non-persisted-event',
  properties: {
    test: true,
  },
};

describe('MetaMetricsController', function () {
  beforeEach(() => {
    clearABTestAnalyticsMappings();
    updateProfileSessionData(undefined);
  });

  describe('constructor', function () {
    it('should properly initialize', async function () {
      const spy = jest.spyOn(segmentMock, 'track');
      await withController(({ controller, controllerMessenger }) => {
        expect(controller.version).toStrictEqual(VERSION);
        expect(controller.chainId).toStrictEqual(DEFAULT_CHAIN_ID);
        expect(controller.state.marketingCampaignCookieId).toStrictEqual(null);
        const { analyticsId, consentDecisionMade } = controllerMessenger.call(
          'AnalyticsController:getState',
        );
        expect(consentDecisionMade).toBe(true);
        expect(analyticsId).toStrictEqual(TEST_ANALYTICS_ID);
        expect(controller.locale).toStrictEqual(LOCALE.replace('_', '-'));
        expect(controller.state.fragments).toStrictEqual({
          testid: SAMPLE_PERSISTED_EVENT,
        });
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(
          {
            event: 'sample non-persisted event failure',
            userId: TEST_ANALYTICS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: {
              ...DEFAULT_EVENT_PROPERTIES,
              test: true,
            },
          },
          spy.mock.calls[0][1],
        );
      });
    });

    it('should update when network changes', async function () {
      const selectedNetworkClientId = 'selectedNetworkClientId2';
      const selectedChainId = '0x222';
      await withController(
        {
          mockNetworkClientConfigurationsByNetworkClientId: {
            [selectedNetworkClientId]: {
              chainId: selectedChainId,
            },
          },
        },
        ({ controller, triggerNetworkDidChange }) => {
          triggerNetworkDidChange({
            networkConfigurationsByChainId: {},
            selectedNetworkClientId: 'selectedNetworkClientId2',
            networksMetadata: {},
          });

          expect(controller.chainId).toStrictEqual(selectedChainId);
        },
      );
    });

    it('should update when preferences changes', async function () {
      await withController(
        {
          currentLocale: LOCALE,
        },
        ({ controller, triggerPreferencesControllerStateChange }) => {
          triggerPreferencesControllerStateChange({
            ...getDefaultPreferencesControllerState(),
            currentLocale: 'en_UK',
          });
          expect(controller.locale).toStrictEqual('en-UK');
        },
      );
    });
  });

  describe('createEventFragment', function () {
    it('should throw an error if the param is missing successEvent', async function () {
      await withController(async ({ controller }) => {
        await expect(() => {
          // @ts-expect-error because we are testing the error case
          controller.createEventFragment({ category: 'test' });
        }).toThrow(/Must specify success event\./u);
      });
    });

    it('should update fragments state with new fragment', async function () {
      await withController(({ controller }) => {
        jest.useFakeTimers().setSystemTime(1730798301422);
        const mockNewId = 'testid3';

        controller.createEventFragment({
          ...SAMPLE_PERSISTED_EVENT_NO_ID,
          uniqueIdentifier: mockNewId,
        });

        const resultFragment = controller.state.fragments[mockNewId];

        expect(resultFragment).toStrictEqual({
          ...SAMPLE_PERSISTED_EVENT_NO_ID,
          id: mockNewId,
          uniqueIdentifier: mockNewId,
          lastUpdated: 1730798301422,
        });
      });
    });

    it('should track the initial event if provided', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'track');
        const mockInitialEventName = 'Test Initial Event';

        controller.createEventFragment({
          ...SAMPLE_PERSISTED_EVENT_NO_ID,
          initialEvent: mockInitialEventName,
        });

        expect(spy).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call track if no initialEvent was provided', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'track');

        controller.createEventFragment({
          ...SAMPLE_PERSISTED_EVENT_NO_ID,
        });

        expect(spy).toHaveBeenCalledTimes(0);
      });
    });

    describe('when intialEvent is "Transaction Submitted" and a fragment exists before createEventFragment is called', function () {
      it('should update existing fragment state with new fragment props', async function () {
        await withController(({ controller }) => {
          jest.useFakeTimers().setSystemTime(1730798302222);
          const { id } = SAMPLE_TX_SUBMITTED_PARTIAL_FRAGMENT;

          controller.updateEventFragment(
            SAMPLE_TX_SUBMITTED_PARTIAL_FRAGMENT.id,
            {
              ...SAMPLE_TX_SUBMITTED_PARTIAL_FRAGMENT,
            },
          );
          controller.createEventFragment({
            ...SAMPLE_PERSISTED_EVENT_NO_ID,
            initialEvent: 'Transaction Submitted',
            uniqueIdentifier: id,
          });

          const expectedFragment = merge(
            {},
            SAMPLE_TX_SUBMITTED_PARTIAL_FRAGMENT,
            SAMPLE_PERSISTED_EVENT_NO_ID,
            {
              canDeleteIfAbandoned: false,
              id,
              initialEvent: 'Transaction Submitted',
              uniqueIdentifier: id,
              lastUpdated: 1730798302222,
            },
          );

          expect(controller.state.fragments[id]).toStrictEqual(
            expectedFragment,
          );
        });
      });
    });
  });

  describe('updateEventFragment', function () {
    it('updates fragment with additional provided props', async function () {
      await withController(({ controller }) => {
        jest.useFakeTimers().setSystemTime(1730798303333);

        const MOCK_PROPS_TO_UPDATE = {
          properties: {
            test: 1,
          },
        };

        controller.updateEventFragment(
          SAMPLE_PERSISTED_EVENT.id,
          MOCK_PROPS_TO_UPDATE,
        );

        const expectedPartialFragment = {
          ...SAMPLE_PERSISTED_EVENT,
          ...MOCK_PROPS_TO_UPDATE,
          lastUpdated: 1730798303333,
        };

        expect(
          controller.state.fragments[SAMPLE_PERSISTED_EVENT.id],
        ).toStrictEqual(expectedPartialFragment);
      });
    });

    it('throws error when no existing fragment exists', async function () {
      await withController(async ({ controller }) => {
        jest.useFakeTimers().setSystemTime(1730798303333);

        const MOCK_NONEXISTING_ID = 'test-nonexistingid';

        await expect(() => {
          controller.updateEventFragment(MOCK_NONEXISTING_ID, {
            properties: { test: 1 },
          });
        }).toThrow(
          /Event fragment with id test-nonexistingid does not exist\./u,
        );

        jest.useRealTimers();
      });
    });

    describe('when id includes "transaction-submitted"', function () {
      it('creates and stores new fragment props with canDeleteIfAbandoned set to true', async function () {
        await withController(({ controller }) => {
          jest.useFakeTimers().setSystemTime(1730798303333);
          const MOCK_ID = 'transaction-submitted-1111';
          const MOCK_PROPS_TO_UPDATE = {
            properties: {
              test: 1,
            },
          };

          controller.updateEventFragment(MOCK_ID, MOCK_PROPS_TO_UPDATE);

          const resultFragment = controller.state.fragments[MOCK_ID];
          const expectedPartialFragment = {
            ...MOCK_PROPS_TO_UPDATE,
            category: 'Transactions',
            canDeleteIfAbandoned: true,
            id: MOCK_ID,
            lastUpdated: 1730798303333,
            successEvent: 'Transaction Finalized',
          };
          expect(resultFragment).toStrictEqual(expectedPartialFragment);

          jest.useRealTimers();
        });
      });
    });
  });

  describe('identify', function () {
    it('should call segment.identify for valid traits if user is participating in metametrics', async function () {
      const spy = jest.spyOn(segmentMock, 'identify');
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
        return undefined;
      });
      await withController(({ controller }) => {
        identify({
          ...MOCK_TRAITS,
          ...MOCK_INVALID_TRAITS,
        });
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: TEST_ANALYTICS_ID,
            traits: MOCK_TRAITS,
          }),
          undefined,
        );
        expect(warnSpy).toHaveBeenCalledTimes(2);
        expect(warnSpy).toHaveBeenNthCalledWith(
          1,
          'analytics#identify: "test_null" value is not a valid trait type',
        );
        expect(warnSpy).toHaveBeenNthCalledWith(
          2,
          'analytics#identify: "test_array_multi_types" value is not a valid trait type',
        );
      });
    });

    it('should transform date type traits into ISO-8601 timestamp strings', async function () {
      const spy = jest.spyOn(segmentMock, 'identify');
      await withController(({ controller }) => {
        identify({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          test_date: new Date().toISOString(),
        } as MetaMetricsUserTraits);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: TEST_ANALYTICS_ID,
            traits: {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              test_date: new Date().toISOString(),
            },
          }),
          undefined,
        );
      });
    });

    it('should not call segment.identify if user is not participating in metametrics', async function () {
      const spy = jest.spyOn(segmentMock, 'identify');
      await withController(
        {
          analyticsControllerState: { optedIn: false },
        },
        ({ controller }) => {
          identify(MOCK_TRAITS);
          expect(spy).toHaveBeenCalledTimes(0);
        },
      );
    });

    it('should not call segment.identify if there are no valid traits to identify', async function () {
      const spy = jest.spyOn(segmentMock, 'identify');
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
        return undefined;
      });
      await withController(({ controller }) => {
        identify(MOCK_INVALID_TRAITS);
        expect(spy).toHaveBeenCalledTimes(0);
        expect(warnSpy).toHaveBeenCalledTimes(2);
        expect(warnSpy).toHaveBeenNthCalledWith(
          1,
          'analytics#identify: "test_null" value is not a valid trait type',
        );
        expect(warnSpy).toHaveBeenNthCalledWith(
          2,
          'analytics#identify: "test_array_multi_types" value is not a valid trait type',
        );
      });
    });
  });

  describe('trackEvent', function () {
    it('should not track an event if user is not participating in metametrics', async function () {
      const spy = jest.spyOn(segmentMock, 'track');
      await withController(
        {
          analyticsControllerState: { optedIn: false },
        },
        ({ controller }) => {
          trackLegacyMetaMetricsPayload({
            event: 'Fake Event',
            category: 'Unit Test',
            properties: {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              chain_id: '1',
            },
          });
          expect(spy).toHaveBeenCalledTimes(0);
        },
      );
    });

    it('tracks Metrics Opt Out when user is opted out on non-Firefox browsers', async function () {
      await withController(
        {
          analyticsControllerState: { optedIn: false },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segment, 'track');
          const flushSpy = jest.spyOn(segment, 'flush');
          trackLegacyMetaMetricsPayload({
            event: MetaMetricsEventName.MetricsOptOut,
            category: 'Unit Test',
            properties: {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              chain_id: '1',
            },
          });
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith({
            event: MetaMetricsEventName.MetricsOptOut,
            userId: TEST_ANALYTICS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: {
              ...DEFAULT_EVENT_PROPERTIES,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              chain_id: '1',
            },
          });
          expect(flushSpy).toHaveBeenCalled();
        },
      );
    });

    it('does not track Metrics Opt Out when user is opted out on Firefox', async function () {
      jest
        .spyOn(window.navigator, 'userAgent', 'get')
        .mockReturnValue('Mozilla/5.0 Firefox/126.0');
      await withController(
        {
          analyticsControllerState: { optedIn: false },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segment, 'track');
          trackLegacyMetaMetricsPayload({
            event: MetaMetricsEventName.MetricsOptOut,
            category: 'Unit Test',
          });
          expect(spy).not.toHaveBeenCalled();
        },
      );
    });

    it('does not track normal events when user is opted out', async function () {
      await withController(
        {
          analyticsControllerState: { optedIn: false },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'track');
          trackLegacyMetaMetricsPayload({
            event: 'Fake Event',
            category: 'Unit Test',
            properties: {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              chain_id: '1',
            },
          });
          expect(spy).not.toHaveBeenCalled();
        },
      );
    });

    it('should track a legacy event', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'track');
        trackLegacyMetaMetricsPayload(
          {
            event: 'Fake Event',
            category: 'Unit Test',
            properties: {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              chain_id: '1',
            },
          },
          { matomoEvent: true },
        );
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(
          {
            event: 'Fake Event',
            userId: TEST_ANALYTICS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: {
              ...DEFAULT_EVENT_PROPERTIES,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              legacy_event: true,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              chain_id: '1',
            },
          },
          spy.mock.calls[0][1],
        );
      });
    });

    it('should track a non legacy event', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'track');
        trackLegacyMetaMetricsPayload({
          event: 'Fake Event',
          category: 'Unit Test',
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '1',
          },
        });
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(
          {
            event: 'Fake Event',
            properties: {
              ...DEFAULT_EVENT_PROPERTIES,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              chain_id: '1',
            },
            context: DEFAULT_TEST_CONTEXT,
            userId: TEST_ANALYTICS_ID,
          },
          spy.mock.calls[0][1],
        );
      });
    });

    it('removes UTM properties when marketing consent is not granted', async function () {
      await withController(
        {
          options: {
            state: {
              dataCollectionForMarketing: false,
            },
          },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'track');
          trackLegacyMetaMetricsPayload({
            event: 'Fake Event',
            category: 'Unit Test',
            properties: {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              utm_source: 'newsletter',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              chain_id: '1',
            },
            sensitiveProperties: {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              utm_campaign: 'spring-sale',
              foo: 'bar',
            },
          });

          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
              event: 'Fake Event',
              userId: TEST_ANALYTICS_ID,
              context: DEFAULT_TEST_CONTEXT,
              properties: expect.objectContaining({
                ...DEFAULT_EVENT_PROPERTIES,
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                chain_id: '1',
              }),
            }),
            undefined,
          );
          expect(spy.mock.calls[0][0].properties).not.toHaveProperty(
            'utm_source',
          );

          expect(spy).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
              event: 'Fake Event',
              userId: TEST_ANALYTICS_ID,
              context: DEFAULT_TEST_CONTEXT,
              properties: expect.objectContaining({
                foo: 'bar',
                ...DEFAULT_EVENT_PROPERTIES,
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                chain_id: '1',
              }),
            }),
            undefined,
          );
          expect(spy.mock.calls[1][0].properties).not.toHaveProperty(
            'utm_campaign',
          );
        },
      );
    });

    it('preserves UTM properties when marketing consent is granted', async function () {
      await withController(
        {
          options: {
            state: {
              dataCollectionForMarketing: true,
            },
          },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'track');
          trackLegacyMetaMetricsPayload({
            event: 'Fake Event',
            category: 'Unit Test',
            properties: {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              utm_source: 'newsletter',
            },
            sensitiveProperties: {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              utm_campaign: 'spring-sale',
            },
          });

          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy.mock.calls[0][0].properties).toHaveProperty(
            'utm_source',
            'newsletter',
          );
          expect(spy.mock.calls[1][0].properties).toHaveProperty(
            'utm_campaign',
            'spring-sale',
          );
        },
      );
    });

    it('should throw if event not provided', async function () {
      await withController(({ controller }) => {
        expect(() => {
          // @ts-expect-error because we are testing the error case
          trackLegacyMetaMetricsPayload({ category: 'test' });
        }).toThrow(/Must specify event\./u);
      });
    });

    it('should throw if provided sensitiveProperties, when excludeMetaMetricsId is true', async function () {
      const captureExceptionSpy = jest
        .spyOn(sentry, 'captureException')
        .mockImplementation(jest.fn());

      await withController(async ({ controller }) => {
        trackLegacyMetaMetricsPayload(
          {
            event: 'Fake Event',
            category: 'Unit Test',
            sensitiveProperties: { foo: 'bar' },
          },
          { excludeMetaMetricsId: true },
        );
        await flushPromises();
        expect(captureExceptionSpy).toHaveBeenCalledWith(
          new Error(
            'sensitiveProperties was specified in an event payload that also set the excludeMetaMetricsId flag',
          ),
        );
      });
    });

    it('tracks sensitiveProperties in a separate event marked for anonymization', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'track');
        trackLegacyMetaMetricsPayload({
          event: 'Fake Event',
          category: 'Unit Test',
          sensitiveProperties: { foo: 'bar' },
        });
        expect(spy).toHaveBeenCalledTimes(2);

        expect(spy).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            event: 'Fake Event',
            userId: TEST_ANALYTICS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: expect.objectContaining(DEFAULT_EVENT_PROPERTIES),
          }),
          undefined,
        );
        expect(spy.mock.calls[0][0].properties).not.toHaveProperty('foo');

        expect(spy).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            event: 'Fake Event',
            userId: TEST_ANALYTICS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: expect.objectContaining({
              foo: 'bar',
              ...DEFAULT_EVENT_PROPERTIES,
            }),
          }),
          undefined,
        );
      });
    });

    it('injects one active assignment for a matching allowlisted event', async function () {
      AB_TEST_ANALYTICS_MAPPINGS.push({
        flagKey: TEST_BADGE_FLAG_KEY,
        validVariants: ['control', 'withBadge'],
        eventNames: ['Card Button Viewed'],
      });

      await withController(
        {
          remoteFeatureFlags: {
            [TEST_BADGE_FLAG_KEY]: 'withBadge',
          },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'track');

          trackLegacyMetaMetricsPayload({
            event: 'Card Button Viewed',
            category: 'Unit Test',
          });

          expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
              properties: expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                active_ab_tests: [
                  createActiveABTestAssignment(
                    TEST_BADGE_FLAG_KEY,
                    'withBadge',
                  ),
                ],
              }),
            }),
            undefined,
          );
        },
      );
    });

    it('injects multiple assignments for a single allowlisted event', async function () {
      AB_TEST_ANALYTICS_MAPPINGS.push(
        {
          flagKey: TEST_QUICK_AMOUNTS_FLAG_KEY,
          validVariants: ['control', 'treatment'],
          eventNames: ['Unified SwapBridge Page Viewed'],
        },
        {
          flagKey: TEST_LAYOUT_FLAG_KEY,
          validVariants: ['control', 'treatment'],
          eventNames: ['Unified SwapBridge Page Viewed'],
        },
      );

      await withController(
        {
          remoteFeatureFlags: {
            [TEST_QUICK_AMOUNTS_FLAG_KEY]: { name: 'treatment' },
            [TEST_LAYOUT_FLAG_KEY]: 'control',
          },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'track');

          trackLegacyMetaMetricsPayload({
            event: 'Unified SwapBridge Page Viewed',
            category: 'Unit Test',
          });

          expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
              properties: expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                active_ab_tests: [
                  createActiveABTestAssignment(
                    TEST_QUICK_AMOUNTS_FLAG_KEY,
                    'treatment',
                  ),
                  createActiveABTestAssignment(TEST_LAYOUT_FLAG_KEY, 'control'),
                ],
              }),
            }),
            undefined,
          );
        },
      );
    });

    it('merges with existing active_ab_tests and avoids duplicate keys', async function () {
      AB_TEST_ANALYTICS_MAPPINGS.push(
        {
          flagKey: TEST_QUICK_AMOUNTS_FLAG_KEY,
          validVariants: ['control', 'treatment'],
          eventNames: ['Unified SwapBridge Page Viewed'],
        },
        {
          flagKey: TEST_LAYOUT_FLAG_KEY,
          validVariants: ['control', 'treatment'],
          eventNames: ['Unified SwapBridge Page Viewed'],
        },
      );

      await withController(
        {
          remoteFeatureFlags: {
            [TEST_QUICK_AMOUNTS_FLAG_KEY]: 'treatment',
            [TEST_LAYOUT_FLAG_KEY]: 'treatment',
          },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'track');

          trackLegacyMetaMetricsPayload({
            event: 'Unified SwapBridge Page Viewed',
            category: 'Unit Test',
            properties: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              active_ab_tests: [
                {
                  key: TEST_QUICK_AMOUNTS_FLAG_KEY,
                  value: 'manual-value',
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  key_value_pair: 'incorrect=value',
                },
              ],
              // eslint-disable-next-line @typescript-eslint/naming-convention
              quote_count: 3,
            },
          });

          expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
              properties: expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                quote_count: 3,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                active_ab_tests: [
                  createActiveABTestAssignment(
                    TEST_QUICK_AMOUNTS_FLAG_KEY,
                    'manual-value',
                  ),
                  createActiveABTestAssignment(
                    TEST_LAYOUT_FLAG_KEY,
                    'treatment',
                  ),
                ],
              }),
            }),
            undefined,
          );
        },
      );
    });

    it('does not inject assignments for unrelated or invalid flags', async function () {
      AB_TEST_ANALYTICS_MAPPINGS.push({
        flagKey: TEST_BADGE_FLAG_KEY,
        validVariants: ['control', 'withBadge'],
        eventNames: ['Card Button Viewed'],
      });

      await withController(
        {
          remoteFeatureFlags: {
            [TEST_BADGE_FLAG_KEY]: 'unknown',
          },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'track');

          trackLegacyMetaMetricsPayload({
            event: 'Card Button Viewed',
            category: 'Unit Test',
            properties: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              test_prop: 'value',
            },
          });

          expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
              properties: expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                test_prop: 'value',
              }),
            }),
            undefined,
          );
          expect(spy.mock.calls[0][0].properties).not.toHaveProperty(
            'active_ab_tests',
          );
        },
      );
    });

    it('does not fetch feature flags for unmapped events', async function () {
      AB_TEST_ANALYTICS_MAPPINGS.push({
        flagKey: TEST_BADGE_FLAG_KEY,
        validVariants: ['control', 'withBadge'],
        eventNames: ['Card Button Viewed'],
      });
      const getManifestFlagsSpy = jest
        .spyOn(ManifestFlags, 'getManifestFlags')
        .mockReturnValue({});

      await withController(({ controller }) => {
        trackLegacyMetaMetricsPayload({
          event: 'Unrelated Event',
          category: 'Unit Test',
        });

        expect(getManifestFlagsSpy).not.toHaveBeenCalled();
      });
    });

    it('normalizes existing active_ab_tests for unmapped events without fetching feature flags', async function () {
      const getManifestFlagsSpy = jest
        .spyOn(ManifestFlags, 'getManifestFlags')
        .mockReturnValue({});

      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'track');

        trackLegacyMetaMetricsPayload({
          event: 'Unrelated Event',
          category: 'Unit Test',
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            active_ab_tests: [
              {
                key: TEST_BADGE_FLAG_KEY,
                value: 'withBadge',
              },
            ],
            // eslint-disable-next-line @typescript-eslint/naming-convention
            test_prop: 'value',
          },
        });

        expect(getManifestFlagsSpy).not.toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(
          expect.objectContaining({
            properties: expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              active_ab_tests: [
                createActiveABTestAssignment(TEST_BADGE_FLAG_KEY, 'withBadge'),
              ],
              // eslint-disable-next-line @typescript-eslint/naming-convention
              test_prop: 'value',
            }),
          }),
          undefined,
        );
      });
    });

    it('normalizes active_ab_tests before splitting sensitive events', async function () {
      const getManifestFlagsSpy = jest
        .spyOn(ManifestFlags, 'getManifestFlags')
        .mockReturnValue({});

      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'track');

        trackLegacyMetaMetricsPayload({
          event: 'Unrelated Event',
          category: 'Unit Test',
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            active_ab_tests: [
              {
                key: TEST_BADGE_FLAG_KEY,
                value: 'withBadge',
              },
            ],
          },
          sensitiveProperties: {
            sensitive: 'value',
          },
        });

        const normalizedAssignment = createActiveABTestAssignment(
          TEST_BADGE_FLAG_KEY,
          'withBadge',
        );

        expect(getManifestFlagsSpy).not.toHaveBeenCalled();
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            properties: expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              active_ab_tests: [normalizedAssignment],
            }),
          }),
          undefined,
        );
        expect(spy.mock.calls[0][0].properties).not.toHaveProperty('sensitive');

        expect(spy).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            properties: expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              active_ab_tests: [normalizedAssignment],
              sensitive: 'value',
            }),
          }),
          undefined,
        );
      });
    });

    it('enriches mapped events before splitting sensitive events', async function () {
      AB_TEST_ANALYTICS_MAPPINGS.push({
        flagKey: TEST_BADGE_FLAG_KEY,
        validVariants: ['control', 'withBadge'],
        eventNames: ['Card Button Viewed'],
      });

      await withController(
        {
          remoteFeatureFlags: {
            [TEST_BADGE_FLAG_KEY]: 'control',
          },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'track');

          trackLegacyMetaMetricsPayload({
            event: 'Card Button Viewed',
            category: 'Unit Test',
            properties: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              button_type: 'card',
            },
            sensitiveProperties: {
              sensitive: 'value',
            },
          });

          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
              properties: expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                button_type: 'card',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                active_ab_tests: [
                  createActiveABTestAssignment(TEST_BADGE_FLAG_KEY, 'control'),
                ],
              }),
            }),
            undefined,
          );
          expect(spy.mock.calls[0][0].properties).not.toHaveProperty(
            'sensitive',
          );
          expect(spy).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
              properties: expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                button_type: 'card',
                sensitive: 'value',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                active_ab_tests: [
                  createActiveABTestAssignment(TEST_BADGE_FLAG_KEY, 'control'),
                ],
              }),
            }),
            undefined,
          );
        },
      );
    });

    it('prefers manifest overrides over controller state flags', async function () {
      AB_TEST_ANALYTICS_MAPPINGS.push({
        flagKey: TEST_QUICK_AMOUNTS_FLAG_KEY,
        validVariants: ['control', 'treatment'],
        eventNames: ['Unified SwapBridge Page Viewed'],
      });
      jest.spyOn(ManifestFlags, 'getManifestFlags').mockReturnValue({
        remoteFeatureFlags: {
          [TEST_QUICK_AMOUNTS_FLAG_KEY]: { name: 'treatment' },
        },
      });

      await withController(
        {
          remoteFeatureFlags: {
            [TEST_QUICK_AMOUNTS_FLAG_KEY]: { name: 'control' },
          },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'track');

          trackLegacyMetaMetricsPayload({
            event: 'Unified SwapBridge Page Viewed',
            category: 'Unit Test',
          });

          expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
              properties: expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                active_ab_tests: [
                  createActiveABTestAssignment(
                    TEST_QUICK_AMOUNTS_FLAG_KEY,
                    'treatment',
                  ),
                ],
              }),
            }),
            undefined,
          );
        },
      );
    });
  });

  describe('profile identity event properties', function () {
    it('omits profile identity properties when srpSessionData is unavailable', async function () {
      await withController(() => {
        const spy = jest.spyOn(segmentMock, 'track');
        trackLegacyMetaMetricsPayload({
          event: 'Fake Event',
          category: 'Unit Test',
        });

        expect(spy).toHaveBeenCalledWith(
          expect.objectContaining({
            properties: expect.not.objectContaining(
              PROFILE_IDENTITY_EVENT_PROPERTIES,
            ),
          }),
          undefined,
        );
      });
    });

    it('includes profile identity properties on track events when srpSessionData is available', async function () {
      await withController(() => {
        updateProfileSessionData(SAMPLE_SRP_SESSION_DATA);

        const spy = jest.spyOn(segmentMock, 'track');
        trackLegacyMetaMetricsPayload({
          event: 'Fake Event',
          category: 'Unit Test',
        });

        expect(spy).toHaveBeenCalledWith(
          expect.objectContaining({
            properties: expect.objectContaining({
              ...DEFAULT_EVENT_PROPERTIES,
              ...PROFILE_IDENTITY_EVENT_PROPERTIES,
            }),
          }),
          undefined,
        );
      });
    });

    it('includes profile identity properties on page events when srpSessionData is available', async function () {
      await withController(() => {
        updateProfileSessionData(SAMPLE_SRP_SESSION_DATA);

        const spy = jest.spyOn(segmentMock, 'page');
        trackPage({
          name: 'home',
          environmentType: ENVIRONMENT_TYPE_BACKGROUND,
          page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
        });

        expect(spy).toHaveBeenCalledWith(
          expect.objectContaining({
            properties: expect.objectContaining({
              ...DEFAULT_PAGE_PROPERTIES,
              ...PROFILE_IDENTITY_EVENT_PROPERTIES,
            }),
          }),
          spy.mock.calls[0][1],
        );
      });
    });

    it('includes profile identity properties on the main event but not the anonymous duplicate', async function () {
      await withController(() => {
        updateProfileSessionData(SAMPLE_SRP_SESSION_DATA);

        const spy = jest.spyOn(segmentMock, 'track');
        trackLegacyMetaMetricsPayload({
          event: 'Signature Requested',
          category: 'Unit Test',
          properties: DEFAULT_EVENT_PROPERTIES,
          sensitiveProperties: { foo: 'bar' },
        });

        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.mock.calls[0][0].properties).toMatchObject({
          ...DEFAULT_EVENT_PROPERTIES,
          ...PROFILE_IDENTITY_EVENT_PROPERTIES,
        });
        expect(spy.mock.calls[1][0].properties).toMatchObject({
          foo: 'bar',
          ...DEFAULT_EVENT_PROPERTIES,
        });
        expect(spy.mock.calls[1][0].properties).not.toHaveProperty(
          'profile_id',
        );
        expect(spy.mock.calls[1][0].properties).not.toHaveProperty(
          'canonical_profile_id',
        );
      });
    });
  });

  describe('Sensitive transaction and signature events', function () {
    it('keeps the original event name and marks anonymous-only tracks', async function () {
      await withController(
        {
          options: {
            state: {
              fragments: {},
            },
          },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'track');
          trackLegacyMetaMetricsPayload(
            {
              event: 'Signature Requested',
              category: 'Unit Test',
              properties: DEFAULT_EVENT_PROPERTIES,
            },
            { excludeMetaMetricsId: true },
          );

          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
              event: 'Signature Requested',
              properties: expect.objectContaining({
                ...DEFAULT_EVENT_PROPERTIES,
              }),
            }),
            undefined,
          );
        },
      );
    });

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      'Signature Requested',
      'Signature Rejected',
      'Signature Approved',
    ])(
      'keeps the original event name before the platform adapter handles anonymous tracks for "%s"',
      async (eventType: string) => {
        await withController(({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'track');
          trackLegacyMetaMetricsPayload({
            event: eventType,
            category: 'Unit Test',
            properties: DEFAULT_EVENT_PROPERTIES,
            sensitiveProperties: { foo: 'bar' },
          });

          expect(spy).toHaveBeenCalledTimes(2);

          expect(spy.mock.calls[0][0]).toMatchObject({
            event: eventType,
            properties: expect.objectContaining({
              ...DEFAULT_EVENT_PROPERTIES,
            }),
          });
          expect(spy.mock.calls[0][0].properties).not.toHaveProperty('foo');

          expect(spy.mock.calls[1][0]).toMatchObject({
            event: eventType,
            properties: expect.objectContaining({
              foo: 'bar',
              ...DEFAULT_EVENT_PROPERTIES,
            }),
          });
        });
      },
    );
  });

  describe('Sensitive transaction lifecycle events', function () {
    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      'Transaction Added',
      'Transaction Submitted',
      'Transaction Finalized',
    ])(
      'keeps the original event name before the platform adapter handles anonymous tracks for "%s"',
      async (eventType: string) => {
        await withController(({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'track');
          trackLegacyMetaMetricsPayload({
            event: eventType,
            category: 'Unit Test',
            sensitiveProperties: { foo: 'bar' },
          });
          expect(spy).toHaveBeenCalledTimes(2);

          expect(spy.mock.calls[0][0]).toMatchObject({
            event: eventType,
            properties: expect.objectContaining(DEFAULT_EVENT_PROPERTIES),
          });
          expect(spy.mock.calls[0][0].properties).not.toHaveProperty('foo');

          expect(spy.mock.calls[1][0]).toMatchObject({
            event: eventType,
            properties: expect.objectContaining({
              foo: 'bar',
              ...DEFAULT_EVENT_PROPERTIES,
            }),
          });
        });
      },
    );
  });

  describe('trackPage', function () {
    it('should track a page view', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'page');
        trackPage({
          name: 'home',
          environmentType: ENVIRONMENT_TYPE_BACKGROUND,
          page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
        });
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(
          {
            name: 'home',
            userId: TEST_ANALYTICS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: {
              params: undefined,
              ...DEFAULT_PAGE_PROPERTIES,
            },
          },
          spy.mock.calls[0][1],
        );
      });
    });

    it('should send chain_id_caip and null chain_id when a non-EVM network is selected', async function () {
      await withController(
        {
          mockMultichainNetworkState: {
            isEvmSelected: false,
            selectedMultichainNetworkChainId:
              'bip122:000000000019d6689c085ae165831e93',
          },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'page');
          trackPage({
            name: 'New Confirmation Page',
            environmentType: ENVIRONMENT_TYPE_BACKGROUND,
            page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
          });
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(
            {
              name: 'New Confirmation Page',
              userId: TEST_ANALYTICS_ID,
              context: DEFAULT_TEST_CONTEXT,
              properties: {
                params: undefined,
                locale: LOCALE.replace('_', '-'),
                // eslint-disable-next-line @typescript-eslint/naming-convention
                chain_id: null,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                chain_id_caip: 'bip122:000000000019d6689c085ae165831e93',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                environment_type: 'background',
              },
            },
            spy.mock.calls[0][1],
          );
          expect(spy.mock.calls[0][0].properties).toHaveProperty(
            'chain_id_caip',
          );
        },
      );
    });

    it('should keep EVM chain_id and omit chain_id_caip when an EVM network is selected', async function () {
      await withController(
        {
          mockMultichainNetworkState: {
            isEvmSelected: true,
            selectedMultichainNetworkChainId: 'eip155:1',
          },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'page');
          trackPage({
            name: 'home',
            environmentType: ENVIRONMENT_TYPE_BACKGROUND,
            page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
          });
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(
            {
              name: 'home',
              userId: TEST_ANALYTICS_ID,
              context: DEFAULT_TEST_CONTEXT,
              properties: {
                params: undefined,
                ...DEFAULT_PAGE_PROPERTIES,
              },
            },
            spy.mock.calls[0][1],
          );
          expect(spy.mock.calls[0][0].properties).not.toHaveProperty(
            'chain_id_caip',
          );
        },
      );
    });

    it('preserves falsy page view properties except undefined', async function () {
      await withController(
        {
          currentLocale: '',
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'page');
          trackPage({
            name: 'home',
            page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
          });

          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
              properties: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                chain_id: DEFAULT_CHAIN_ID,
                locale: '',
              },
            }),
            spy.mock.calls[0][1],
          );
        },
      );
    });

    it('should not track a page view if user is not participating in metametrics', async function () {
      await withController(
        {
          analyticsControllerState: { optedIn: false },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'page');
          trackPage({
            name: 'home',
            environmentType: ENVIRONMENT_TYPE_BACKGROUND,
            page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
          });
          expect(spy).toHaveBeenCalledTimes(0);
        },
      );
    });
  });

  describe('setMarketingCampaignCookieId', function () {
    it('should update marketingCampaignCookieId in the context when cookieId is available', async function () {
      await withController(
        {
          options: {
            state: {
              dataCollectionForMarketing: true,
            },
          },
        },
        ({ controller }) => {
          controller.setMarketingCampaignCookieId(TEST_GA_COOKIE_ID);
          expect(controller.state.marketingCampaignCookieId).toStrictEqual(
            TEST_GA_COOKIE_ID,
          );
          const spy = jest.spyOn(segmentMock, 'track');
          trackLegacyMetaMetricsPayload({
            event: 'Fake Event',
            category: 'Unit Test',
            properties: {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              chain_id: '1',
            },
          });
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(
            {
              event: 'Fake Event',
              userId: TEST_ANALYTICS_ID,
              context: {
                ...DEFAULT_TEST_CONTEXT,
                marketingCampaignCookieId: TEST_GA_COOKIE_ID,
              },
              properties: {
                ...DEFAULT_EVENT_PROPERTIES,
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                chain_id: '1',
              },
            },
            spy.mock.calls[0][1],
          );
        },
      );
    });
  });
  describe('setDataCollectionForMarketing', function () {
    it('should nullify the marketingCampaignCookieId when Data collection for marketing is toggled off', async function () {
      await withController(
        {
          options: {
            state: {
              dataCollectionForMarketing: true,
              marketingCampaignCookieId: TEST_GA_COOKIE_ID,
            },
          },
        },
        async ({ controller }) => {
          expect(controller.state.marketingCampaignCookieId).toStrictEqual(
            TEST_GA_COOKIE_ID,
          );
          await controller.setDataCollectionForMarketing(false);
          expect(controller.state.marketingCampaignCookieId).toStrictEqual(
            null,
          );
        },
      );
    });
  });
  describe('updateExtensionUninstallUrl', function () {
    it('should include extension version in uninstall URL regardless of MetaMetrics participation', async function () {
      await withController(({ controller }) => {
        const setUninstallURLSpy = jest.spyOn(
          MOCK_EXTENSION.runtime,
          'setUninstallURL',
        );

        // Test with MetaMetrics disabled
        controller.updateExtensionUninstallUrl(false, 'test-id');
        expect(setUninstallURLSpy).toHaveBeenCalledWith(
          expect.stringContaining(`av=${VERSION}`),
        );
        expect(setUninstallURLSpy).toHaveBeenCalledWith(
          expect.not.stringContaining('mmi='),
        );
        expect(setUninstallURLSpy).toHaveBeenCalledWith(
          expect.not.stringContaining('env='),
        );

        // Test with MetaMetrics enabled
        controller.updateExtensionUninstallUrl(true, 'test-id');
        expect(setUninstallURLSpy).toHaveBeenCalledWith(
          expect.stringContaining(`av=${VERSION}`),
        );
        expect(setUninstallURLSpy).toHaveBeenCalledWith(
          expect.stringContaining('mmi='),
        );
        expect(setUninstallURLSpy).toHaveBeenCalledWith(
          expect.stringContaining('env='),
        );
      });
    });
  });

  describe('metadata', () => {
    it('includes expected state in debug snapshots', async () => {
      await withController(
        // Set `fragments` to an empty object to override complex default `fragments` mock state.
        {
          options: { state: { fragments: {} } },
        },
        ({ controller }) => {
          expect(
            deriveStateFromMetadata(
              controller.state,
              controller.metadata,
              'includeInDebugSnapshot',
            ),
          ).toMatchInlineSnapshot(`
            {
              "marketingCampaignCookieId": null,
            }
          `);
        },
      );
    });

    it('includes expected state in state logs', async () => {
      await withController(
        // Set `fragments` to an empty object to override complex default `fragments` mock state.
        {
          options: { state: { fragments: {} } },
        },
        ({ controller }) => {
          expect(
            deriveStateFromMetadata(
              controller.state,
              controller.metadata,
              'includeInStateLogs',
            ),
          ).toMatchInlineSnapshot(`
            {
              "dataCollectionForMarketing": null,
              "fragments": {},
              "marketingCampaignCookieId": null,
              "tracesBeforeMetricsOptIn": [],
              "traits": {},
            }
          `);
        },
      );
    });

    it('persists expected state', async () => {
      await withController(
        // Set `fragments` to an empty object to override complex default `fragments` mock state.
        {
          options: { state: { fragments: {} } },
        },
        ({ controller }) => {
          expect(
            deriveStateFromMetadata(
              controller.state,
              controller.metadata,
              'persist',
            ),
          ).toMatchInlineSnapshot(`
            {
              "dataCollectionForMarketing": null,
              "fragments": {},
              "marketingCampaignCookieId": null,
              "tracesBeforeMetricsOptIn": [],
              "traits": {},
            }
          `);
        },
      );
    });

    it('exposes expected state to UI', async () => {
      await withController(
        // Set `fragments` to an empty object to override complex default `fragments` mock state.
        {
          options: { state: { fragments: {} } },
        },
        ({ controller }) => {
          expect(
            deriveStateFromMetadata(
              controller.state,
              controller.metadata,
              'usedInUi',
            ),
          ).toMatchInlineSnapshot(`
            {
              "dataCollectionForMarketing": null,
              "fragments": {},
            }
          `);
        },
      );
    });
  });
});

// The root messenger also hosts the AnalyticsController handlers that the
// analytics module calls directly, which are no longer part of the
// MetaMetricsController allowlist.
type RootMessenger = Messenger<
  MockAnyNamespace,
  | AllowedActions
  | AnalyticsControllerOptInAction
  | AnalyticsControllerOptOutAction
  | AnalyticsControllerResetConsentDecisionAction
  | AnalyticsControllerIdentifyAction
  | AnalyticsControllerTrackEventAction
  | AnalyticsControllerTrackViewAction,
  AllowedEvents
>;

type MetaMetricsControllerTestState = Partial<MetaMetricsControllerState>;

type AnalyticsTrackingEventPayload = {
  readonly name: string;
  properties: Record<string, unknown>;
  sensitiveProperties: Record<string, unknown>;
  readonly hasProperties: boolean;
};

type WithControllerOptions = {
  currentLocale?: string;
  analyticsControllerState?: Partial<AnalyticsControllerState>;
  options?: Partial<Omit<MetaMetricsControllerOptions, 'state'>> & {
    state?: MetaMetricsControllerTestState;
  };
  remoteFeatureFlags?: Record<string, unknown>;
  mockNetworkClientConfigurationsByNetworkClientId?: Record<
    NetworkClientId,
    {
      chainId: string;
    }
  >;
  mockMultichainNetworkState?: {
    isEvmSelected: boolean;
    selectedMultichainNetworkChainId: string;
  };
};

type WithControllerCallback<ReturnValue> = ({
  controller,
  controllerMessenger,
  triggerPreferencesControllerStateChange,
  triggerNetworkDidChange,
}: {
  controller: MetaMetricsController;
  controllerMessenger: Messenger<
    'MetaMetricsController',
    AllowedActions,
    AllowedEvents,
    RootMessenger
  >;
  triggerPreferencesControllerStateChange: (
    state: PreferencesControllerState,
  ) => void;
  triggerNetworkDidChange(state: NetworkState): void;
}) => ReturnValue;

type WithControllerArgs<ReturnValue> =
  | [WithControllerCallback<ReturnValue>]
  | [WithControllerOptions, WithControllerCallback<ReturnValue>];

async function withController<ReturnValue>(
  ...args: WithControllerArgs<ReturnValue>
): Promise<ReturnValue> {
  try {
    globalThis.sentry = {};
    jest.useFakeTimers().setSystemTime(new Date().getTime());
    jest.spyOn(Utils, 'generateRandomId').mockReturnValue('DUMMY_RANDOM_ID');

    const [{ ...rest }, fn] = args.length === 2 ? args : [{}, args[0]];
    const {
      options = {},
      analyticsControllerState,
      currentLocale = LOCALE,
      remoteFeatureFlags = {},
      mockNetworkClientConfigurationsByNetworkClientId = {
        selectedNetworkClientId: {
          chainId: DEFAULT_CHAIN_ID,
        },
      },
      mockMultichainNetworkState = {
        isEvmSelected: true,
        selectedMultichainNetworkChainId: 'eip155:1',
      },
    } = rest;

    const mmcState = merge(
      {},
      {
        marketingCampaignCookieId: null,
        fragments: {
          testid: SAMPLE_PERSISTED_EVENT,
          testid2: SAMPLE_NON_PERSISTED_EVENT,
        },
      },
      options.state ?? {},
    ) as MetaMetricsControllerState;

    if (options.state && Object.hasOwn(options.state, 'fragments')) {
      mmcState.fragments = options.state.fragments ?? {};
    }

    const messenger: RootMessenger = new Messenger({
      namespace: MOCK_ANY_NAMESPACE,
    });

    messenger.registerActionHandler(
      'PreferencesController:getState',
      jest.fn().mockReturnValue({
        currentLocale,
        useExternalServices: true,
      }),
    );

    messenger.registerActionHandler(
      'NetworkController:getState',
      jest.fn().mockReturnValue({
        selectedNetworkClientId: Object.keys(
          mockNetworkClientConfigurationsByNetworkClientId,
        )[0],
      }),
    );

    messenger.registerActionHandler(
      'NetworkController:getNetworkClientById',
      jest.fn().mockReturnValue({
        configuration: Object.values(
          mockNetworkClientConfigurationsByNetworkClientId,
        )[0],
      }),
    );

    messenger.registerActionHandler(
      'RemoteFeatureFlagController:getState',
      jest.fn().mockReturnValue({
        remoteFeatureFlags,
      }),
    );

    messenger.registerActionHandler(
      'MultichainNetworkController:getState',
      jest.fn().mockReturnValue(mockMultichainNetworkState),
    );

    const mockAnalyticsControllerState: AnalyticsControllerState = {
      ...MOCK_ANALYTICS_CONTROLLER_OPTED_IN,
      ...(analyticsControllerState ?? {}),
    };

    messenger.registerActionHandler('AnalyticsController:getState', () => ({
      ...mockAnalyticsControllerState,
    }));

    messenger.registerActionHandler('AnalyticsController:optIn', async () => {
      mockAnalyticsControllerState.optedIn = true;
      mockAnalyticsControllerState.consentDecisionMade = true;
    });

    messenger.registerActionHandler('AnalyticsController:optOut', () => {
      mockAnalyticsControllerState.optedIn = false;
      mockAnalyticsControllerState.consentDecisionMade = true;
    });

    messenger.registerActionHandler(
      'AnalyticsController:resetConsentDecision',
      () => {
        mockAnalyticsControllerState.optedIn = false;
        mockAnalyticsControllerState.consentDecisionMade = false;
      },
    );

    const analyticsMessenger = getAnalyticsControllerInitMessenger(
      messenger as Parameters<typeof getAnalyticsControllerInitMessenger>[0],
    );
    const enrichmentContext = createEnrichmentContext(
      analyticsMessenger,
      '0.0.1-test',
      getProfileIdentityProperties,
    );

    // Emulate the analytics platform adapter: every Segment payload is built
    // here and passed straight to `segmentMock`, preserving the existing
    // spy-based assertions in tests.
    messenger.registerActionHandler('AnalyticsController:identify', ((
      traits?: AnalyticsUserTraits,
      context?: AnalyticsContext,
    ) => {
      if (!traits) {
        return;
      }
      const payload: Record<string, unknown> = {
        userId: mockAnalyticsControllerState.analyticsId,
        traits,
      };
      if (context) {
        payload.context = context;
      }
      segmentMock.identify(payload as never, undefined);
    }) as never);

    messenger.registerActionHandler('AnalyticsController:trackEvent', ((
      event: AnalyticsTrackingEventPayload,
      context?: AnalyticsContext,
    ) => {
      if (!mockAnalyticsControllerState.optedIn) {
        return;
      }

      if (!enrichmentContext.hasBasicFunctionalityEnabled()) {
        return;
      }

      const enrichedContext = enrichEventContext(context, enrichmentContext);

      const buildPayload = (properties?: Record<string, unknown>) => {
        const abEnrichedProperties = enrichWithABTestAnalytics(
          event.name,
          (properties ?? {}) as AnalyticsEventProperties,
          enrichmentContext,
        );
        const enrichedProperties = enrichEventProperties(
          abEnrichedProperties,
          enrichmentContext,
        );
        const payload: Record<string, unknown> = {
          userId: mockAnalyticsControllerState.analyticsId,
          event: event.name,
          properties: enrichedProperties,
          context: enrichedContext,
        };
        return payload;
      };

      if (!event.hasProperties) {
        segmentMock.track(buildPayload() as never, undefined);
        return;
      }

      const hasSensitiveProperties =
        Object.keys(event.sensitiveProperties ?? {}).length > 0;

      if (!hasSensitiveProperties) {
        segmentMock.track(buildPayload(event.properties) as never, undefined);
        return;
      }

      segmentMock.track(buildPayload(event.properties) as never, undefined);
      const sanitizedProperties: Record<string, unknown> = {
        ...event.properties,
        ...event.sensitiveProperties,
        anonymous: true,
      };
      delete sanitizedProperties.profile_id;
      delete sanitizedProperties.canonical_profile_id;
      segmentMock.track(buildPayload(sanitizedProperties) as never, undefined);
    }) as never);

    messenger.registerActionHandler('AnalyticsController:trackView', ((
      name: string,
      properties?: Record<string, unknown>,
      context?: AnalyticsContext,
    ) => {
      if (!mockAnalyticsControllerState.optedIn) {
        return;
      }

      if (!enrichmentContext.hasBasicFunctionalityEnabled()) {
        return;
      }

      const enrichedProperties = enrichEventProperties(
        (properties ?? {}) as AnalyticsEventProperties,
        enrichmentContext,
      );
      const pageChainProperties = enrichmentContext.getPageChainProperties();
      Object.assign(enrichedProperties, pageChainProperties);
      if (!('chain_id_caip' in pageChainProperties)) {
        delete enrichedProperties.chain_id_caip;
      }
      const enrichedContext = enrichEventContext(context, enrichmentContext);
      segmentMock.page(
        {
          userId: mockAnalyticsControllerState.analyticsId,
          name,
          properties: enrichedProperties,
          context: enrichedContext,
        } as never,
        undefined,
      );
    }) as never);

    const metaMetricsControllerMessenger = new Messenger<
      'MetaMetricsController',
      AllowedActions,
      AllowedEvents,
      RootMessenger
    >({
      namespace: 'MetaMetricsController',
      parent: messenger,
    });
    messenger.delegate({
      messenger: metaMetricsControllerMessenger,
      actions: [
        'AnalyticsController:getState',
        'PreferencesController:getState',
        'NetworkController:getState',
        'NetworkController:getNetworkClientById',
        'RemoteFeatureFlagController:getState',
        'MultichainNetworkController:getState',
      ],
      events: [
        'PreferencesController:stateChange',
        'NetworkController:networkDidChange',
      ],
    });

    configureAnalytics({
      messenger: analyticsMessenger,
    });
    configureOptOutSegmentEnrichment(enrichmentContext);

    return fn({
      controller: new MetaMetricsController({
        messenger: metaMetricsControllerMessenger,
        version: '0.0.1',
        environment: 'test',
        extension: MOCK_EXTENSION,
        ...options,
        state: mmcState,
      }),
      controllerMessenger: metaMetricsControllerMessenger,
      triggerPreferencesControllerStateChange: (state) =>
        messenger.publish('PreferencesController:stateChange', state, []),
      triggerNetworkDidChange: (state) =>
        messenger.publish('NetworkController:networkDidChange', state),
    });
  } finally {
    // clear the queues manually after each test
    segmentMock.queue.length = 0;
    jest.useRealTimers();
    jest.restoreAllMocks();
  }
}
