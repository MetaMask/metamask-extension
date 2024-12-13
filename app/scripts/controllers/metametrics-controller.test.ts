import { toHex } from '@metamask/controller-utils';
import type {
  NetworkClientId,
  NetworkState,
} from '@metamask/network-controller';
import { NameEntry, NameType } from '@metamask/name-controller';
import { AddressBookEntry } from '@metamask/address-book-controller';
import {
  Nft,
  Token,
  TokensControllerState,
} from '@metamask/assets-controllers';
import { InternalAccount } from '@metamask/keyring-api';
import { Browser } from 'webextension-polyfill';
import { ControllerMessenger } from '@metamask/base-controller';
import { merge } from 'lodash';
import { ENVIRONMENT_TYPE_BACKGROUND } from '../../../shared/constants/app';
import { createSegmentMock } from '../lib/segment';
import {
  METAMETRICS_ANONYMOUS_ID,
  METAMETRICS_BACKGROUND_PAGE_OBJECT,
  MetaMetricsUserTrait,
  MetaMetricsUserTraits,
} from '../../../shared/constants/metametrics';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { LedgerTransportTypes } from '../../../shared/constants/hardware-wallets';
import * as Utils from '../lib/util';
import { mockNetworkState } from '../../../test/stub/networks';
import { flushPromises } from '../../../test/lib/timer-helpers';
import MetaMetricsController, {
  AllowedActions,
  AllowedEvents,
  MetaMetricsControllerOptions,
} from './metametrics-controller';
import {
  getDefaultPreferencesControllerState,
  PreferencesControllerState,
} from './preferences-controller';

const segmentMock = createSegmentMock(2);

const VERSION = '0.0.1-test';
const DEFAULT_CHAIN_ID = '0x1338';
const LOCALE = 'en_US';
const TEST_META_METRICS_ID = '0xabc';
const TEST_GA_COOKIE_ID = '123456.123455';
const DUMMY_ACTION_ID = 'DUMMY_ACTION_ID';
const MOCK_EXTENSION_ID = 'testid';

const MOCK_EXTENSION = {
  runtime: {
    id: MOCK_EXTENSION_ID,
    setUninstallURL: () => undefined,
  },
} as unknown as Browser;

const MOCK_TRAITS = {
  test_boolean: true,
  test_string: 'abc',
  test_number: 123,
  test_bool_array: [true, true, false],
  test_string_array: ['test', 'test', 'test'],
  test_boolean_array: [1, 2, 3],
} as MetaMetricsUserTraits;

const MOCK_INVALID_TRAITS = {
  test_null: null,
  test_array_multi_types: [true, 'a', 1],
} as MetaMetricsUserTraits;

const DEFAULT_TEST_CONTEXT = {
  app: {
    name: 'MetaMask Extension',
    version: VERSION,
    extensionId: MOCK_EXTENSION_ID,
  },
  page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
  referrer: undefined,
  userAgent: window.navigator.userAgent,
  marketingCampaignCookieId: null,
};

const DEFAULT_SHARED_PROPERTIES = {
  chain_id: DEFAULT_CHAIN_ID,
  locale: LOCALE.replace('_', '-'),
  environment_type: 'background',
};

const DEFAULT_EVENT_PROPERTIES = {
  category: 'Unit Test',
  extensionId: MOCK_EXTENSION_ID,
  ...DEFAULT_SHARED_PROPERTIES,
};

const DEFAULT_PAGE_PROPERTIES = {
  ...DEFAULT_SHARED_PROPERTIES,
};

