import { strict as assert } from 'assert';
import sinon from 'sinon';
import { ENVIRONMENT_TYPE_BACKGROUND } from '../../../shared/constants/app';
import { createSegmentMock } from '../lib/segment';
import {
  METAMETRICS_ANONYMOUS_ID,
  METAMETRICS_BACKGROUND_PAGE_OBJECT,
  TRAITS,
} from '../../../shared/constants/metametrics';
import waitUntilCalled from '../../../test/lib/wait-until-called';
import {
  CHAIN_IDS,
  CURRENCY_SYMBOLS,
  NETWORK_TYPES,
} from '../../../shared/constants/network';
import * as Utils from '../lib/util';
import MetaMetricsController from './metametrics';
import { NETWORK_EVENTS } from './network';

const segment = createSegmentMock(2, 10000);

const VERSION = '0.0.1-test';
const FAKE_CHAIN_ID = '0x1338';
const LOCALE = 'en_US';
const TEST_META_METRICS_ID = '0xabc';
const DUMMY_ACTION_ID = 'DUMMY_ACTION_ID';

const MOCK_TRAITS = {
  test_boolean: true,
  test_string: 'abc',
  test_number: 123,
  test_bool_array: [true, true, false],
  test_string_array: ['test', 'test', 'test'],
  test_boolean_array: [1, 2, 3],
};

const MOCK_INVALID_TRAITS = {
  test_null: null,
  test_array_multi_types: [true, 'a', 1],
};

const DEFAULT_TEST_CONTEXT = {
  app: { name: 'MetaMask Extension', version: VERSION },
  page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
  referrer: undefined,
  userAgent: window.navigator.userAgent,
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
  ...DEFAULT_SHARED_PROPERTIES,
};

const DEFAULT_PAGE_PROPERTIES = {
  ...DEFAULT_SHARED_PROPERTIES,
};

function getMockNetworkController(
  chainId = FAKE_CHAIN_ID,
  provider = { type: NETWORK_TYPES.MAINNET },
) {
  let networkStore = { chainId, provider };
  const on = sinon.stub().withArgs(NETWORK_EVENTS.NETWORK_DID_CHANGE);
  const updateState = (newState) => {
    networkStore = { ...networkStore, ...newState };
    on.getCall(0).args[1]();
  };
  return {
    store: {
      getState: () => networkStore,
      updateState,
    },
    getCurrentChainId: () => networkStore.chainId,
    getNetworkIdentifier: () => networkStore.provider.type,
    on,
  };
}

function getMockPreferencesStore({ currentLocale = LOCALE } = {}) {
  let preferencesStore = {
    currentLocale,
  };
  const subscribe = sinon.stub();
  const updateState = (newState) => {
    preferencesStore = { ...preferencesStore, ...newState };
    subscribe.getCall(0).args[0](preferencesStore);
  };
  return {
    getState: sinon.stub().returns(preferencesStore),
    updateState,
    subscribe,
  };
}

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
  properties: {
    test: true,
  },
};

