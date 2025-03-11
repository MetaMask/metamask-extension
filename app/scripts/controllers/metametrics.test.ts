import { toHex } from '@metamask/controller-utils';
import { NetworkState } from '@metamask/network-controller';
import { NameEntry, NameType } from '@metamask/name-controller';
import { AddressBookEntry } from '@metamask/address-book-controller';
import {
  Nft,
  Token,
  TokensControllerState,
} from '@metamask/assets-controllers';
import { InternalAccount } from '@metamask/keyring-api';
import { Browser } from 'webextension-polyfill';
import { Hex } from '@metamask/utils';
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
import MetaMetricsController, {
  MetaMetricsControllerOptions,
  MetaMetricsControllerState,
} from './metametrics';
import {
  getDefaultPreferencesControllerState,
  PreferencesControllerState,
} from './preferences-controller';

const segmentMock = createSegmentMock(2);

const VERSION = '0.0.1-test';
const FAKE_CHAIN_ID = '0x1338';
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
  chain_id: FAKE_CHAIN_ID,
  locale: LOCALE.replace('_', '-'),
  environment_type: 'background',
};

const DEFAULT_EVENT_PROPERTIES = {
  category: 'Unit Test',
  revenue: undefined,
  value: undefined,
  currency: undefined,
  extensionId: MOCK_EXTENSION_ID,
  ...DEFAULT_SHARED_PROPERTIES,
};

const DEFAULT_PAGE_PROPERTIES = {
  ...DEFAULT_SHARED_PROPERTIES,
};