const SAMPLE_TX_SUBMITTED_PARTIAL_FRAGMENT = {
  id: 'transaction-submitted-0000',
  canDeleteIfAbandoned: true,
  category: 'Unit Test',
  successEvent: 'Transaction Finalized',
  persist: true,
  properties: {
    simulation_response: 'no_balance_change',
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
  describe('constructor', function () {
    it('should properly initialize', async function () {
      const spy = jest.spyOn(segmentMock, 'track');
      await withController(({ controller }) => {
        expect(controller.version).toStrictEqual(VERSION);
        expect(controller.chainId).toStrictEqual(DEFAULT_CHAIN_ID);
        expect(controller.state.participateInMetaMetrics).toStrictEqual(true);
        expect(controller.state.metaMetricsId).toStrictEqual(
          TEST_META_METRICS_ID,
        );
        expect(controller.state.marketingCampaignCookieId).toStrictEqual(null);
        expect(controller.locale).toStrictEqual(LOCALE.replace('_', '-'));
        expect(controller.state.fragments).toStrictEqual({
          testid: SAMPLE_PERSISTED_EVENT,
        });
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(
          {
            event: 'sample non-persisted event failure',
            userId: TEST_META_METRICS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: {
              ...DEFAULT_EVENT_PROPERTIES,
              test: true,
            },
            messageId: 'sample-non-persisted-event-failure',
            timestamp: new Date(),
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
    it('should throw an error if the param is missing successEvent or category', async function () {
      await withController(async ({ controller }) => {
        await expect(() => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error because we are testing the error case
          controller.createEventFragment({ event: 'test' });
        }).toThrow(/Must specify success event and category\./u);

        await expect(() => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error because we are testing the error case
          controller.createEventFragment({ category: 'test' });
        }).toThrow(/Must specify success event and category\./u);
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
      await withController(
        {
          options: {
            state: {
              participateInMetaMetrics: true,
            },
          },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'track');
          const mockInitialEventName = 'Test Initial Event';

          controller.createEventFragment({
            ...SAMPLE_PERSISTED_EVENT_NO_ID,
            initialEvent: mockInitialEventName,
          });

          expect(spy).toHaveBeenCalledTimes(1);
        },
      );
    });

    it('should not call track if no initialEvent was provided', async function () {
      await withController(
        {
          options: {
            state: {
              participateInMetaMetrics: true,
            },
          },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'track');

          controller.createEventFragment({
            ...SAMPLE_PERSISTED_EVENT_NO_ID,
          });

          expect(spy).toHaveBeenCalledTimes(0);
        },
      );
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

  describe('generateMetaMetricsId', function () {
    it('should generate an 0x prefixed hex string', async function () {
      await withController(({ controller }) => {
        expect(
          controller.generateMetaMetricsId().startsWith('0x'),
        ).toStrictEqual(true);
      });
    });
  });

  describe('getMetaMetricsId', function () {
    it('should generate or return the metametrics id', async function () {
      await withController(
        {
          options: {
            state: {
              participateInMetaMetrics: true,
              metaMetricsId: null,
            },
          },
        },
        ({ controller }) => {
          // Starts off being empty.
          expect(controller.state.metaMetricsId).toStrictEqual(null);

          // Create a new metametrics id.
          const clientMetaMetricsId = controller.getMetaMetricsId();
          expect(clientMetaMetricsId.startsWith('0x')).toStrictEqual(true);

          // Return same metametrics id.
          const sameMetaMetricsId = controller.getMetaMetricsId();
          expect(clientMetaMetricsId).toStrictEqual(sameMetaMetricsId);
        },
      );
    });
  });

  describe('identify', function () {
    it('should call segment.identify for valid traits if user is participating in metametrics', async function () {
      const spy = jest.spyOn(segmentMock, 'identify');
      await withController(
        {
          options: {
            state: {
              participateInMetaMetrics: true,
              metaMetricsId: TEST_META_METRICS_ID,
            },
          },
        },
        ({ controller }) => {
          controller.identify({
            ...MOCK_TRAITS,
            ...MOCK_INVALID_TRAITS,
          });
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(
            {
              userId: TEST_META_METRICS_ID,
              traits: MOCK_TRAITS,
              messageId: Utils.generateRandomId(),
              timestamp: new Date(),
            },
            spy.mock.calls[0][1],
          );
        },
      );
    });

    it('should transform date type traits into ISO-8601 timestamp strings', async function () {
      const spy = jest.spyOn(segmentMock, 'identify');
      await withController(
        {
          options: {
            state: {
              participateInMetaMetrics: true,
              metaMetricsId: TEST_META_METRICS_ID,
            },
          },
        },
        ({ controller }) => {
          controller.identify({
            test_date: new Date().toISOString(),
          } as MetaMetricsUserTraits);
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(
            {
              userId: TEST_META_METRICS_ID,
              traits: {
                test_date: new Date().toISOString(),
              },
              messageId: Utils.generateRandomId(),
              timestamp: new Date(),
            },
            spy.mock.calls[0][1],
          );
        },
      );
    });

    it('should not call segment.identify if user is not participating in metametrics', async function () {
      const spy = jest.spyOn(segmentMock, 'identify');
      await withController(
        {
          options: {
            state: {
              participateInMetaMetrics: false,
            },
          },
        },
        ({ controller }) => {
          controller.identify(MOCK_TRAITS);
          expect(spy).toHaveBeenCalledTimes(0);
        },
      );
    });

    it('should not call segment.identify if there are no valid traits to identify', async function () {
      const spy = jest.spyOn(segmentMock, 'identify');
      await withController(
        {
          options: {
            state: {
              participateInMetaMetrics: true,
              metaMetricsId: TEST_META_METRICS_ID,
            },
          },
        },
        ({ controller }) => {
          controller.identify(MOCK_INVALID_TRAITS);
          expect(spy).toHaveBeenCalledTimes(0);
        },
      );
    });
  });

  describe('setParticipateInMetaMetrics', function () {
    it('should update the value of participateInMetaMetrics', async function () {
      await withController(
        {
          options: {
            state: {
              participateInMetaMetrics: null,
              metaMetricsId: null,
            },
          },
        },
        async ({ controller }) => {
          expect(controller.state.participateInMetaMetrics).toStrictEqual(null);
          await controller.setParticipateInMetaMetrics(true);
          expect(controller.state.participateInMetaMetrics).toStrictEqual(true);
          await controller.setParticipateInMetaMetrics(false);
          expect(controller.state.participateInMetaMetrics).toStrictEqual(
            false,
          );
        },
      );
    });
    it('should generate and update the metaMetricsId when set to true', async function () {
      await withController(
        {
          options: {
            state: {
              participateInMetaMetrics: null,
              metaMetricsId: null,
            },
          },
        },
        async ({ controller }) => {
          expect(controller.state.metaMetricsId).toStrictEqual(null);
          await controller.setParticipateInMetaMetrics(true);
          expect(typeof controller.state.metaMetricsId).toStrictEqual('string');
        },
      );
    });
    it('should not nullify the metaMetricsId when set to false', async function () {
      await withController(async ({ controller }) => {
        await controller.setParticipateInMetaMetrics(false);
        expect(controller.state.metaMetricsId).toStrictEqual(
          TEST_META_METRICS_ID,
        );
      });
    });
    it('should nullify the marketingCampaignCookieId when participateInMetaMetrics is toggled off', async function () {
      await withController(
        {
          options: {
            state: {
              participateInMetaMetrics: true,
              metaMetricsId: TEST_META_METRICS_ID,
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

  describe('trackEvent', function () {
    it('should not track an event if user is not participating in metametrics', async function () {
      const spy = jest.spyOn(segmentMock, 'track');
      await withController(
        {
          options: {
            state: {
              participateInMetaMetrics: false,
            },
          },
        },
        ({ controller }) => {
          controller.trackEvent({
            event: 'Fake Event',
            category: 'Unit Test',
            properties: {
              chain_id: '1',
            },
          });
          expect(spy).toHaveBeenCalledTimes(0);
        },
      );
    });

    it('should track an event if user has not opted in, but isOptIn is true', async function () {
      await withController(
        {
          options: {
            state: {
              participateInMetaMetrics: true,
            },
          },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'track');
          controller.trackEvent(
            {
              event: 'Fake Event',
              category: 'Unit Test',
              properties: {
                chain_id: '1',
              },
            },
            { isOptIn: true },
          );
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(
            {
              event: 'Fake Event',
              anonymousId: METAMETRICS_ANONYMOUS_ID,
              context: DEFAULT_TEST_CONTEXT,
              properties: {
                ...DEFAULT_EVENT_PROPERTIES,
                chain_id: '1',
              },
              messageId: Utils.generateRandomId(),
              timestamp: new Date(),
            },
            spy.mock.calls[0][1],
          );
        },
      );
    });

    it('should track an event during optin and allow for metaMetricsId override', async function () {
      await withController(
        {
          options: {
            state: {
              participateInMetaMetrics: true,
            },
          },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'track');
          controller.trackEvent(
            {
              event: 'Fake Event',
              category: 'Unit Test',
              properties: {
                chain_id: '1',
              },
            },
            { isOptIn: true, metaMetricsId: 'TESTID' },
          );
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(
            {
              event: 'Fake Event',
              userId: 'TESTID',
              context: DEFAULT_TEST_CONTEXT,
              properties: {
                ...DEFAULT_EVENT_PROPERTIES,
                chain_id: '1',
              },
              messageId: Utils.generateRandomId(),
              timestamp: new Date(),
            },
            spy.mock.calls[0][1],
          );
        },
      );
    });

    it('should track a legacy event', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'track');
        controller.trackEvent(
          {
            event: 'Fake Event',
            category: 'Unit Test',
            properties: {
              chain_id: '1',
            },
          },
          { matomoEvent: true },
        );
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(
          {
            event: 'Fake Event',
            userId: TEST_META_METRICS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: {
              ...DEFAULT_EVENT_PROPERTIES,
              legacy_event: true,
              chain_id: '1',
            },
            messageId: Utils.generateRandomId(),
            timestamp: new Date(),
          },
          spy.mock.calls[0][1],
        );
      });
    });

    it('should track a non legacy event', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'track');
        controller.trackEvent({
          event: 'Fake Event',
          category: 'Unit Test',
          properties: {
            chain_id: '1',
          },
        });
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(
          {
            event: 'Fake Event',
            properties: {
              ...DEFAULT_EVENT_PROPERTIES,
              chain_id: '1',
            },
            context: DEFAULT_TEST_CONTEXT,
            userId: TEST_META_METRICS_ID,
            messageId: Utils.generateRandomId(),
            timestamp: new Date(),
          },
          spy.mock.calls[0][1],
        );
      });
    });

    it('should immediately flush queue if flushImmediately set to true', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'flush');
        controller.trackEvent(
          {
            event: 'Fake Event',
            category: 'Unit Test',
          },
          { flushImmediately: true },
        );
        expect(spy).not.toThrow();
      });
    });

    it('should throw if event or category not provided', async function () {
      await withController(({ controller }) => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error because we are testing the error case
          controller.trackEvent({ event: 'test' });
        }).toThrow(/Must specify event and category\./u);

        expect(() => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error because we are testing the error case
          controller.trackEvent({ category: 'test' });
        }).toThrow(/Must specify event and category\./u);
      });
    });

    it('should throw if provided sensitiveProperties, when excludeMetaMetricsId is true', async function () {
      const captureExceptionMock = jest.fn();
      await withController(
        {
          options: {
            captureException: captureExceptionMock,
          },
        },
        async ({ controller }) => {
          controller.trackEvent(
            {
              event: 'Fake Event',
              category: 'Unit Test',
              sensitiveProperties: { foo: 'bar' },
            },
            { excludeMetaMetricsId: true },
          );
          await flushPromises();
          expect(captureExceptionMock).toHaveBeenCalledWith(
            new Error(
              'sensitiveProperties was specified in an event payload that also set the excludeMetaMetricsId flag',
            ),
          );
        },
      );
    });

    it('should track sensitiveProperties in a separate, anonymous event', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'track');
        controller.trackEvent({
          event: 'Fake Event',
          category: 'Unit Test',
          sensitiveProperties: { foo: 'bar' },
        });
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith(
          {
            event: 'Fake Event',
            anonymousId: METAMETRICS_ANONYMOUS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: {
              foo: 'bar',
              ...DEFAULT_EVENT_PROPERTIES,
            },
            messageId: Utils.generateRandomId(),
            timestamp: new Date(),
          },
          spy.mock.calls[0][1],
        );
        expect(spy).toHaveBeenCalledWith(
          {
            event: 'Fake Event',
            userId: TEST_META_METRICS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: DEFAULT_EVENT_PROPERTIES,
            messageId: Utils.generateRandomId(),
            timestamp: new Date(),
          },
          spy.mock.calls[1][1],
        );
      });
    });
  });

  describe('Change Signature XXX anonymous event names', function () {
    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      ['Signature Requested', 'Signature Requested Anon'],
      ['Signature Rejected', 'Signature Rejected Anon'],
      ['Signature Approved', 'Signature Approved Anon'],
    ])(
      'should change "%s" anonymous event names to "%s"',
      async (eventType: string, anonEventType: string) => {
        await withController(({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'track');
          controller.trackEvent({
            event: eventType,
            category: 'Unit Test',
            properties: DEFAULT_EVENT_PROPERTIES,
            sensitiveProperties: { foo: 'bar' },
          });

          expect(spy).toHaveBeenCalledTimes(2);

          expect(spy.mock.calls[0][0]).toMatchObject({
            event: anonEventType,
            properties: { foo: 'bar', ...DEFAULT_EVENT_PROPERTIES },
          });

          expect(spy.mock.calls[1][0]).toMatchObject({
            event: eventType,
            properties: { ...DEFAULT_EVENT_PROPERTIES },
          });
        });
      },
    );
  });

  describe('Change Transaction XXX anonymous event namnes', function () {
    it('should change "Transaction Added" anonymous event names to "Transaction Added Anon"', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'track');
        controller.trackEvent({
          event: 'Transaction Added',
          category: 'Unit Test',
          sensitiveProperties: { foo: 'bar' },
        });
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith(
          {
            event: `Transaction Added Anon`,
            anonymousId: METAMETRICS_ANONYMOUS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: {
              foo: 'bar',
              ...DEFAULT_EVENT_PROPERTIES,
            },
            messageId: Utils.generateRandomId(),
            timestamp: new Date(),
          },
          spy.mock.calls[0][1],
        );
      });
    });

    it('should change "Transaction Submitted" anonymous event names to "Transaction Added Anon"', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'track');
        controller.trackEvent({
          event: 'Transaction Submitted',
          category: 'Unit Test',
          sensitiveProperties: { foo: 'bar' },
        });
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith(
          {
            event: `Transaction Submitted Anon`,
            anonymousId: METAMETRICS_ANONYMOUS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: {
              foo: 'bar',
              ...DEFAULT_EVENT_PROPERTIES,
            },
            messageId: Utils.generateRandomId(),
            timestamp: new Date(),
          },
          spy.mock.calls[0][1],
        );
      });
    });

    it('should change "Transaction Finalized" anonymous event names to "Transaction Added Anon"', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'track');
        controller.trackEvent({
          event: 'Transaction Finalized',
          category: 'Unit Test',
          sensitiveProperties: { foo: 'bar' },
        });
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith(
          {
            event: `Transaction Finalized Anon`,
            anonymousId: METAMETRICS_ANONYMOUS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: {
              foo: 'bar',
              ...DEFAULT_EVENT_PROPERTIES,
            },
            messageId: Utils.generateRandomId(),
            timestamp: new Date(),
          },
          spy.mock.calls[0][1],
        );
      });
    });
  });

  describe('trackPage', function () {
    it('should track a page view', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'page');
        controller.trackPage({
          name: 'home',
          environmentType: ENVIRONMENT_TYPE_BACKGROUND,
          page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
        });
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(
          {
            name: 'home',
            userId: TEST_META_METRICS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: {
              params: undefined,
              ...DEFAULT_PAGE_PROPERTIES,
            },
            messageId: Utils.generateRandomId(),
            timestamp: new Date(),
          },
          spy.mock.calls[0][1],
        );
      });
    });

    it('should not track a page view if user is not participating in metametrics', async function () {
      await withController(
        {
          options: {
            state: {
              participateInMetaMetrics: false,
            },
          },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'page');
          controller.trackPage({
            name: 'home',
            environmentType: ENVIRONMENT_TYPE_BACKGROUND,
            page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
          });
          expect(spy).toHaveBeenCalledTimes(0);
        },
      );
    });

    it('should track a page view if isOptInPath is true and user not yet opted in', async function () {
      await withController(
        {
          currentLocale: LOCALE,
          options: {
            state: {
              participateInMetaMetrics: true,
            },
          },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'page');
          controller.trackPage(
            {
              name: 'home',
              environmentType: ENVIRONMENT_TYPE_BACKGROUND,
              page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
            },
            { isOptInPath: true },
          );

          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(
            {
              name: 'home',
              userId: TEST_META_METRICS_ID,
              context: DEFAULT_TEST_CONTEXT,
              properties: {
                ...DEFAULT_PAGE_PROPERTIES,
              },
              messageId: Utils.generateRandomId(),
              timestamp: new Date(),
            },
            spy.mock.calls[0][1],
          );
        },
      );
    });

    it('multiple trackPage call with same actionId should result in same messageId being sent to segment', async function () {
      await withController(
        {
          currentLocale: LOCALE,
          options: {
            state: {
              participateInMetaMetrics: true,
            },
          },
        },
        ({ controller }) => {
          const spy = jest.spyOn(segmentMock, 'page');
          controller.trackPage(
            {
              name: 'home',
              actionId: DUMMY_ACTION_ID,
              environmentType: ENVIRONMENT_TYPE_BACKGROUND,
              page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
            },
            { isOptInPath: true },
          );
          controller.trackPage(
            {
              name: 'home',
              actionId: DUMMY_ACTION_ID,
              environmentType: ENVIRONMENT_TYPE_BACKGROUND,
              page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
            },
            { isOptInPath: true },
          );

          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy).toHaveBeenCalledWith(
            {
              name: 'home',
              userId: TEST_META_METRICS_ID,
              context: DEFAULT_TEST_CONTEXT,
              properties: DEFAULT_PAGE_PROPERTIES,
              messageId: DUMMY_ACTION_ID,
              timestamp: new Date(),
            },
            spy.mock.calls[0][1],
          );
        },
      );
    });
  });

  describe('deterministic messageId', function () {
    it('should use the actionId as messageId when provided', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'track');
        controller.trackEvent({
          event: 'Fake Event',
          category: 'Unit Test',
          properties: {
            chain_id: 'bar',
          },
          actionId: '0x001',
        });
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(
          {
            event: 'Fake Event',
            userId: TEST_META_METRICS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: {
              ...DEFAULT_EVENT_PROPERTIES,
              chain_id: 'bar',
            },
            messageId: '0x001',
            timestamp: new Date(),
          },
          spy.mock.calls[0][1],
        );
      });
    });

    it('should append 0x000 to the actionId of anonymized event when tracking sensitiveProperties', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'track');
        controller.trackEvent({
          event: 'Fake Event',
          category: 'Unit Test',
          sensitiveProperties: { foo: 'bar' },
          actionId: '0x001',
        });
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith(
          {
            event: 'Fake Event',
            anonymousId: METAMETRICS_ANONYMOUS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: {
              foo: 'bar',
              ...DEFAULT_EVENT_PROPERTIES,
            },
            messageId: '0x001-0x000',
            timestamp: new Date(),
          },
          spy.mock.calls[0][1],
        );
        expect(spy).toHaveBeenCalledWith(
          {
            event: 'Fake Event',
            userId: TEST_META_METRICS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: DEFAULT_EVENT_PROPERTIES,
            messageId: '0x001',
            timestamp: new Date(),
          },
          spy.mock.calls[1][1],
        );
      });
    });

    it('should use the uniqueIdentifier as messageId when provided', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'track');
        controller.trackEvent({
          event: 'Fake Event',
          category: 'Unit Test',
          properties: {
            chain_id: 'bar',
          },
          uniqueIdentifier: 'transaction-submitted-0000',
        });
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(
          {
            event: 'Fake Event',
            userId: TEST_META_METRICS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: {
              ...DEFAULT_EVENT_PROPERTIES,
              chain_id: 'bar',
            },
            messageId: 'transaction-submitted-0000',
            timestamp: new Date(),
          },
          spy.mock.calls[0][1],
        );
      });
    });

    it('should append 0x000 to the uniqueIdentifier of anonymized event when tracking sensitiveProperties', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'track');
        controller.trackEvent({
          event: 'Fake Event',
          category: 'Unit Test',
          sensitiveProperties: { foo: 'bar' },
          uniqueIdentifier: 'transaction-submitted-0000',
        });
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith(
          {
            event: 'Fake Event',
            anonymousId: METAMETRICS_ANONYMOUS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: {
              foo: 'bar',
              ...DEFAULT_EVENT_PROPERTIES,
            },
            messageId: 'transaction-submitted-0000-0x000',
            timestamp: new Date(),
          },
          spy.mock.calls[0][1],
        );
        expect(spy).toHaveBeenCalledWith(
          {
            event: 'Fake Event',
            userId: TEST_META_METRICS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: {
              ...DEFAULT_EVENT_PROPERTIES,
            },
            messageId: 'transaction-submitted-0000',
            timestamp: new Date(),
          },
          spy.mock.calls[1][1],
        );
      });
    });

    it('should combine the uniqueIdentifier and actionId as messageId when both provided', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'track');
        controller.trackEvent({
          event: 'Fake Event',
          category: 'Unit Test',
          properties: { chain_id: 'bar' },
          actionId: '0x001',
          uniqueIdentifier: 'transaction-submitted-0000',
        });
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(
          {
            event: 'Fake Event',
            userId: TEST_META_METRICS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: {
              ...DEFAULT_EVENT_PROPERTIES,
              chain_id: 'bar',
            },
            messageId: 'transaction-submitted-0000-0x001',
            timestamp: new Date(),
          },
          spy.mock.calls[0][1],
        );
      });
    });

    it('should append 0x000 to the combined uniqueIdentifier and actionId of anonymized event when tracking sensitiveProperties', async function () {
      await withController(({ controller }) => {
        const spy = jest.spyOn(segmentMock, 'track');
        controller.trackEvent({
          event: 'Fake Event',
          category: 'Unit Test',
          sensitiveProperties: { foo: 'bar' },
          actionId: '0x001',
          uniqueIdentifier: 'transaction-submitted-0000',
        });
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith(
          {
            event: 'Fake Event',
            anonymousId: METAMETRICS_ANONYMOUS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: {
              foo: 'bar',
              ...DEFAULT_EVENT_PROPERTIES,
            },
            messageId: 'transaction-submitted-0000-0x001-0x000',
            timestamp: new Date(),
          },
          spy.mock.calls[0][1],
        );
        expect(spy).toHaveBeenCalledWith(
          {
            event: 'Fake Event',
            userId: TEST_META_METRICS_ID,
            context: DEFAULT_TEST_CONTEXT,
            properties: {
              ...DEFAULT_EVENT_PROPERTIES,
            },
            messageId: 'transaction-submitted-0000-0x001',
            timestamp: new Date(),
          },
          spy.mock.calls[1][1],
        );
      });
    });
  });

  describe('_buildUserTraitsObject', function () {
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
          ledgerTransportType: LedgerTransportTypes.webhid,
          openSeaEnabled: true,
          useNftDetection: false,
          securityAlertsEnabled: true,
          theme: 'default',
          useTokenDetection: true,
          ShowNativeTokenAsMainBalance: true,
          security_providers: [],
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
          tokenSortConfig: {
            key: 'token-sort-key',
            order: 'dsc',
            sortCallback: 'stringNumeric',
          },
          participateInMetaMetrics: true,
          currentCurrency: 'usd',
          dataCollectionForMarketing: false,
          preferences: { privacyMode: true, tokenNetworkFilter: [] },
          ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
          custodyAccountDetails: {},
          ///: END:ONLY_INCLUDE_IF
        });

        expect(traits).toStrictEqual({
          [MetaMetricsUserTrait.AddressBookEntries]: 3,
          [MetaMetricsUserTrait.InstallDateExt]: '',
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
          [MetaMetricsUserTrait.OpenSeaApiEnabled]: true,
          [MetaMetricsUserTrait.ThreeBoxEnabled]: false,
          [MetaMetricsUserTrait.Theme]: 'default',
          [MetaMetricsUserTrait.TokenDetectionEnabled]: true,
          [MetaMetricsUserTrait.ShowNativeTokenAsMainBalance]: true,
          [MetaMetricsUserTrait.CurrentCurrency]: 'usd',
          [MetaMetricsUserTrait.HasMarketingConsent]: false,
          [MetaMetricsUserTrait.SecurityProviders]: ['blockaid'],
          [MetaMetricsUserTrait.IsMetricsOptedIn]: true,
          ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
          [MetaMetricsUserTrait.MmiExtensionId]: 'testid',
          [MetaMetricsUserTrait.MmiAccountAddress]: null,
          [MetaMetricsUserTrait.MmiIsCustodian]: false,
          ///: END:ONLY_INCLUDE_IF
          ///: BEGIN:ONLY_INCLUDE_IF(petnames)
          [MetaMetricsUserTrait.PetnameAddressCount]: 3,
          ///: END:ONLY_INCLUDE_IF
          [MetaMetricsUserTrait.TokenSortPreference]: 'token-sort-key',
          [MetaMetricsUserTrait.PrivacyModeEnabled]: true,
          [MetaMetricsUserTrait.NetworkFilterPreference]: [],
        });
      });
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
          theme: 'default',
          useTokenDetection: true,
          tokenSortConfig: {
            key: 'token-sort-key',
            order: 'dsc',
            sortCallback: 'stringNumeric',
          },
          ShowNativeTokenAsMainBalance: true,
          allNfts: {},
          participateInMetaMetrics: true,
          dataCollectionForMarketing: false,
          preferences: { privacyMode: true, tokenNetworkFilter: [] },
          securityAlertsEnabled: true,
          names: {
            ethereumAddress: {},
          },
          security_providers: ['blockaid'],
          currentCurrency: 'usd',
          ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
          custodyAccountDetails: {},
          ///: END:ONLY_INCLUDE_IF
        });

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
          theme: 'default',
          useTokenDetection: true,
          tokenSortConfig: {
            key: 'token-sort-key',
            order: 'dsc',
            sortCallback: 'stringNumeric',
          },
          ShowNativeTokenAsMainBalance: false,
          names: {
            ethereumAddress: {},
          },
          security_providers: ['blockaid'],
          currentCurrency: 'usd',
          allNfts: {},
          participateInMetaMetrics: true,
          dataCollectionForMarketing: false,
          preferences: { privacyMode: true, tokenNetworkFilter: [] },
          securityAlertsEnabled: true,
          ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
          custodyAccountDetails: {},
          ///: END:ONLY_INCLUDE_IF
        });

        expect(updatedTraits).toStrictEqual({
          [MetaMetricsUserTrait.AddressBookEntries]: 4,
          [MetaMetricsUserTrait.NumberOfAccounts]: 3,
          [MetaMetricsUserTrait.NumberOfTokens]: 1,
          [MetaMetricsUserTrait.OpenSeaApiEnabled]: false,
          [MetaMetricsUserTrait.ShowNativeTokenAsMainBalance]: false,
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
          theme: 'default',
          useTokenDetection: true,
          tokenSortConfig: {
            key: 'token-sort-key',
            order: 'dsc',
            sortCallback: 'stringNumeric',
          },
          ShowNativeTokenAsMainBalance: true,
          allNfts: {},
          names: {
            ethereumAddress: {},
          },
          participateInMetaMetrics: true,
          dataCollectionForMarketing: false,
          preferences: { privacyMode: true, tokenNetworkFilter: [] },
          securityAlertsEnabled: true,
          security_providers: ['blockaid'],
          currentCurrency: 'usd',
          ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
          custodyAccountDetails: {},
          ///: END:ONLY_INCLUDE_IF
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
          theme: 'default',
          useTokenDetection: true,
          tokenSortConfig: {
            key: 'token-sort-key',
            order: 'dsc',
            sortCallback: 'stringNumeric',
          },
          ShowNativeTokenAsMainBalance: true,
          allNfts: {},
          participateInMetaMetrics: true,
          dataCollectionForMarketing: false,
          preferences: { privacyMode: true, tokenNetworkFilter: [] },
          names: {
            ethereumAddress: {},
          },
          securityAlertsEnabled: true,
          security_providers: ['blockaid'],
          currentCurrency: 'usd',
          ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
          custodyAccountDetails: {},
          ///: END:ONLY_INCLUDE_IF
        });
        expect(updatedTraits).toStrictEqual(null);
      });
    });
  });

  describe('submitting segmentApiCalls to segment SDK', function () {
    it('should add event to store when submitting to SDK', async function () {
      await withController(({ controller }) => {
        controller.trackPage({}, { isOptInPath: true });
        const { segmentApiCalls } = controller.state;
        expect(Object.keys(segmentApiCalls).length > 0).toStrictEqual(true);
      });
    });

    it('should remove event from store when callback is invoked', async function () {
      const segmentInstance = createSegmentMock(2);
      const stubFn = (...args: unknown[]) => {
        const cb = args[1] as () => void;
        cb();
      };
      jest.spyOn(segmentInstance, 'track').mockImplementation(stubFn);
      jest.spyOn(segmentInstance, 'page').mockImplementation(stubFn);

      await withController(
        {
          options: {
            segment: segmentInstance,
          },
        },
        ({ controller }) => {
          controller.trackPage({}, { isOptInPath: true });
          const { segmentApiCalls } = controller.state;
          expect(Object.keys(segmentApiCalls).length === 0).toStrictEqual(true);
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
              participateInMetaMetrics: true,
              metaMetricsId: TEST_META_METRICS_ID,
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
          controller.trackEvent(
            {
              event: 'Fake Event',
              category: 'Unit Test',
              properties: {
                chain_id: '1',
              },
            },
            { isOptIn: true },
          );
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(
            {
              event: 'Fake Event',
              anonymousId: METAMETRICS_ANONYMOUS_ID,
              context: {
                ...DEFAULT_TEST_CONTEXT,
                marketingCampaignCookieId: TEST_GA_COOKIE_ID,
              },
              properties: {
                ...DEFAULT_EVENT_PROPERTIES,
                chain_id: '1',
              },
              messageId: Utils.generateRandomId(),
              timestamp: new Date(),
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
              metaMetricsId: TEST_META_METRICS_ID,
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
});

type WithControllerOptions = {
  currentLocale?: string;
  options?: Partial<MetaMetricsControllerOptions>;
  mockNetworkClientConfigurationsByNetworkClientId?: Record<
    NetworkClientId,
    {
      chainId: string;
    }
  >;
};

type WithControllerCallback<ReturnValue> = ({
  controller,
  triggerPreferencesControllerStateChange,
  triggerNetworkDidChange,
}: {
  controller: MetaMetricsController;
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
      currentLocale = LOCALE,
      mockNetworkClientConfigurationsByNetworkClientId = {
        selectedNetworkClientId: {
          chainId: DEFAULT_CHAIN_ID,
        },
      },
    } = rest;
    const controllerMessenger = new ControllerMessenger<
      AllowedActions,
      AllowedEvents
    >();

    controllerMessenger.registerActionHandler(
      'PreferencesController:getState',
      jest.fn().mockReturnValue({
        currentLocale,
      }),
    );

    controllerMessenger.registerActionHandler(
      'NetworkController:getState',
      jest.fn().mockReturnValue({
        selectedNetworkClientId: Object.keys(
          mockNetworkClientConfigurationsByNetworkClientId,
        )[0],
      }),
    );

    controllerMessenger.registerActionHandler(
      'NetworkController:getNetworkClientById',
      jest.fn().mockReturnValue({
        configuration: Object.values(
          mockNetworkClientConfigurationsByNetworkClientId,
        )[0],
      }),
    );

    return fn({
      controller: new MetaMetricsController({
        segment: segmentMock,
        messenger: controllerMessenger.getRestricted({
          name: 'MetaMetricsController',
          allowedActions: [
            'PreferencesController:getState',
            'NetworkController:getState',
            'NetworkController:getNetworkClientById',
          ],
          allowedEvents: [
            'PreferencesController:stateChange',
            'NetworkController:networkDidChange',
          ],
        }),
        version: '0.0.1',
        environment: 'test',
        extension: MOCK_EXTENSION,
        ...options,
        state: {
          participateInMetaMetrics: true,
          metaMetricsId: TEST_META_METRICS_ID,
          marketingCampaignCookieId: null,
          fragments: {
            testid: SAMPLE_PERSISTED_EVENT,
            testid2: SAMPLE_NON_PERSISTED_EVENT,
          },
          ...options.state,
        },
      }),
      triggerPreferencesControllerStateChange: (state) =>
        controllerMessenger.publish(
          'PreferencesController:stateChange',
          state,
          [],
        ),
      triggerNetworkDidChange: (state) =>
        controllerMessenger.publish(
          'NetworkController:networkDidChange',
          state,
        ),
    });
  } finally {
    // flush the queues manually after each test
    segmentMock.flush();
    jest.useRealTimers();
    jest.restoreAllMocks();
  }
}
