import { strict as assert } from 'assert';
import sinon from 'sinon';
import { ENVIRONMENT_TYPE_BACKGROUND } from '../../../shared/constants/app';
import { createSegmentMock } from '../lib/segment';
import {
  METAMETRICS_ANONYMOUS_ID,
  METAMETRICS_BACKGROUND_PAGE_OBJECT,
} from '../../../shared/constants/metametrics';
import waitUntilCalled from '../../../test/lib/wait-until-called';
import MetaMetricsController from './metametrics';
import { NETWORK_EVENTS } from './network';

const segment = createSegmentMock(2, 10000);

const VERSION = '0.0.1-test';
const NETWORK = 'Mainnet';
const FAKE_CHAIN_ID = '0x1338';
const LOCALE = 'en_US';
const TEST_META_METRICS_ID = '0xabc';

const DEFAULT_TEST_CONTEXT = {
  app: { name: 'MetaMask Extension', version: VERSION },
  page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
  referrer: undefined,
  userAgent: window.navigator.userAgent,
};

const DEFAULT_SHARED_PROPERTIES = {
  chain_id: FAKE_CHAIN_ID,
  locale: LOCALE.replace('_', '-'),
  network: NETWORK,
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
  provider = { type: NETWORK },
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

function getMetaMetricsController({
  participateInMetaMetrics = true,
  metaMetricsId = TEST_META_METRICS_ID,
  preferencesStore = getMockPreferencesStore(),
  networkController = getMockNetworkController(),
} = {}) {
  return new MetaMetricsController({
    segment,
    getNetworkIdentifier: networkController.getNetworkIdentifier.bind(
      networkController,
    ),
    getCurrentChainId: networkController.getCurrentChainId.bind(
      networkController,
    ),
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
    },
  });
}
describe('MetaMetricsController', function () {
  describe('constructor', function () {
    it('should properly initialize', function () {
      const metaMetricsController = getMetaMetricsController();
      assert.strictEqual(metaMetricsController.version, VERSION);
      assert.strictEqual(metaMetricsController.network, NETWORK);
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
    });

    it('should update when network changes', function () {
      const networkController = getMockNetworkController();
      const metaMetricsController = getMetaMetricsController({
        networkController,
      });
      assert.strictEqual(metaMetricsController.network, NETWORK);
      networkController.store.updateState({
        provider: {
          type: 'NEW_NETWORK',
        },
        chainId: '0xaab',
      });
      assert.strictEqual(metaMetricsController.network, 'NEW_NETWORK');
      assert.strictEqual(metaMetricsController.chainId, '0xaab');
    });

    it('should update when preferences changes', function () {
      const preferencesStore = getMockPreferencesStore();
      const metaMetricsController = getMetaMetricsController({
        preferencesStore,
      });
      assert.strictEqual(metaMetricsController.network, NETWORK);
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

  describe('trackEvent', function () {
    it('should not track an event if user is not participating in metametrics', function () {
      const mock = sinon.mock(segment);
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: false,
      });
      mock.expects('track').never();
      metaMetricsController.trackEvent({
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
        participateInMetaMetrics: false,
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
        });
      metaMetricsController.trackEvent(
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
        participateInMetaMetrics: false,
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
        });
      metaMetricsController.trackEvent(
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
        });
      metaMetricsController.trackEvent(
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
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            test: 1,
            ...DEFAULT_EVENT_PROPERTIES,
          },
        });
      metaMetricsController.trackEvent({
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
      metaMetricsController.trackEvent(
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
        () => metaMetricsController.trackEvent({ event: 'test' }),
        /Must specify event and category\./u,
        'must specify category',
      );

      assert.rejects(
        () => metaMetricsController.trackEvent({ category: 'test' }),
        /Must specify event and category\./u,
        'must specify event',
      );
    });

    it('should throw if provided sensitiveProperties, when excludeMetaMetricsId is true', function () {
      const metaMetricsController = getMetaMetricsController();
      assert.rejects(
        () =>
          metaMetricsController.trackEvent(
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
      metaMetricsController.trackEvent({
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
        }),
      );
      assert.ok(
        spy.calledWith({
          event: 'Fake Event',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: DEFAULT_EVENT_PROPERTIES,
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
  });

  afterEach(function () {
    // flush the queues manually after each test
    segment.flush();
    sinon.restore();
  });
});
