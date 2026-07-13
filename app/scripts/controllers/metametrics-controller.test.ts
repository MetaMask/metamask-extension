import { toHex } from '@metamask/controller-utils';
import type {
  NetworkClientId,
  NetworkState,
} from '@metamask/network-controller';
import type {
  AnalyticsContext,
  AnalyticsControllerState,
  AnalyticsEventProperties,
  AnalyticsUserTraits,
} from '@metamask/analytics-controller';
import { AddressBookEntry } from '@metamask/address-book-controller';
import { NameEntry, NameType } from '@metamask/name-controller';
import {
  Nft,
  Token,
  TokensControllerState,
} from '@metamask/assets-controllers';
import {
  AuthConnection,
  type SeedlessOnboardingControllerState,
} from '@metamask/seedless-onboarding-controller';
import {
  EthAccountType,
  BtcAccountType,
  SolAccountType,
} from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { Browser } from 'webextension-polyfill';
import { deriveStateFromMetadata } from '@metamask/base-controller';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import { merge } from 'lodash';
import { ThemeType } from '../../../shared/constants/preferences';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import {
  DEVICE_TYPE,
  ENVIRONMENT_TYPE_BACKGROUND,
  OS,
  PLATFORM_CHROME,
} from '../../../shared/constants/app';
import { createSegmentMock, segment } from '../lib/segment';
import {
  METAMETRICS_BACKGROUND_PAGE_OBJECT,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
  MetaMetricsUserTraits,
  type MetaMetricsEventOptions,
  type MetaMetricsEventPayload,
} from '../../../shared/constants/metametrics';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { KeyringType } from '../../../shared/constants/keyring';
import { LedgerTransportTypes } from '../../../shared/constants/hardware-wallets';
import {
  AB_TEST_ANALYTICS_MAPPINGS,
  clearABTestAnalyticsMappings,
} from '../../../shared/lib/ab-testing/ab-test-analytics';
import { createActiveABTestAssignment } from '../../../shared/lib/ab-testing/active-ab-test-assignment';
import * as ManifestFlags from '../../../shared/lib/manifestFlags';
import * as Utils from '../lib/util';
import { mockNetworkState } from '../../../test/stub/networks';
import { flushPromises } from '../../../test/lib/timer-helpers';
import {
  createMockInternalAccount,
  createMockInternalAccounts,
} from '../../../test/data/mock-accounts';
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
import * as analyticsHelpers from './analytics/analytics';
import {
  configureAnalytics,
  createEventBuilder,
  getProfileIdentityProperties,
  identify,
  trackEvent,
  trackPage,
  updateProfileSessionData,
} from './analytics';
import {
  MetaMetricsController,
  AllowedActions,
  AllowedEvents,
  MetaMetricsControllerOptions,
  type MetaMaskState,
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
        ...(payload.category === undefined ? {} : { category: payload.category }),
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
        expect(controller.state.completedMetaMetricsOnboarding).toBe(true);
        expect(controller.state.marketingCampaignCookieId).toStrictEqual(null);
        expect(
          controllerMessenger.call('AnalyticsController:getState').analyticsId,
        ).toStrictEqual(TEST_ANALYTICS_ID);
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
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

  describe('setParticipateInMetaMetrics', function () {
    it('should update the value of participateInMetaMetrics', async function () {
      await withController(
        {
          options: {
            state: { completedMetaMetricsOnboarding: false },
          },
          analyticsControllerState: { optedIn: false },
        },
        async ({ controller, controllerMessenger }) => {
          expect(controller.state.completedMetaMetricsOnboarding).toBe(false);
          await controller.setParticipateInMetaMetrics(true);
          expect(controller.state.completedMetaMetricsOnboarding).toBe(true);
          expect(
            controllerMessenger.call('AnalyticsController:getState').optedIn,
          ).toBe(true);
          await controller.setParticipateInMetaMetrics(false);
          expect(
            controllerMessenger.call('AnalyticsController:getState').optedIn,
          ).toBe(false);
        },
      );
    });
    it('should not nullify the analyticsId when set to false', async function () {
      await withController(async ({ controller, controllerMessenger }) => {
        await controller.setParticipateInMetaMetrics(false);
        expect(
          controllerMessenger.call('AnalyticsController:getState').analyticsId,
        ).toStrictEqual(TEST_ANALYTICS_ID);
      });
    });
    it('should nullify the marketingCampaignCookieId when participateInMetaMetrics is toggled off', async function () {
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
          await controller.setParticipateInMetaMetrics(false);
          expect(controller.state.marketingCampaignCookieId).toStrictEqual(
            null,
          );
        },
      );
    });
  });

  describe('handleMetaMaskStateUpdate', function () {
    it('updates the profile when install attribution traits arrive after opt-in', async function () {
      await withController(
        {
          analyticsControllerState: { optedIn: false },
          options: {
            state: {
              completedMetaMetricsOnboarding: false,
              dataCollectionForMarketing: false,
              traits: {},
            },
          },
        },
        async ({ controller }) => {
          await controller.setParticipateInMetaMetrics(true);
          const identifySpy = jest
            .spyOn(analyticsHelpers, 'identify')
            .mockImplementation(() => undefined);

          const metaMaskState = {
            addressBook: {},
            allNfts: {},
            allTokens: {},
            ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
            internalAccounts: {
              accounts: {
                mock1: {} as InternalAccount,
              },
              selectedAccount: 'mock1',
            },
            multichainNetworkConfigurationsByChainId: {},
            ledgerTransportType: LedgerTransportTypes.webhid,
            openSeaEnabled: true,
            useNftDetection: false,
            securityAlertsEnabled: true,
            theme: 'default' as ThemeType,
            useTokenDetection: true,
            names: {
              ethereumAddress: {},
            },
            completedMetaMetricsOnboarding: true,
            optedIn: true,
            analyticsId: TEST_ANALYTICS_ID,
            currentCurrency: 'usd',
            dataCollectionForMarketing: false,
            preferences: {
              privacyMode: true,
              tokenNetworkFilter: {},
              tokenSortConfig: {
                key: 'token-sort-key',
                order: 'dsc',
                sortCallback: 'stringNumeric',
              },
              showNativeTokenAsMainBalance: true,
            } as Preferences,
            srpSessionData: undefined,
            keyrings: [],
            firstTimeFlowType: FirstTimeFlowType.create,
          };

          controller.handleMetaMaskStateUpdate(metaMaskState);

          expect(identifySpy).toHaveBeenCalledTimes(1);

          controller.updateTraits({
            [MetaMetricsUserTrait.CookieId]: 'GA1.1.12345.67890',
            [MetaMetricsUserTrait.GaClientId]: '12345.67890',
          });

          controller.handleMetaMaskStateUpdate(metaMaskState);

          expect(identifySpy).toHaveBeenCalledTimes(2);
          expect(identifySpy).toHaveBeenLastCalledWith({
            [MetaMetricsUserTrait.CookieId]: 'GA1.1.12345.67890',
            [MetaMetricsUserTrait.GaClientId]: '12345.67890',
          });
        },
      );
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
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
      await withController(({ controller }) => {
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
      await withController(({ controller }) => {
        jest.spyOn(controller, '_buildUserTraitsObject').mockReturnValue(null);
        controller.handleMetaMaskStateUpdate({
          srpSessionData: SAMPLE_SRP_SESSION_DATA,
        } as unknown as MetaMaskState);

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
      await withController(({ controller }) => {
        jest.spyOn(controller, '_buildUserTraitsObject').mockReturnValue(null);
        controller.handleMetaMaskStateUpdate({
          srpSessionData: SAMPLE_SRP_SESSION_DATA,
        } as unknown as MetaMaskState);

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
      await withController(({ controller }) => {
        jest.spyOn(controller, '_buildUserTraitsObject').mockReturnValue(null);
        controller.handleMetaMaskStateUpdate({
          srpSessionData: SAMPLE_SRP_SESSION_DATA,
        } as unknown as MetaMaskState);

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

  function buildStateWithAccounts(
    accounts: Record<string, InternalAccount>,
  ): Parameters<MetaMetricsController['_buildUserTraitsObject']>[0] {
    return {
      addressBook: {},
      allNfts: {},
      allTokens: {},
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
      internalAccounts: {
        accounts,
        selectedAccount: Object.keys(accounts)[0] ?? '',
      },
      multichainNetworkConfigurationsByChainId: {},
      ledgerTransportType: LedgerTransportTypes.webhid,
      openSeaEnabled: false,
      useNftDetection: false,
      theme: 'default' as ThemeType,
      useTokenDetection: false,
      names: {
        [NameType.ETHEREUM_ADDRESS]: {},
      },
      currentCurrency: 'usd',
      securityAlertsEnabled: false,
      completedMetaMetricsOnboarding: true,
      optedIn: true,
      analyticsId: '',
      dataCollectionForMarketing: false,
      preferences: {
        privacyMode: false,
        tokenNetworkFilter: {},
        tokenSortConfig: {
          key: '',
          order: 'dsc',
          sortCallback: 'stringNumeric',
        },
        showNativeTokenAsMainBalance: false,
      } as Preferences,
      srpSessionData: undefined,
      keyrings: [],
      firstTimeFlowType: FirstTimeFlowType.create,
    };
  }

  const buildKeyringAccount = (id: string, keyringType: string) => ({
    id,
    metadata: { keyring: { type: keyringType } },
  });

  const buildMnemonicEntropyAccount = ({
    id,
    entropyId,
    groupIndex,
    derivationPath,
    keyringType = KeyringType.hdKeyTree,
  }: {
    id: string;
    entropyId: string;
    groupIndex: number;
    derivationPath?: string;
    keyringType?: string;
  }) => ({
    ...buildKeyringAccount(id, keyringType),
    options: {
      entropy: {
        type: 'mnemonic' as const,
        id: entropyId,
        groupIndex,
        ...(derivationPath ? { derivationPath } : {}),
      },
    },
  });

  describe('_buildUserTraitsObject', function () {
    beforeEach(() => {
      jest.spyOn(Utils, 'getPlatform').mockReturnValue(PLATFORM_CHROME);
      jest.spyOn(Utils, 'getDeviceType').mockReturnValue(DEVICE_TYPE.DESKTOP);
      jest.spyOn(Utils, 'getOs').mockReturnValue(OS.MACOS);
    });

    it('should return full user traits object on first call', async function () {
      const MOCK_ALL_TOKENS: TokensControllerState['allTokens'] = {
        [toHex(1)]: {
          '0x1235ce91d74254f29d4609f25932fe6d97bf4842': [
            {
              address: '0xd2cea331e5f5d8ee9fb1055c297795937645de91',
            },
            {
              address: '0xabc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
            },
          ] as Token[],
          '0xe364b0f9d1879e53e8183055c9d7dd2b7375d86b': [
            {
              address: '0xd2cea331e5f5d8ee9fb1055c297795937645de91',
            },
          ] as Token[],
        },
        [toHex(4)]: {
          '0x1235ce91d74254f29d4609f25932fe6d97bf4842': [
            {
              address: '0xd2cea331e5f5d8ee9fb1055c297795937645de91',
            },
            {
              address: '0x12317F958D2ee523a2206206994597C13D831ec7',
            },
          ] as Token[],
        },
      };

      await withController(({ controller }) => {
        controller.updateTraits({
          [MetaMetricsUserTrait.StorageKind]: 'split',
        });

        const traits = controller._buildUserTraitsObject({
          addressBook: {
            [CHAIN_IDS.MAINNET]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
            },
            [CHAIN_IDS.GOERLI]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
              '0x0': {
                address: '0x0',
              } as AddressBookEntry,
            },
          },
          allNfts: {
            '0xac706cE8A9BF27Afecf080fB298d0ee13cfb978A': {
              [toHex(56)]: [
                {
                  address: '0xd2cea331e5f5d8ee9fb1055c297795937645de91',
                  tokenId: '100',
                },
                {
                  address: '0xd2cea331e5f5d8ee9fb1055c297795937645de91',
                  tokenId: '101',
                },
                {
                  address: '0x7488d2ce5deb26db021285b50b661d655eb3d3d9',
                  tokenId: '99',
                },
              ] as Nft[],
            },
            '0xe04AB39684A24D8D4124b114F3bd6FBEB779cacA': {
              [toHex(59)]: [
                {
                  address: '0x63d646bc7380562376d5de205123a57b1718184d',
                  tokenId: '14',
                },
              ] as Nft[],
            },
          },
          allTokens: MOCK_ALL_TOKENS,
          ...mockNetworkState(
            { chainId: CHAIN_IDS.MAINNET },
            { chainId: CHAIN_IDS.GOERLI },
            { chainId: '0xaf' },
          ),
          internalAccounts: {
            accounts: {
              mock1: {} as InternalAccount,
              mock2: {} as InternalAccount,
            },
            selectedAccount: 'mock1',
          },
          multichainNetworkConfigurationsByChainId: {
            'bip122:000000000019d6689c085ae165831e93': {
              chainId: 'bip122:000000000019d6689c085ae165831e93',
              isEvm: false,
              name: 'Bitcoin Mainnet',
              nativeCurrency:
                'bip122:000000000019d6689c085ae165831e93/slip44:0',
            },
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
              chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
              isEvm: false,
              name: 'Solana Mainnet',
              nativeCurrency:
                'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            },
          },
          ledgerTransportType: LedgerTransportTypes.webhid,
          openSeaEnabled: true,
          useNftDetection: false,
          securityAlertsEnabled: true,
          theme: 'default' as ThemeType,
          useTokenDetection: true,
          names: {
            [NameType.ETHEREUM_ADDRESS]: {
              '0x123': {
                '0x1': {
                  name: 'Test 1',
                } as NameEntry,
                '0x2': {
                  name: 'Test 2',
                } as NameEntry,
                '0x3': {
                  name: null,
                } as NameEntry,
              },
              '0x456': {
                '0x1': {
                  name: 'Test 3',
                } as NameEntry,
              },
              '0x789': {
                '0x1': {
                  name: null,
                } as NameEntry,
              },
            },
          },
          completedMetaMetricsOnboarding: true,
          optedIn: true,
          analyticsId: TEST_ANALYTICS_ID,
          currentCurrency: 'usd',
          dataCollectionForMarketing: false,
          preferences: {
            privacyMode: true,
            tokenNetworkFilter: {},
            tokenSortConfig: {
              key: 'token-sort-key',
              order: 'dsc',
              sortCallback: 'stringNumeric',
            },
            showNativeTokenAsMainBalance: true,
          } as Preferences,
          srpSessionData: undefined,
          keyrings: [],
          firstTimeFlowType: FirstTimeFlowType.create,
        });

        expect(traits).toStrictEqual({
          [MetaMetricsUserTrait.AddressBookEntries]: 3,
          [MetaMetricsUserTrait.ChainIdList]: [
            'eip155:1',
            'eip155:5',
            'eip155:175',
            'bip122:000000000019d6689c085ae165831e93',
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          ],
          [MetaMetricsUserTrait.InstallDateExt]: '',
          [MetaMetricsUserTrait.StorageKind]: 'split',
          [MetaMetricsUserTrait.LedgerConnectionType]:
            LedgerTransportTypes.webhid,
          [MetaMetricsUserTrait.NetworksAdded]: [
            CHAIN_IDS.MAINNET,
            CHAIN_IDS.GOERLI,
            '0xaf',
          ],
          [MetaMetricsUserTrait.NetworksWithoutTicker]: ['0xaf'],
          [MetaMetricsUserTrait.NftAutodetectionEnabled]: false,
          [MetaMetricsUserTrait.NumberOfAccounts]: 2,
          [MetaMetricsUserTrait.NumberOfNftCollections]: 3,
          [MetaMetricsUserTrait.NumberOfNfts]: 4,
          [MetaMetricsUserTrait.NumberOfTokens]: 5,
          [MetaMetricsUserTrait.NumberOfHDEntropies]: 0,
          [MetaMetricsUserTrait.NumberOfAccountGroups]: 2,
          [MetaMetricsUserTrait.NumberOfImportedAccounts]: 0,
          [MetaMetricsUserTrait.NumberOfLedgerAccounts]: 0,
          [MetaMetricsUserTrait.NumberOfTrezorAccounts]: 0,
          [MetaMetricsUserTrait.NumberOfLatticeAccounts]: 0,
          [MetaMetricsUserTrait.NumberOfQrHardwareAccounts]: 0,
          [MetaMetricsUserTrait.NumberOfHardwareWallets]: 0,
          [MetaMetricsUserTrait.OpenSeaApiEnabled]: true,
          [MetaMetricsUserTrait.ThreeBoxEnabled]: false,
          [MetaMetricsUserTrait.Theme]: 'default',
          [MetaMetricsUserTrait.TokenDetectionEnabled]: true,
          [MetaMetricsUserTrait.ShowNativeTokenAsMainBalance]: true,
          [MetaMetricsUserTrait.CurrentCurrency]: 'usd',
          [MetaMetricsUserTrait.HasMarketingConsent]: false,
          [MetaMetricsUserTrait.SecurityProviders]: ['blockaid'],
          [MetaMetricsUserTrait.IsMetricsOptedIn]: true,
          [MetaMetricsUserTrait.CanonicalProfileId]: undefined,
          [MetaMetricsUserTrait.AccountType]: 'metamask',
          [MetaMetricsUserTrait.PetnameAddressCount]: 3,
          [MetaMetricsUserTrait.TokenSortPreference]: 'token-sort-key',
          [MetaMetricsUserTrait.PrivacyModeEnabled]: true,
          [MetaMetricsUserTrait.NetworkFilterPreference]: [],
          [MetaMetricsUserTrait.Platform]: 'Chrome',
          [MetaMetricsUserTrait.InstallType]: 'unknown',
          [MetaMetricsUserTrait.DeviceType]: DEVICE_TYPE.DESKTOP,
          [MetaMetricsUserTrait.Os]: OS.MACOS,
        });
      });
    });

    it('uses the social create flow to build the account type trait', async function () {
      await withController(
        {
          seedlessOnboardingState: {
            authConnection: AuthConnection.Google,
          },
        },
        ({ controller }) => {
          const traits = controller._buildUserTraitsObject({
            addressBook: {},
            allTokens: {},
            ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
            ledgerTransportType: LedgerTransportTypes.webhid,
            openSeaEnabled: true,
            internalAccounts: {
              accounts: {
                mock1: {} as InternalAccount,
              },
              selectedAccount: 'mock1',
            },
            useNftDetection: false,
            theme: 'default' as ThemeType,
            useTokenDetection: true,
            allNfts: {},
            completedMetaMetricsOnboarding: true,
            optedIn: true,
            analyticsId: TEST_ANALYTICS_ID,
            dataCollectionForMarketing: false,
            preferences: {
              privacyMode: false,
              tokenNetworkFilter: {},
              tokenSortConfig: {
                key: 'token-sort-key',
                order: 'dsc',
                sortCallback: 'stringNumeric',
              },
              showNativeTokenAsMainBalance: false,
            } as Preferences,
            securityAlertsEnabled: false,
            names: {
              ethereumAddress: {},
            },
            currentCurrency: 'usd',
            srpSessionData: undefined,
            keyrings: [],
            firstTimeFlowType: FirstTimeFlowType.socialCreate,
            multichainNetworkConfigurationsByChainId: {},
          });

          expect(traits?.[MetaMetricsUserTrait.AccountType]).toBe(
            'metamask_google',
          );
        },
      );
    });

    it('uses the social import flow to build the account type trait', async function () {
      await withController(
        {
          seedlessOnboardingState: {
            authConnection: AuthConnection.Google,
          },
        },
        ({ controller }) => {
          const traits = controller._buildUserTraitsObject({
            addressBook: {},
            allTokens: {},
            ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
            ledgerTransportType: LedgerTransportTypes.webhid,
            openSeaEnabled: true,
            internalAccounts: {
              accounts: {
                mock1: {} as InternalAccount,
              },
              selectedAccount: 'mock1',
            },
            useNftDetection: false,
            theme: 'default' as ThemeType,
            useTokenDetection: true,
            allNfts: {},
            completedMetaMetricsOnboarding: true,
            optedIn: true,
            analyticsId: TEST_ANALYTICS_ID,
            dataCollectionForMarketing: false,
            preferences: {
              privacyMode: false,
              tokenNetworkFilter: {},
              tokenSortConfig: {
                key: 'token-sort-key',
                order: 'dsc',
                sortCallback: 'stringNumeric',
              },
              showNativeTokenAsMainBalance: false,
            } as Preferences,
            securityAlertsEnabled: false,
            names: {
              ethereumAddress: {},
            },
            currentCurrency: 'usd',
            srpSessionData: undefined,
            keyrings: [],
            firstTimeFlowType: FirstTimeFlowType.socialImport,
            multichainNetworkConfigurationsByChainId: {},
          });

          expect(traits?.[MetaMetricsUserTrait.AccountType]).toBe(
            'imported_google',
          );
        },
      );
    });

    it('should return only changed traits object on subsequent calls', async function () {
      await withController(({ controller }) => {
        const networkState = mockNetworkState(
          { chainId: CHAIN_IDS.MAINNET },
          { chainId: CHAIN_IDS.GOERLI },
        );
        controller._buildUserTraitsObject({
          addressBook: {
            [CHAIN_IDS.MAINNET]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
            },
            [CHAIN_IDS.GOERLI]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
              '0x0': {
                address: '0x0',
              } as AddressBookEntry,
            },
          },
          allTokens: {},
          ...networkState,
          ledgerTransportType: LedgerTransportTypes.webhid,
          openSeaEnabled: true,
          internalAccounts: {
            accounts: {
              mock1: {} as InternalAccount,
              mock2: {} as InternalAccount,
            },
            selectedAccount: 'mock1',
          },
          useNftDetection: false,
          theme: 'default' as ThemeType,
          useTokenDetection: true,
          allNfts: {},
          completedMetaMetricsOnboarding: true,
          optedIn: true,
          analyticsId: TEST_ANALYTICS_ID,
          dataCollectionForMarketing: false,
          preferences: {
            privacyMode: true,
            tokenNetworkFilter: {},
            tokenSortConfig: {
              key: 'token-sort-key',
              order: 'dsc',
              sortCallback: 'stringNumeric',
            },
            showNativeTokenAsMainBalance: true,
          } as Preferences,
          securityAlertsEnabled: true,
          names: {
            ethereumAddress: {},
          },
          currentCurrency: 'usd',
          srpSessionData: undefined,
          keyrings: [],
          firstTimeFlowType: FirstTimeFlowType.create,
          multichainNetworkConfigurationsByChainId: {},
        } as MetaMaskState);

        const updatedTraits = controller._buildUserTraitsObject({
          addressBook: {
            [CHAIN_IDS.MAINNET]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
              '0x1': {
                address: '0x1',
              } as AddressBookEntry,
            },
            [CHAIN_IDS.GOERLI]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
              '0x0': {
                address: '0x0',
              } as AddressBookEntry,
            },
          },
          allTokens: {
            [toHex(1)]: {
              '0xabcde': [{ address: '0xtestAddress' } as Token],
            },
          },
          ...networkState,
          ledgerTransportType: LedgerTransportTypes.webhid,
          openSeaEnabled: false,
          internalAccounts: {
            accounts: {
              mock1: {} as InternalAccount,
              mock2: {} as InternalAccount,
              mock3: {} as InternalAccount,
            },
            selectedAccount: 'mock1',
          },
          useNftDetection: false,
          theme: 'default' as ThemeType,
          useTokenDetection: true,
          names: {
            ethereumAddress: {},
          },
          currentCurrency: 'usd',
          allNfts: {},
          completedMetaMetricsOnboarding: true,
          optedIn: true,
          analyticsId: TEST_ANALYTICS_ID,
          dataCollectionForMarketing: false,
          preferences: {
            privacyMode: true,
            tokenNetworkFilter: {},
            tokenSortConfig: {
              key: 'token-sort-key',
              order: 'dsc',
              sortCallback: 'stringNumeric',
            },
            showNativeTokenAsMainBalance: false,
          } as Preferences,
          securityAlertsEnabled: true,
          srpSessionData: {
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
          },
          keyrings: [],
          firstTimeFlowType: FirstTimeFlowType.import,
          multichainNetworkConfigurationsByChainId: {},
        } as MetaMaskState);

        expect(updatedTraits).toStrictEqual({
          [MetaMetricsUserTrait.AddressBookEntries]: 4,
          [MetaMetricsUserTrait.NumberOfAccounts]: 3,
          [MetaMetricsUserTrait.NumberOfAccountGroups]: 3,
          [MetaMetricsUserTrait.NumberOfTokens]: 1,
          [MetaMetricsUserTrait.OpenSeaApiEnabled]: false,
          [MetaMetricsUserTrait.ShowNativeTokenAsMainBalance]: false,
          [MetaMetricsUserTrait.CanonicalProfileId]: 'canonicalProfileId',
          [MetaMetricsUserTrait.AccountType]: 'imported',
        });
      });
    });

    it('should return null if no traits changed', async function () {
      await withController(({ controller }) => {
        const networkState = mockNetworkState(
          { chainId: CHAIN_IDS.MAINNET },
          { chainId: CHAIN_IDS.GOERLI },
        );
        controller._buildUserTraitsObject({
          addressBook: {
            [CHAIN_IDS.MAINNET]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
            },
            [CHAIN_IDS.GOERLI]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
              '0x0': {
                address: '0x0',
              } as AddressBookEntry,
            },
          },
          allTokens: {},
          ...networkState,
          ledgerTransportType: LedgerTransportTypes.webhid,
          openSeaEnabled: true,
          internalAccounts: {
            accounts: {
              mock1: {} as InternalAccount,
              mock2: {} as InternalAccount,
            },
            selectedAccount: 'mock1',
          },
          useNftDetection: true,
          theme: 'default' as ThemeType,
          useTokenDetection: true,
          allNfts: {},
          completedMetaMetricsOnboarding: true,
          optedIn: true,
          analyticsId: TEST_ANALYTICS_ID,
          dataCollectionForMarketing: false,
          preferences: {
            privacyMode: true,
            tokenNetworkFilter: {},
            tokenSortConfig: {
              key: 'token-sort-key',
              order: 'dsc',
              sortCallback: 'stringNumeric',
            },
            showNativeTokenAsMainBalance: true,
          } as Preferences,
          names: {
            ethereumAddress: {},
          },
          securityAlertsEnabled: true,
          currentCurrency: 'usd',
          srpSessionData: {
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
          },
          keyrings: [],
          multichainNetworkConfigurationsByChainId: {},
          firstTimeFlowType: FirstTimeFlowType.create,
        });

        const updatedTraits = controller._buildUserTraitsObject({
          addressBook: {
            [CHAIN_IDS.MAINNET]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
            },
            [CHAIN_IDS.GOERLI]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
              '0x0': { address: '0x0' } as AddressBookEntry,
            },
          },
          allTokens: {},
          ...networkState,
          ledgerTransportType: LedgerTransportTypes.webhid,
          openSeaEnabled: true,
          internalAccounts: {
            accounts: {
              mock1: {} as InternalAccount,
              mock2: {} as InternalAccount,
            },
            selectedAccount: 'mock1',
          },
          useNftDetection: true,
          theme: 'default' as ThemeType,
          useTokenDetection: true,
          allNfts: {},
          completedMetaMetricsOnboarding: true,
          optedIn: true,
          analyticsId: TEST_ANALYTICS_ID,
          dataCollectionForMarketing: false,
          preferences: {
            privacyMode: true,
            tokenNetworkFilter: {},
            tokenSortConfig: {
              key: 'token-sort-key',
              order: 'dsc',
              sortCallback: 'stringNumeric',
            },
            showNativeTokenAsMainBalance: true,
          } as Preferences,
          names: {
            ethereumAddress: {},
          },
          securityAlertsEnabled: true,
          currentCurrency: 'usd',
          srpSessionData: {
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
          },
          keyrings: [],
          multichainNetworkConfigurationsByChainId: {},
          firstTimeFlowType: FirstTimeFlowType.create,
        });
        expect(updatedTraits).toStrictEqual(null);
      });
    });

    it('should count BIP44 multichain accounts as one account group per entropy+index pair', async function () {
      const srp1 = 'entropy-source-id-1';
      function mockBip44Account(
        id: string,
        type: InternalAccount['type'],
        keyringType: InternalAccount['metadata']['keyring']['type'],
        groupIndex: number,
      ) {
        return createMockInternalAccount({
          id,
          type,
          metadata: { keyring: { type: keyringType } },
          options: {
            entropy: {
              type: 'mnemonic',
              id: srp1,
              groupIndex,
              derivationPath: '',
            },
          },
        });
      }

      // 2 account groups from 1 SRP, each with EVM + BTC + SOL addresses.
      const evm0 = mockBip44Account(
        'evm-0',
        EthAccountType.Eoa,
        KeyringType.hdKeyTree,
        0,
      );
      const btc0 = mockBip44Account(
        'btc-0',
        BtcAccountType.P2wpkh,
        KeyringType.snap,
        0,
      );
      const sol0 = mockBip44Account(
        'sol-0',
        SolAccountType.DataAccount,
        KeyringType.snap,
        0,
      );
      const evm1 = mockBip44Account(
        'evm-1',
        EthAccountType.Eoa,
        KeyringType.hdKeyTree,
        1,
      );
      const btc1 = mockBip44Account(
        'btc-1',
        BtcAccountType.P2wpkh,
        KeyringType.snap,
        1,
      );
      const sol1 = mockBip44Account(
        'sol-1',
        SolAccountType.DataAccount,
        KeyringType.snap,
        1,
      );

      const mockAccounts: Record<string, InternalAccount> = {
        [evm0.id]: evm0,
        [btc0.id]: btc0,
        [sol0.id]: sol0,
        [evm1.id]: evm1,
        [btc1.id]: btc1,
        [sol1.id]: sol1,
      };
      await withController(({ controller }) => {
        const traits = controller._buildUserTraitsObject(
          buildStateWithAccounts(mockAccounts),
        );

        // 6 internal accounts but only 2 unique {srp, groupIndex} pairs → 2 groups.
        expect(traits?.[MetaMetricsUserTrait.NumberOfAccountGroups]).toBe(2);
        expect(traits?.[MetaMetricsUserTrait.NumberOfImportedAccounts]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfLedgerAccounts]).toBe(0);
        // 1 unique entropy id → 1 HD entropy.
        expect(traits?.[MetaMetricsUserTrait.NumberOfHDEntropies]).toBe(1);
        expect(traits?.[MetaMetricsUserTrait.NumberOfHardwareWallets]).toBe(0);
      });
    });

    it('should correctly count imported and hardware wallet account types', async function () {
      const mockAccounts = createMockInternalAccounts([
        buildMnemonicEntropyAccount({
          id: 'hd-acc',
          entropyId: 'srp1',
          groupIndex: 0,
          derivationPath: "m/44'/60'/0'/0/0",
        }),
        buildKeyringAccount('imported-acc', KeyringType.imported),
        buildKeyringAccount('snap-acc', KeyringType.snap),
        buildKeyringAccount('ledger-acc', KeyringType.ledger),
        buildKeyringAccount('trezor-acc', KeyringType.trezor),
        buildKeyringAccount('lattice-acc', KeyringType.lattice),
        buildKeyringAccount('qr-acc', KeyringType.qr),
        buildKeyringAccount('onekey-acc', KeyringType.oneKey),
      ]);
      await withController(({ controller }) => {
        const traits = controller._buildUserTraitsObject(
          buildStateWithAccounts(mockAccounts),
        );

        // 8 accounts: 1 HD group + 1 imported + 1 snap + 1 ledger +
        //             1 trezor + 1 lattice + 1 qr + 1 onekey = 8 distinct groups.
        expect(traits?.[MetaMetricsUserTrait.NumberOfAccountGroups]).toBe(8);
        expect(traits?.[MetaMetricsUserTrait.NumberOfImportedAccounts]).toBe(1);
        expect(traits?.[MetaMetricsUserTrait.NumberOfLedgerAccounts]).toBe(1);
        expect(traits?.[MetaMetricsUserTrait.NumberOfTrezorAccounts]).toBe(1);
        expect(traits?.[MetaMetricsUserTrait.NumberOfLatticeAccounts]).toBe(1);
        // QR hardware includes both 'QR Hardware Wallet Device' and 'OneKey Hardware'.
        expect(traits?.[MetaMetricsUserTrait.NumberOfQrHardwareAccounts]).toBe(
          2,
        );
        // 1 mnemonic entropy id → 1 HD entropy; hardware wallets don't contribute.
        expect(traits?.[MetaMetricsUserTrait.NumberOfHDEntropies]).toBe(1);
        // 1 of each type paired → 4 distinct hardware wallets (one per type).
        expect(traits?.[MetaMetricsUserTrait.NumberOfHardwareWallets]).toBe(4);
      });
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

  describe('#getAccountCompositionTraits', function () {
    it('returns zeros for an empty accounts object', async function () {
      await withController(({ controller }) => {
        const traits = controller._buildUserTraitsObject(
          buildStateWithAccounts({}),
        );
        expect(traits?.[MetaMetricsUserTrait.NumberOfHDEntropies]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfHardwareWallets]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfAccountGroups]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfImportedAccounts]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfLedgerAccounts]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfTrezorAccounts]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfLatticeAccounts]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfQrHardwareAccounts]).toBe(
          0,
        );
      });
    });

    it('counts a single SRP with multiple account groups as one HD entropy', async function () {
      await withController(({ controller }) => {
        const traits = controller._buildUserTraitsObject(
          buildStateWithAccounts(
            createMockInternalAccounts([
              buildMnemonicEntropyAccount({
                id: 'evm-0',
                entropyId: 'srp1',
                groupIndex: 0,
              }),
              buildMnemonicEntropyAccount({
                id: 'evm-1',
                entropyId: 'srp1',
                groupIndex: 1,
              }),
              buildMnemonicEntropyAccount({
                id: 'evm-2',
                entropyId: 'srp1',
                groupIndex: 2,
              }),
            ]),
          ),
        );
        expect(traits?.[MetaMetricsUserTrait.NumberOfHDEntropies]).toBe(1);
        expect(traits?.[MetaMetricsUserTrait.NumberOfAccountGroups]).toBe(3);
        expect(traits?.[MetaMetricsUserTrait.NumberOfHardwareWallets]).toBe(0);
      });
    });

    it('counts multiple distinct SRPs as separate HD entropies', async function () {
      await withController(({ controller }) => {
        const traits = controller._buildUserTraitsObject(
          buildStateWithAccounts(
            createMockInternalAccounts([
              buildMnemonicEntropyAccount({
                id: 'evm-srp1',
                entropyId: 'srp1',
                groupIndex: 0,
              }),
              buildMnemonicEntropyAccount({
                id: 'evm-srp2',
                entropyId: 'srp2',
                groupIndex: 0,
              }),
              buildMnemonicEntropyAccount({
                id: 'evm-srp3',
                entropyId: 'srp3',
                groupIndex: 0,
              }),
            ]),
          ),
        );
        expect(traits?.[MetaMetricsUserTrait.NumberOfHDEntropies]).toBe(3);
        expect(traits?.[MetaMetricsUserTrait.NumberOfAccountGroups]).toBe(3);
      });
    });

    it('does not count hardware wallets toward HD entropies', async function () {
      await withController(({ controller }) => {
        const traits = controller._buildUserTraitsObject(
          buildStateWithAccounts(
            createMockInternalAccounts([
              buildKeyringAccount('ledger-1', KeyringType.ledger),
              buildKeyringAccount('ledger-2', KeyringType.ledger),
              buildKeyringAccount('trezor-1', KeyringType.trezor),
              buildKeyringAccount('lattice-1', KeyringType.lattice),
              buildKeyringAccount('qr-1', KeyringType.qr),
              buildKeyringAccount('onekey-1', KeyringType.oneKey),
            ]),
          ),
        );
        expect(traits?.[MetaMetricsUserTrait.NumberOfHDEntropies]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfLedgerAccounts]).toBe(2);
        expect(traits?.[MetaMetricsUserTrait.NumberOfTrezorAccounts]).toBe(1);
        expect(traits?.[MetaMetricsUserTrait.NumberOfLatticeAccounts]).toBe(1);
        expect(traits?.[MetaMetricsUserTrait.NumberOfQrHardwareAccounts]).toBe(
          2,
        );
        // 1 Ledger device + 1 Trezor + 1 Lattice + 1 QR (OneKey) = 4 distinct hardware wallets.
        expect(traits?.[MetaMetricsUserTrait.NumberOfHardwareWallets]).toBe(4);
      });
    });

    it('does not count imported accounts toward HD entropies or hardware wallets', async function () {
      await withController(({ controller }) => {
        const traits = controller._buildUserTraitsObject(
          buildStateWithAccounts(
            createMockInternalAccounts([
              buildKeyringAccount('imported-1', KeyringType.imported),
              buildKeyringAccount('imported-2', KeyringType.imported),
            ]),
          ),
        );
        expect(traits?.[MetaMetricsUserTrait.NumberOfHDEntropies]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfHardwareWallets]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfImportedAccounts]).toBe(2);
      });
    });

    it('computes number_of_hardware_wallets as the sum of all hardware wallet types', async function () {
      await withController(({ controller }) => {
        const traits = controller._buildUserTraitsObject(
          buildStateWithAccounts(
            createMockInternalAccounts([
              buildKeyringAccount('ledger-1', KeyringType.ledger),
              buildKeyringAccount('ledger-2', KeyringType.ledger),
              buildKeyringAccount('trezor-1', KeyringType.trezor),
              buildKeyringAccount('lattice-1', KeyringType.lattice),
              buildKeyringAccount('lattice-2', KeyringType.lattice),
              buildKeyringAccount('qr-1', KeyringType.qr),
              buildKeyringAccount('onekey-1', KeyringType.oneKey),
            ]),
          ),
        );
        // 1 Ledger device + 1 Trezor + 1 Lattice + 1 QR (includes OneKey) = 4 distinct hardware wallets.
        expect(traits?.[MetaMetricsUserTrait.NumberOfHardwareWallets]).toBe(4);
      });
    });

    it('handles accounts with unknown keyring type without throwing', async function () {
      await withController(({ controller }) => {
        expect(() =>
          controller._buildUserTraitsObject(
            buildStateWithAccounts(
              createMockInternalAccounts([
                buildKeyringAccount('unknown-acc', 'SomeUnknownKeyring'),
              ]),
            ),
          ),
        ).not.toThrow();
      });
    });

    it('handles accounts with missing metadata without throwing', async function () {
      await withController(({ controller }) => {
        expect(() =>
          controller._buildUserTraitsObject(
            buildStateWithAccounts(
              createMockInternalAccounts([
                {
                  ...buildKeyringAccount(
                    'no-metadata-acc',
                    KeyringType.hdKeyTree,
                  ),
                  metadata: undefined,
                },
              ]),
            ),
          ),
        ).not.toThrow();
      });
    });

    it('derives total wallets from hd_entropies + hardware_wallets + imported_accounts', async function () {
      await withController(({ controller }) => {
        const traits = controller._buildUserTraitsObject(
          buildStateWithAccounts(
            createMockInternalAccounts([
              buildMnemonicEntropyAccount({
                id: 'evm-0',
                entropyId: 'srp1',
                groupIndex: 0,
              }),
              buildMnemonicEntropyAccount({
                id: 'evm-1',
                entropyId: 'srp2',
                groupIndex: 0,
              }),
              buildKeyringAccount('ledger-1', KeyringType.ledger),
              buildKeyringAccount('imported-1', KeyringType.imported),
              // Snap accounts are excluded from total wallet count.
              buildKeyringAccount('snap-1', KeyringType.snap),
            ]),
          ),
        );
        const hdEntropies =
          traits?.[MetaMetricsUserTrait.NumberOfHDEntropies] ?? 0;
        const hardwareWallets =
          traits?.[MetaMetricsUserTrait.NumberOfHardwareWallets] ?? 0;
        const importedAccounts =
          traits?.[MetaMetricsUserTrait.NumberOfImportedAccounts] ?? 0;
        // 2 SRPs + 1 hardware + 1 imported = 4 total wallets.
        expect(hdEntropies + hardwareWallets + importedAccounts).toBe(4);
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
              "completedMetaMetricsOnboarding": true,
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
              "completedMetaMetricsOnboarding": true,
              "dataCollectionForMarketing": null,
              "eventsBeforeMetricsOptIn": [],
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
              "completedMetaMetricsOnboarding": true,
              "dataCollectionForMarketing": null,
              "eventsBeforeMetricsOptIn": [],
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
              "completedMetaMetricsOnboarding": true,
              "dataCollectionForMarketing": null,
              "fragments": {},
            }
          `);
        },
      );
    });
  });
});

type RootMessenger = Messenger<MockAnyNamespace, AllowedActions, AllowedEvents>;

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
  seedlessOnboardingState?: Partial<SeedlessOnboardingControllerState>;
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
      seedlessOnboardingState = {},
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
        completedMetaMetricsOnboarding: true,
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

    messenger.registerActionHandler(
      'SeedlessOnboardingController:getState',
      jest.fn().mockReturnValue(seedlessOnboardingState),
    );

    const mockAnalyticsControllerState: AnalyticsControllerState = {
      ...MOCK_ANALYTICS_CONTROLLER_OPTED_IN,
      ...(analyticsControllerState ?? {}),
    };

    messenger.registerActionHandler('AnalyticsController:getState', () => ({
      ...mockAnalyticsControllerState,
    }));

    messenger.registerActionHandler('AnalyticsController:optIn', () => {
      mockAnalyticsControllerState.optedIn = true;
    });

    messenger.registerActionHandler('AnalyticsController:optOut', () => {
      mockAnalyticsControllerState.optedIn = false;
    });

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
        // eslint-disable-next-line @typescript-eslint/naming-convention
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
        'AnalyticsController:identify',
        'AnalyticsController:optIn',
        'AnalyticsController:optOut',
        'AnalyticsController:trackEvent',
        'AnalyticsController:trackView',
        'PreferencesController:getState',
        'NetworkController:getState',
        'NetworkController:getNetworkClientById',
        'RemoteFeatureFlagController:getState',
        'MultichainNetworkController:getState',
        'SeedlessOnboardingController:getState',
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