function getMetaMetricsController({
  participateInMetaMetrics = true,
  metaMetricsId = TEST_META_METRICS_ID,
  preferencesStore = getMockPreferencesStore(),
  networkController = getMockNetworkController(),
  segmentInstance,
} = {}) {
  return new MetaMetricsController({
    segment: segmentInstance || segment,
    getCurrentChainId:
      networkController.getCurrentChainId.bind(networkController),
    onNetworkDidChange: networkController.on.bind(
      networkController,
      NETWORK_EVENTS.NETWORK_DID_CHANGE,
    ),
    preferencesStore,
    version: '0.0.1',
    environment: 'test',
    initState: {
      participateInMetaMetrics,
      metaMetricsId,
      fragments: {
        testid: SAMPLE_PERSISTED_EVENT,
        testid2: SAMPLE_NON_PERSISTED_EVENT,
      },
      events: {},
    },
  });
}
describe('MetaMetricsController', function () {
  const now = new Date();
  let clock;
  beforeEach(function () {
    clock = sinon.useFakeTimers(now.getTime());
    sinon.stub(Utils, 'generateRandomId').returns('DUMMY_RANDOM_ID');
  });

  describe('constructor', function () {
    it('should properly initialize', function () {
      const mock = sinon.mock(segment);
      mock
        .expects('track')
        .once()
        .withArgs({
          event: 'sample non-persisted event failure',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            ...DEFAULT_EVENT_PROPERTIES,
            test: true,
          },
          messageId: Utils.generateRandomId(),
          timestamp: new Date(),
        });
      const metaMetricsController = getMetaMetricsController();
      assert.strictEqual(metaMetricsController.version, VERSION);
      assert.strictEqual(metaMetricsController.chainId, FAKE_CHAIN_ID);
      assert.strictEqual(
        metaMetricsController.state.participateInMetaMetrics,
        true,
      );
      assert.strictEqual(
        metaMetricsController.state.metaMetricsId,
        TEST_META_METRICS_ID,
      );
      assert.strictEqual(
        metaMetricsController.locale,
        LOCALE.replace('_', '-'),
      );
      assert.deepStrictEqual(metaMetricsController.state.fragments, {
        testid: SAMPLE_PERSISTED_EVENT,
      });
      mock.verify();
    });

    it('should update when network changes', function () {
      const networkController = getMockNetworkController();
      const metaMetricsController = getMetaMetricsController({
        networkController,
      });
      networkController.store.updateState({
        provider: {
          type: 'NEW_NETWORK',
        },
        chainId: '0xaab',
      });
      assert.strictEqual(metaMetricsController.chainId, '0xaab');
    });

    it('should update when preferences changes', function () {
      const preferencesStore = getMockPreferencesStore();
      const metaMetricsController = getMetaMetricsController({
        preferencesStore,
      });
      preferencesStore.updateState({
        currentLocale: 'en_UK',
      });
      assert.strictEqual(metaMetricsController.locale, 'en-UK');
    });
  });

  describe('generateMetaMetricsId', function () {
    it('should generate an 0x prefixed hex string', function () {
      const metaMetricsController = getMetaMetricsController();
      assert.equal(
        metaMetricsController.generateMetaMetricsId().startsWith('0x'),
        true,
      );
    });
  });

  describe('identify', function () {
    it('should call segment.identify for valid traits if user is participating in metametrics', async function () {
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: true,
        metaMetricsId: TEST_META_METRICS_ID,
      });
      const mock = sinon.mock(segment);

      mock.expects('identify').once().withArgs({
        userId: TEST_META_METRICS_ID,
        traits: MOCK_TRAITS,
        messageId: Utils.generateRandomId(),
        timestamp: new Date(),
      });

      metaMetricsController.identify({
        ...MOCK_TRAITS,
        ...MOCK_INVALID_TRAITS,
      });

      mock.verify();
    });

    it('should transform date type traits into ISO-8601 timestamp strings', async function () {
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: true,
        metaMetricsId: TEST_META_METRICS_ID,
      });
      const mock = sinon.mock(segment);

      const mockDate = new Date();
      const mockDateISOString = mockDate.toISOString();

      mock
        .expects('identify')
        .once()
        .withArgs({
          userId: TEST_META_METRICS_ID,
          traits: {
            test_date: mockDateISOString,
          },
          messageId: Utils.generateRandomId(),
          timestamp: new Date(),
        });

      metaMetricsController.identify({
        test_date: mockDate,
      });
      mock.verify();
    });

    it('should not call segment.identify if user is not participating in metametrics', function () {
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: false,
      });
      const mock = sinon.mock(segment);

      mock.expects('identify').never();

      metaMetricsController.identify(MOCK_TRAITS);
      mock.verify();
    });

    it('should not call segment.identify if there are no valid traits to identify', async function () {
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: true,
        metaMetricsId: TEST_META_METRICS_ID,
      });
      const mock = sinon.mock(segment);

      mock.expects('identify').never();

      metaMetricsController.identify(MOCK_INVALID_TRAITS);
      mock.verify();
    });
  });

  describe('setParticipateInMetaMetrics', function () {
    it('should update the value of participateInMetaMetrics', function () {
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: null,
        metaMetricsId: null,
      });
      assert.equal(metaMetricsController.state.participateInMetaMetrics, null);
      metaMetricsController.setParticipateInMetaMetrics(true);
      assert.equal(metaMetricsController.state.participateInMetaMetrics, true);
      metaMetricsController.setParticipateInMetaMetrics(false);
      assert.equal(metaMetricsController.state.participateInMetaMetrics, false);
    });
    it('should generate and update the metaMetricsId when set to true', function () {
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: null,
        metaMetricsId: null,
      });
      assert.equal(metaMetricsController.state.metaMetricsId, null);
      metaMetricsController.setParticipateInMetaMetrics(true);
      assert.equal(typeof metaMetricsController.state.metaMetricsId, 'string');
    });
    it('should nullify the metaMetricsId when set to false', function () {
      const metaMetricsController = getMetaMetricsController();
      metaMetricsController.setParticipateInMetaMetrics(false);
      assert.equal(metaMetricsController.state.metaMetricsId, null);
    });
  });

  describe('submitEvent', function () {
    it('should not track an event if user is not participating in metametrics', function () {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: false,
      });
      mock.expects('track').never();
      metaMetricsController.submitEvent({
        event: 'Fake Event',
        category: 'Unit Test',
        properties: {
          test: 1,
        },
      });
      mock.verify();
    });

    it('should track an event if user has not opted in, but isOptIn is true', function () {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: true,
      });
      mock
        .expects('track')
        .once()
        .withArgs({
          event: 'Fake Event',
          anonymousId: METAMETRICS_ANONYMOUS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            test: 1,
            ...DEFAULT_EVENT_PROPERTIES,
          },
          messageId: Utils.generateRandomId(),
          timestamp: new Date(),
        });
      metaMetricsController.submitEvent(
        {
          event: 'Fake Event',
          category: 'Unit Test',
          properties: {
            test: 1,
          },
        },
        { isOptIn: true },
      );
      mock.verify();
    });

    it('should track an event during optin and allow for metaMetricsId override', function () {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: true,
      });
      mock
        .expects('track')
        .once()
        .withArgs({
          event: 'Fake Event',
          userId: 'TESTID',
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            test: 1,
            ...DEFAULT_EVENT_PROPERTIES,
          },
          messageId: Utils.generateRandomId(),
          timestamp: new Date(),
        });
      metaMetricsController.submitEvent(
        {
          event: 'Fake Event',
          category: 'Unit Test',
          properties: {
            test: 1,
          },
        },
        { isOptIn: true, metaMetricsId: 'TESTID' },
      );
      mock.verify();
    });

    it('should track a legacy event', function () {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController();
      mock
        .expects('track')
        .once()
        .withArgs({
          event: 'Fake Event',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            test: 1,
            legacy_event: true,
            ...DEFAULT_EVENT_PROPERTIES,
          },
          messageId: Utils.generateRandomId(),
          timestamp: new Date(),
        });
      metaMetricsController.submitEvent(
        {
          event: 'Fake Event',
          category: 'Unit Test',
          properties: {
            test: 1,
          },
        },
        { matomoEvent: true },
      );
      mock.verify();
    });

    it('should track a non legacy event', function () {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController();
      mock
        .expects('track')
        .once()
        .withArgs({
          event: 'Fake Event',
          properties: {
            test: 1,
            ...DEFAULT_EVENT_PROPERTIES,
          },
          context: DEFAULT_TEST_CONTEXT,
          userId: TEST_META_METRICS_ID,
          messageId: Utils.generateRandomId(),
          timestamp: new Date(),
        });
      metaMetricsController.submitEvent({
        event: 'Fake Event',
        category: 'Unit Test',
        properties: {
          test: 1,
        },
      });
      mock.verify();
    });

    it('should immediately flush queue if flushImmediately set to true', async function () {
      const metaMetricsController = getMetaMetricsController();
      const flushStub = sinon.stub(segment, 'flush');
      const flushCalled = waitUntilCalled(flushStub, segment);
      metaMetricsController.submitEvent(
        {
          event: 'Fake Event',
          category: 'Unit Test',
        },
        { flushImmediately: true },
      );
      assert.doesNotReject(flushCalled());
    });

    it('should throw if event or category not provided', function () {
      const metaMetricsController = getMetaMetricsController();
      assert.rejects(
        () => metaMetricsController.submitEvent({ event: 'test' }),
        /Must specify event and category\./u,
        'must specify category',
      );

      assert.rejects(
        () => metaMetricsController.submitEvent({ category: 'test' }),
        /Must specify event and category\./u,
        'must specify event',
      );
    });

    it('should throw if provided sensitiveProperties, when excludeMetaMetricsId is true', function () {
      const metaMetricsController = getMetaMetricsController();
      assert.rejects(
        () =>
          metaMetricsController.submitEvent(
            {
              event: 'Fake Event',
              category: 'Unit Test',
              sensitiveProperties: { foo: 'bar' },
            },
            { excludeMetaMetricsId: true },
          ),
        /sensitiveProperties was specified in an event payload that also set the excludeMetaMetricsId flag/u,
      );
    });

    it('should track sensitiveProperties in a separate, anonymous event', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = sinon.spy(segment, 'track');
      metaMetricsController.submitEvent({
        event: 'Fake Event',
        category: 'Unit Test',
        sensitiveProperties: { foo: 'bar' },
      });
      assert.ok(spy.calledTwice);
      assert.ok(
        spy.calledWith({
          event: 'Fake Event',
          anonymousId: METAMETRICS_ANONYMOUS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            foo: 'bar',
            ...DEFAULT_EVENT_PROPERTIES,
          },
          messageId: Utils.generateRandomId(),
          timestamp: new Date(),
        }),
      );
      assert.ok(
        spy.calledWith({
          event: 'Fake Event',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: DEFAULT_EVENT_PROPERTIES,
          messageId: Utils.generateRandomId(),
          timestamp: new Date(),
        }),
      );
    });
  });

  describe('trackPage', function () {
    it('should track a page view', function () {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController();
      mock
        .expects('page')
        .once()
        .withArgs({
          name: 'home',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            params: null,
            ...DEFAULT_PAGE_PROPERTIES,
          },
          messageId: Utils.generateRandomId(),
          timestamp: new Date(),
        });
      metaMetricsController.trackPage({
        name: 'home',
        params: null,
        environmentType: ENVIRONMENT_TYPE_BACKGROUND,
        page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
      });
      mock.verify();
    });

    it('should not track a page view if user is not participating in metametrics', function () {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: false,
      });
      mock.expects('page').never();
      metaMetricsController.trackPage({
        name: 'home',
        params: null,
        environmentType: ENVIRONMENT_TYPE_BACKGROUND,
        page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
      });
      mock.verify();
    });

    it('should track a page view if isOptInPath is true and user not yet opted in', function () {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController({
        preferencesStore: getMockPreferencesStore({
          participateInMetaMetrics: null,
        }),
      });
      mock
        .expects('page')
        .once()
        .withArgs({
          name: 'home',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            params: null,
            ...DEFAULT_PAGE_PROPERTIES,
          },
          messageId: Utils.generateRandomId(),
          timestamp: new Date(),
        });
      metaMetricsController.trackPage(
        {
          name: 'home',
          params: null,
          environmentType: ENVIRONMENT_TYPE_BACKGROUND,
          page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
        },
        { isOptInPath: true },
      );
      mock.verify();
    });

    it('multiple trackPage call with same actionId should result in same messageId being sent to segment', function () {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController({
        preferencesStore: getMockPreferencesStore({
          participateInMetaMetrics: null,
        }),
      });
      mock
        .expects('page')
        .twice()
        .withArgs({
          name: 'home',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            params: null,
            ...DEFAULT_PAGE_PROPERTIES,
          },
          messageId: DUMMY_ACTION_ID,
          timestamp: new Date(),
        });
      metaMetricsController.trackPage(
        {
          name: 'home',
          params: null,
          actionId: DUMMY_ACTION_ID,
          environmentType: ENVIRONMENT_TYPE_BACKGROUND,
          page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
        },
        { isOptInPath: true },
      );
      metaMetricsController.trackPage(
        {
          name: 'home',
          params: null,
          actionId: DUMMY_ACTION_ID,
          environmentType: ENVIRONMENT_TYPE_BACKGROUND,
          page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
        },
        { isOptInPath: true },
      );
      mock.verify();
    });
  });

  describe('deterministic messageId', function () {
    it('should use the actionId as messageId when provided', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = sinon.spy(segment, 'track');
      metaMetricsController.submitEvent({
        event: 'Fake Event',
        category: 'Unit Test',
        properties: { foo: 'bar' },
        actionId: '0x001',
      });
      assert.ok(spy.calledOnce);
      assert.ok(
        spy.calledWith({
          event: 'Fake Event',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            foo: 'bar',
            ...DEFAULT_EVENT_PROPERTIES,
          },
          messageId: '0x001',
          timestamp: new Date(),
        }),
      );
    });

    it('should append 0x000 to the actionId of anonymized event when tracking sensitiveProperties', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = sinon.spy(segment, 'track');
      metaMetricsController.submitEvent({
        event: 'Fake Event',
        category: 'Unit Test',
        sensitiveProperties: { foo: 'bar' },
        actionId: '0x001',
      });
      assert.ok(spy.calledTwice);

      assert.ok(
        spy.calledWith({
          event: 'Fake Event',
          anonymousId: METAMETRICS_ANONYMOUS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            foo: 'bar',
            ...DEFAULT_EVENT_PROPERTIES,
          },
          messageId: '0x001-0x000',
          timestamp: new Date(),
        }),
      );
      assert.ok(
        spy.calledWith({
          event: 'Fake Event',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            ...DEFAULT_EVENT_PROPERTIES,
          },
          messageId: '0x001',
          timestamp: new Date(),
        }),
      );
    });

    it('should use the uniqueIdentifier as messageId when provided', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = sinon.spy(segment, 'track');
      metaMetricsController.submitEvent({
        event: 'Fake Event',
        category: 'Unit Test',
        properties: { foo: 'bar' },
        uniqueIdentifier: 'transaction-submitted-0000',
      });
      assert.ok(spy.calledOnce);
      assert.ok(
        spy.calledWith({
          event: 'Fake Event',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            foo: 'bar',
            ...DEFAULT_EVENT_PROPERTIES,
          },
          messageId: 'transaction-submitted-0000',
          timestamp: new Date(),
        }),
      );
    });

    it('should append 0x000 to the uniqueIdentifier of anonymized event when tracking sensitiveProperties', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = sinon.spy(segment, 'track');
      metaMetricsController.submitEvent({
        event: 'Fake Event',
        category: 'Unit Test',
        sensitiveProperties: { foo: 'bar' },
        uniqueIdentifier: 'transaction-submitted-0000',
      });
      assert.ok(spy.calledTwice);
      assert.ok(
        spy.calledWith({
          event: 'Fake Event',
          anonymousId: METAMETRICS_ANONYMOUS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            foo: 'bar',
            ...DEFAULT_EVENT_PROPERTIES,
          },
          messageId: 'transaction-submitted-0000-0x000',
          timestamp: new Date(),
        }),
      );
      assert.ok(
        spy.calledWith({
          event: 'Fake Event',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            ...DEFAULT_EVENT_PROPERTIES,
          },
          messageId: 'transaction-submitted-0000',
          timestamp: new Date(),
        }),
      );
    });

    it('should combine the uniqueIdentifier and actionId as messageId when both provided', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = sinon.spy(segment, 'track');
      metaMetricsController.submitEvent({
        event: 'Fake Event',
        category: 'Unit Test',
        properties: { foo: 'bar' },
        actionId: '0x001',
        uniqueIdentifier: 'transaction-submitted-0000',
      });
      assert.ok(spy.calledOnce);
      assert.ok(
        spy.calledWith({
          event: 'Fake Event',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            foo: 'bar',
            ...DEFAULT_EVENT_PROPERTIES,
          },
          messageId: 'transaction-submitted-0000-0x001',
          timestamp: new Date(),
        }),
      );
    });

    it('should append 0x000 to the combined uniqueIdentifier and actionId of anonymized event when tracking sensitiveProperties', function () {
      const metaMetricsController = getMetaMetricsController();
      const spy = sinon.spy(segment, 'track');
      metaMetricsController.submitEvent({
        event: 'Fake Event',
        category: 'Unit Test',
        sensitiveProperties: { foo: 'bar' },
        actionId: '0x001',
        uniqueIdentifier: 'transaction-submitted-0000',
      });
      assert.ok(spy.calledTwice);
      assert.ok(
        spy.calledWith({
          event: 'Fake Event',
          anonymousId: METAMETRICS_ANONYMOUS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            foo: 'bar',
            ...DEFAULT_EVENT_PROPERTIES,
          },
          messageId: 'transaction-submitted-0000-0x001-0x000',
          timestamp: new Date(),
        }),
      );
      assert.ok(
        spy.calledWith({
          event: 'Fake Event',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            ...DEFAULT_EVENT_PROPERTIES,
          },
          messageId: 'transaction-submitted-0000-0x001',
          timestamp: new Date(),
        }),
      );
    });
  });

  describe('_buildUserTraitsObject', function () {
    it('should return full user traits object on first call', function () {
      const MOCK_ALL_TOKENS = {
        '0x1': {
          '0x1235ce91d74254f29d4609f25932fe6d97bf4842': [
            {
              address: '0xd2cea331e5f5d8ee9fb1055c297795937645de91',
            },
            {
              address: '0xabc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
            },
          ],
          '0xe364b0f9d1879e53e8183055c9d7dd2b7375d86b': [
            {
              address: '0xd2cea331e5f5d8ee9fb1055c297795937645de91',
            },
          ],
        },
        '0x4': {
          '0x1235ce91d74254f29d4609f25932fe6d97bf4842': [
            {
              address: '0xd2cea331e5f5d8ee9fb1055c297795937645de91',
            },
            {
              address: '0x12317F958D2ee523a2206206994597C13D831ec7',
            },
          ],
        },
      };

      const metaMetricsController = getMetaMetricsController();
      const traits = metaMetricsController._buildUserTraitsObject({
        addressBook: {
          [CHAIN_IDS.MAINNET]: [{ address: '0x' }],
          [CHAIN_IDS.GOERLI]: [{ address: '0x' }, { address: '0x0' }],
        },
        allNfts: {
          '0xac706cE8A9BF27Afecf080fB298d0ee13cfb978A': {
            56: [
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
            ],
          },
          '0xe04AB39684A24D8D4124b114F3bd6FBEB779cacA': {
            69: [
              {
                address: '0x63d646bc7380562376d5de205123a57b1718184d',
                tokenId: '14',
              },
            ],
          },
        },
        allTokens: MOCK_ALL_TOKENS,
        frequentRpcListDetail: [
          { chainId: CHAIN_IDS.MAINNET, ticker: CURRENCY_SYMBOLS.ETH },
          { chainId: CHAIN_IDS.GOERLI, ticker: CURRENCY_SYMBOLS.TEST_ETH },
          { chainId: '0xaf' },
        ],
        identities: [{}, {}],
        ledgerTransportType: 'web-hid',
        openSeaEnabled: true,
        useNftDetection: false,
        theme: 'default',
        useTokenDetection: true,
        security_provider: [],
      });

      assert.deepEqual(traits, {
        [TRAITS.ADDRESS_BOOK_ENTRIES]: 3,
        [TRAITS.INSTALL_DATE_EXT]: '',
        [TRAITS.LEDGER_CONNECTION_TYPE]: 'web-hid',
        [TRAITS.NETWORKS_ADDED]: [CHAIN_IDS.MAINNET, CHAIN_IDS.GOERLI, '0xaf'],
        [TRAITS.NETWORKS_WITHOUT_TICKER]: ['0xaf'],
        [TRAITS.NFT_AUTODETECTION_ENABLED]: false,
        [TRAITS.NUMBER_OF_ACCOUNTS]: 2,
        [TRAITS.NUMBER_OF_NFT_COLLECTIONS]: 3,
        [TRAITS.NUMBER_OF_NFTS]: 4,
        [TRAITS.NUMBER_OF_TOKENS]: 5,
        [TRAITS.OPENSEA_API_ENABLED]: true,
        [TRAITS.THREE_BOX_ENABLED]: false,
        [TRAITS.THEME]: 'default',
        [TRAITS.TOKEN_DETECTION_ENABLED]: true,
        [TRAITS.SECURITY_PROVIDER]: [],
      });
    });

    it('should return only changed traits object on subsequent calls', function () {
      const metaMetricsController = getMetaMetricsController();
      metaMetricsController._buildUserTraitsObject({
        addressBook: {
          [CHAIN_IDS.MAINNET]: [{ address: '0x' }],
          [CHAIN_IDS.GOERLI]: [{ address: '0x' }, { address: '0x0' }],
        },
        allTokens: {},
        frequentRpcListDetail: [
          { chainId: CHAIN_IDS.MAINNET },
          { chainId: CHAIN_IDS.GOERLI },
        ],
        ledgerTransportType: 'web-hid',
        openSeaEnabled: true,
        identities: [{}, {}],
        useNftDetection: false,
        theme: 'default',
        useTokenDetection: true,
      });

      const updatedTraits = metaMetricsController._buildUserTraitsObject({
        addressBook: {
          [CHAIN_IDS.MAINNET]: [{ address: '0x' }, { address: '0x1' }],
          [CHAIN_IDS.GOERLI]: [{ address: '0x' }, { address: '0x0' }],
        },
        allTokens: {
          '0x1': { '0xabcde': [{ '0x12345': { address: '0xtestAddress' } }] },
        },
        frequentRpcListDetail: [
          { chainId: CHAIN_IDS.MAINNET },
          { chainId: CHAIN_IDS.GOERLI },
        ],
        ledgerTransportType: 'web-hid',
        openSeaEnabled: false,
        identities: [{}, {}, {}],
        useNftDetection: false,
        theme: 'default',
        useTokenDetection: true,
      });

      assert.deepEqual(updatedTraits, {
        [TRAITS.ADDRESS_BOOK_ENTRIES]: 4,
        [TRAITS.NUMBER_OF_ACCOUNTS]: 3,
        [TRAITS.NUMBER_OF_TOKENS]: 1,
        [TRAITS.OPENSEA_API_ENABLED]: false,
      });
    });

    it('should return null if no traits changed', function () {
      const metaMetricsController = getMetaMetricsController();
      metaMetricsController._buildUserTraitsObject({
        addressBook: {
          [CHAIN_IDS.MAINNET]: [{ address: '0x' }],
          [CHAIN_IDS.GOERLI]: [{ address: '0x' }, { address: '0x0' }],
        },
        allTokens: {},
        frequentRpcListDetail: [
          { chainId: CHAIN_IDS.MAINNET },
          { chainId: CHAIN_IDS.GOERLI },
        ],
        ledgerTransportType: 'web-hid',
        openSeaEnabled: true,
        identities: [{}, {}],
        useNftDetection: true,
        theme: 'default',
        useTokenDetection: true,
      });

      const updatedTraits = metaMetricsController._buildUserTraitsObject({
        addressBook: {
          [CHAIN_IDS.MAINNET]: [{ address: '0x' }],
          [CHAIN_IDS.GOERLI]: [{ address: '0x' }, { address: '0x0' }],
        },
        allTokens: {},
        frequentRpcListDetail: [
          { chainId: CHAIN_IDS.MAINNET },
          { chainId: CHAIN_IDS.GOERLI },
        ],
        ledgerTransportType: 'web-hid',
        openSeaEnabled: true,
        identities: [{}, {}],
        useNftDetection: true,
        theme: 'default',
        useTokenDetection: true,
      });

      assert.equal(updatedTraits, null);
    });
  });

  describe('submitting segmentApiCalls to segment SDK', function () {
    it('should add event to store when submitting to SDK', function () {
      const metaMetricsController = getMetaMetricsController({});
      metaMetricsController.trackPage({}, { isOptIn: true });
      const { segmentApiCalls } = metaMetricsController.store.getState();
      assert(Object.keys(segmentApiCalls).length > 0);
    });

    it('should remove event from store when callback is invoked', function () {
      const segmentInstance = createSegmentMock(2, 10000);
      const stubFn = (_, cb) => {
        cb();
      };
      sinon.stub(segmentInstance, 'track').callsFake(stubFn);
      sinon.stub(segmentInstance, 'page').callsFake(stubFn);

      const metaMetricsController = getMetaMetricsController({
        segmentInstance,
      });
      metaMetricsController.trackPage({}, { isOptIn: true });
      const { segmentApiCalls } = metaMetricsController.store.getState();
      assert(Object.keys(segmentApiCalls).length === 0);
    });
  });

  afterEach(function () {
    // flush the queues manually after each test
    segment.flush();
    clock.restore();
    sinon.restore();
  });
});