const SAMPLE_PERSISTED_EVENT = {
  id: 'testid',
  persist: true,
  category: 'Unit Test',
  successEvent: 'sample persisted event success',
  failureEvent: 'sample persisted event failure',
  properties: {
    test: true,
  },
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

function getMetaMetricsController({
  participateInMetaMetrics = true,
  metaMetricsId = TEST_META_METRICS_ID,
  marketingCampaignCookieId = null,
  currentLocale = LOCALE,
  onPreferencesStateChange = () => {
    // do nothing
  },
  getCurrentChainId = () => FAKE_CHAIN_ID,
  onNetworkDidChange = () => {
    // do nothing
  },
  segment = segmentMock,
}: {
  currentLocale?: string;
  participateInMetaMetrics?: MetaMetricsControllerState['participateInMetaMetrics'];
  metaMetricsId?: MetaMetricsControllerState['metaMetricsId'];
  dataCollectionForMarketing?: MetaMetricsControllerState['dataCollectionForMarketing'];
  marketingCampaignCookieId?: MetaMetricsControllerState['marketingCampaignCookieId'];
  onPreferencesStateChange?: MetaMetricsControllerOptions['onPreferencesStateChange'];
  getCurrentChainId?: MetaMetricsControllerOptions['getCurrentChainId'];
  onNetworkDidChange?: MetaMetricsControllerOptions['onNetworkDidChange'];
  segment?: MetaMetricsControllerOptions['segment'];
} = {}) {
  return new MetaMetricsController({
    segment,
    getCurrentChainId,
    onNetworkDidChange,
    preferencesControllerState: {
      ...getDefaultPreferencesControllerState(),
      currentLocale,
    },
    onPreferencesStateChange,
    version: '0.0.1',
    environment: 'test',
    initState: {
      participateInMetaMetrics,
      metaMetricsId,
      marketingCampaignCookieId,
      fragments: {
        testid: SAMPLE_PERSISTED_EVENT,
        testid2: SAMPLE_NON_PERSISTED_EVENT,
      },
    },
    extension: MOCK_EXTENSION,
  });
}

describe('MetaMetricsController', function () {
  const now = new Date();
  beforeEach(function () {
    globalThis.sentry = {};
    jest.useFakeTimers().setSystemTime(now.getTime());
    jest.spyOn(Utils, 'generateRandomId').mockReturnValue('DUMMY_RANDOM_ID');
  });

  describe('constructor', function () {
    it('should properly initialize', function () {
      const spy = jest.spyOn(segmentMock, 'track');
      const metaMetricsController = getMetaMetricsController();
      expect(metaMetricsController.version).toStrictEqual(VERSION);
      expect(metaMetricsController.chainId).toStrictEqual(FAKE_CHAIN_ID);
      expect(
        metaMetricsController.state.participateInMetaMetrics,
      ).toStrictEqual(true);
      expect(metaMetricsController.state.metaMetricsId).toStrictEqual(
        TEST_META_METRICS_ID,
      );
      expect(
        metaMetricsController.state.marketingCampaignCookieId,
      ).toStrictEqual(null);
      expect(metaMetricsController.locale).toStrictEqual(
        LOCALE.replace('_', '-'),
      );
      expect(metaMetricsController.state.fragments).toStrictEqual({
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

    it('should update when network changes', function () {
      let chainId: Hex = '0x111';
      let networkDidChangeListener: (state: NetworkState) => void = () => {
        // do nothing
      };
      const onNetworkDidChange: (
        listener: (state: NetworkState) => void,
      ) => void = (listener) => {
        networkDidChangeListener = listener;
      };
      const metaMetricsController = getMetaMetricsController({
        getCurrentChainId: () => chainId,
        onNetworkDidChange,
      });

      chainId = '0x222';

      networkDidChangeListener({} as NetworkState);

      expect(metaMetricsController.chainId).toStrictEqual('0x222');
    });

    it('should update when preferences changes', function () {
      let subscribeListener: (
        state: PreferencesControllerState,
      ) => void = () => {
        // do nothing
      };
      const onPreferencesStateChange: MetaMetricsControllerOptions['onPreferencesStateChange'] =
        (listener) => {
          subscribeListener = listener;
        };
      const metaMetricsController = getMetaMetricsController({
        currentLocale: LOCALE,
        onPreferencesStateChange,
      });

      subscribeListener({
        ...getDefaultPreferencesControllerState(),
        currentLocale: 'en_UK',
      });
      expect(metaMetricsController.locale).toStrictEqual('en-UK');
    });
  });

  describe('generateMetaMetricsId', function () {
    it('should generate an 0x prefixed hex string', function () {
      const metaMetricsController = getMetaMetricsController();
      expect(
        metaMetricsController.generateMetaMetricsId().startsWith('0x'),
      ).toStrictEqual(true);
    });
  });

  describe('getMetaMetricsId', function () {
    it('should generate or return the metametrics id', function () {
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: true,
        metaMetricsId: null,
      });

      // Starts off being empty.
      expect(metaMetricsController.state.metaMetricsId).toStrictEqual(null);

      // Create a new metametrics id.
      const clientMetaMetricsId = metaMetricsController.getMetaMetricsId();
      expect(clientMetaMetricsId.startsWith('0x')).toStrictEqual(true);

      // Return same metametrics id.
      const sameMetaMetricsId = metaMetricsController.getMetaMetricsId();
      expect(clientMetaMetricsId).toStrictEqual(sameMetaMetricsId);
    });
  });

  describe('identify', function () {
    it('should call segment.identify for valid traits if user is participating in metametrics', function () {
      const spy = jest.spyOn(segmentMock, 'identify');
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: true,
        metaMetricsId: TEST_META_METRICS_ID,
      });
      metaMetricsController.identify({
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
    });

    it('should transform date type traits into ISO-8601 timestamp strings', function () {
      const spy = jest.spyOn(segmentMock, 'identify');
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: true,
        metaMetricsId: TEST_META_METRICS_ID,
      });
      metaMetricsController.identify({
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
    });

    it('should not call segment.identify if user is not participating in metametrics', function () {
      const spy = jest.spyOn(segmentMock, 'identify');
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: false,
      });
      metaMetricsController.identify(MOCK_TRAITS);
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should not call segment.identify if there are no valid traits to identify', function () {
      const spy = jest.spyOn(segmentMock, 'identify');
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: true,
        metaMetricsId: TEST_META_METRICS_ID,
      });
      metaMetricsController.identify(MOCK_INVALID_TRAITS);
      expect(spy).toHaveBeenCalledTimes(0);
    });
  });

  describe('setParticipateInMetaMetrics', function () {
    it('should update the value of participateInMetaMetrics', async function () {
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: null,
        metaMetricsId: null,
      });
      expect(
        metaMetricsController.state.participateInMetaMetrics,
      ).toStrictEqual(null);
      await metaMetricsController.setParticipateInMetaMetrics(true);
      expect(
        metaMetricsController.state.participateInMetaMetrics,
      ).toStrictEqual(true);
      await metaMetricsController.setParticipateInMetaMetrics(false);
      expect(
        metaMetricsController.state.participateInMetaMetrics,
      ).toStrictEqual(false);
    });
    it('should generate and update the metaMetricsId when set to true', async function () {
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: null,
        metaMetricsId: null,
      });
      expect(metaMetricsController.state.metaMetricsId).toStrictEqual(null);
      await metaMetricsController.setParticipateInMetaMetrics(true);
      expect(typeof metaMetricsController.state.metaMetricsId).toStrictEqual(
        'string',
      );
    });
    it('should not nullify the metaMetricsId when set to false', async function () {
      const metaMetricsController = getMetaMetricsController();
      await metaMetricsController.setParticipateInMetaMetrics(false);
      expect(metaMetricsController.state.metaMetricsId).toStrictEqual(
        TEST_META_METRICS_ID,
      );
    });
    it('should nullify the marketingCampaignCookieId when participateInMetaMetrics is toggled off', async function () {
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: true,
        metaMetricsId: TEST_META_METRICS_ID,
        dataCollectionForMarketing: true,
        marketingCampaignCookieId: TEST_GA_COOKIE_ID,
      });
      expect(
        metaMetricsController.state.marketingCampaignCookieId,
      ).toStrictEqual(TEST_GA_COOKIE_ID);
      await metaMetricsController.setParticipateInMetaMetrics(false);
      expect(
        metaMetricsController.state.marketingCampaignCookieId,
      ).toStrictEqual(null);
    });
  });

  describe('submitEvent', function () {
    it('should not track an event if user is not participating in metametrics', function () {
      const spy = jest.spyOn(segmentMock, 'track');
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: false,
      });
      metaMetricsController.submitEvent({
        event: 'Fake Event',
        category: 'Unit Test',
        properties: {
          chain_id: '1',
        },
      });
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should track an event if user has not opted in, but isOptIn is true', function () {
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: true,
      });
      const spy = jest.spyOn(segmentMock, 'track');
      metaMetricsController.submitEvent(
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
    });

    it('should track an event during optin and allow for metaMetricsId override', function () {
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: true,
      });
      const spy = jest.spyOn(segmentMock, 'track');
      metaMetricsController.submitEvent(
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
    });

    it('should track a legacy event', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = jest.spyOn(segmentMock, 'track');
      metaMetricsController.submitEvent(
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

    it('should track a non legacy event', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = jest.spyOn(segmentMock, 'track');
      metaMetricsController.submitEvent({
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

    it('should immediately flush queue if flushImmediately set to true', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = jest.spyOn(segmentMock, 'flush');
      metaMetricsController.submitEvent(
        {
          event: 'Fake Event',
          category: 'Unit Test',
        },
        { flushImmediately: true },
      );
      expect(spy).not.toThrow();
    });

    it('should throw if event or category not provided', async function () {
      const metaMetricsController = getMetaMetricsController();

      await expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error because we are testing the error case
        metaMetricsController.submitEvent({ event: 'test' }),
      ).rejects.toThrow(/Must specify event and category\./u);

      await expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error because we are testing the error case
        metaMetricsController.submitEvent({ category: 'test' }),
      ).rejects.toThrow(/Must specify event and category\./u);
    });

    it('should throw if provided sensitiveProperties, when excludeMetaMetricsId is true', async function () {
      const metaMetricsController = getMetaMetricsController();
      await expect(
        metaMetricsController.submitEvent(
          {
            event: 'Fake Event',
            category: 'Unit Test',
            sensitiveProperties: { foo: 'bar' },
          },
          { excludeMetaMetricsId: true },
        ),
      ).rejects.toThrow(
        /sensitiveProperties was specified in an event payload that also set the excludeMetaMetricsId flag/u,
      );
    });

    it('should track sensitiveProperties in a separate, anonymous event', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = jest.spyOn(segmentMock, 'track');
      metaMetricsController.submitEvent({
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

  describe('Change Signature XXX anonymous event names', function () {
    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      ['Signature Requested', 'Signature Requested Anon'],
      ['Signature Rejected', 'Signature Rejected Anon'],
      ['Signature Approved', 'Signature Approved Anon'],
    ])(
      'should change "%s" anonymous event names to "%s"',
      (eventType: string, anonEventType: string) => {
        const metaMetricsController = getMetaMetricsController();
        const spy = jest.spyOn(segmentMock, 'track');
        metaMetricsController.submitEvent({
          event: eventType,
          category: 'Unit Test',
          properties: { ...DEFAULT_EVENT_PROPERTIES },
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
      },
    );
  });

  describe('Change Transaction XXX anonymous event namnes', function () {
    it('should change "Transaction Added" anonymous event names to "Transaction Added Anon"', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = jest.spyOn(segmentMock, 'track');
      metaMetricsController.submitEvent({
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

    it('should change "Transaction Submitted" anonymous event names to "Transaction Added Anon"', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = jest.spyOn(segmentMock, 'track');
      metaMetricsController.submitEvent({
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

    it('should change "Transaction Finalized" anonymous event names to "Transaction Added Anon"', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = jest.spyOn(segmentMock, 'track');
      metaMetricsController.submitEvent({
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

  describe('trackPage', function () {
    it('should track a page view', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = jest.spyOn(segmentMock, 'page');
      metaMetricsController.trackPage({
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

    it('should not track a page view if user is not participating in metametrics', function () {
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: false,
      });
      const spy = jest.spyOn(segmentMock, 'page');
      metaMetricsController.trackPage({
        name: 'home',
        environmentType: ENVIRONMENT_TYPE_BACKGROUND,
        page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
      });
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should track a page view if isOptInPath is true and user not yet opted in', function () {
      const metaMetricsController = getMetaMetricsController({
        currentLocale: LOCALE,
        participateInMetaMetrics: true,
        onPreferencesStateChange: jest.fn(),
      });
      const spy = jest.spyOn(segmentMock, 'page');
      metaMetricsController.trackPage(
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
    });

    it('multiple trackPage call with same actionId should result in same messageId being sent to segment', function () {
      const metaMetricsController = getMetaMetricsController({
        currentLocale: LOCALE,
        participateInMetaMetrics: true,
        onPreferencesStateChange: jest.fn(),
      });
      const spy = jest.spyOn(segmentMock, 'page');
      metaMetricsController.trackPage(
        {
          name: 'home',
          actionId: DUMMY_ACTION_ID,
          environmentType: ENVIRONMENT_TYPE_BACKGROUND,
          page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
        },
        { isOptInPath: true },
      );
      metaMetricsController.trackPage(
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
    });
  });

  describe('deterministic messageId', function () {
    it('should use the actionId as messageId when provided', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = jest.spyOn(segmentMock, 'track');
      metaMetricsController.submitEvent({
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

    it('should append 0x000 to the actionId of anonymized event when tracking sensitiveProperties', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = jest.spyOn(segmentMock, 'track');
      metaMetricsController.submitEvent({
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

    it('should use the uniqueIdentifier as messageId when provided', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = jest.spyOn(segmentMock, 'track');
      metaMetricsController.submitEvent({
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

    it('should append 0x000 to the uniqueIdentifier of anonymized event when tracking sensitiveProperties', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = jest.spyOn(segmentMock, 'track');
      metaMetricsController.submitEvent({
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

    it('should combine the uniqueIdentifier and actionId as messageId when both provided', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = jest.spyOn(segmentMock, 'track');
      metaMetricsController.submitEvent({
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

    it('should append 0x000 to the combined uniqueIdentifier and actionId of anonymized event when tracking sensitiveProperties', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = jest.spyOn(segmentMock, 'track');
      metaMetricsController.submitEvent({
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

  describe('_buildUserTraitsObject', function () {
    it('should return full user traits object on first call', function () {
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

      const metaMetricsController = getMetaMetricsController();
      const traits = metaMetricsController._buildUserTraitsObject({
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
      });
    });

    it('should return only changed traits object on subsequent calls', function () {
      const metaMetricsController = getMetaMetricsController();
      const networkState = mockNetworkState(
        { chainId: CHAIN_IDS.MAINNET },
        { chainId: CHAIN_IDS.GOERLI },
      );
      metaMetricsController._buildUserTraitsObject({
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

      const updatedTraits = metaMetricsController._buildUserTraitsObject({
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

    it('should return null if no traits changed', function () {
      const metaMetricsController = getMetaMetricsController();
      const networkState = mockNetworkState(
        { chainId: CHAIN_IDS.MAINNET },
        { chainId: CHAIN_IDS.GOERLI },
      );
      metaMetricsController._buildUserTraitsObject({
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
        securityAlertsEnabled: true,
        security_providers: ['blockaid'],
        currentCurrency: 'usd',
        ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
        custodyAccountDetails: {},
        ///: END:ONLY_INCLUDE_IF
      });

      const updatedTraits = metaMetricsController._buildUserTraitsObject({
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

  describe('submitting segmentApiCalls to segment SDK', function () {
    it('should add event to store when submitting to SDK', function () {
      const metaMetricsController = getMetaMetricsController({});
      metaMetricsController.trackPage({}, { isOptInPath: true });
      const { segmentApiCalls } = metaMetricsController.store.getState();
      expect(Object.keys(segmentApiCalls).length > 0).toStrictEqual(true);
    });

    it('should remove event from store when callback is invoked', function () {
      const segmentInstance = createSegmentMock(2);
      const stubFn = (...args: unknown[]) => {
        const cb = args[1] as () => void;
        cb();
      };
      jest.spyOn(segmentInstance, 'track').mockImplementation(stubFn);
      jest.spyOn(segmentInstance, 'page').mockImplementation(stubFn);

      const metaMetricsController = getMetaMetricsController({
        segment: segmentInstance,
      });
      metaMetricsController.trackPage({}, { isOptInPath: true });
      const { segmentApiCalls } = metaMetricsController.store.getState();
      expect(Object.keys(segmentApiCalls).length === 0).toStrictEqual(true);
    });
  });
  describe('setMarketingCampaignCookieId', function () {
    it('should update marketingCampaignCookieId in the context when cookieId is available', async function () {
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: true,
        metaMetricsId: TEST_META_METRICS_ID,
        dataCollectionForMarketing: true,
      });
      metaMetricsController.setMarketingCampaignCookieId(TEST_GA_COOKIE_ID);
      expect(
        metaMetricsController.state.marketingCampaignCookieId,
      ).toStrictEqual(TEST_GA_COOKIE_ID);
      const spy = jest.spyOn(segmentMock, 'track');
      metaMetricsController.submitEvent(
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
    });
  });
  describe('setDataCollectionForMarketing', function () {
    it('should nullify the marketingCampaignCookieId when Data collection for marketing is toggled off', async function () {
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: true,
        metaMetricsId: TEST_META_METRICS_ID,
        dataCollectionForMarketing: true,
        marketingCampaignCookieId: TEST_GA_COOKIE_ID,
      });
      expect(
        metaMetricsController.state.marketingCampaignCookieId,
      ).toStrictEqual(TEST_GA_COOKIE_ID);
      await metaMetricsController.setDataCollectionForMarketing(false);
      expect(
        metaMetricsController.state.marketingCampaignCookieId,
      ).toStrictEqual(null);
    });
  });
  afterEach(function () {
    // flush the queues manually after each test
    segmentMock.flush();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
});
