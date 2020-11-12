import { strict as assert } from 'assert'
import sinon from 'sinon'
import MetaMetricsController from '../../../../app/scripts/controllers/metametrics'
import { ENVIRONMENT_TYPE_BACKGROUND } from '../../../../app/scripts/lib/enums'
import {
  createSegmentMock,
  METAMETRICS_ANONYMOUS_ID,
  METAMETRICS_BACKGROUND_PAGE_OBJECT,
} from '../../../../shared/constants/metametrics'

const segment = createSegmentMock(2, 10000)
const segmentLegacy = createSegmentMock(2, 10000)

const VERSION = '0.0.1-test'
const NETWORK = 'Mainnet'
const LOCALE = 'en_US'
const TEST_META_METRICS_ID = '0xabc'

const DEFAULT_TEST_CONTEXT = {
  app: { name: 'MetaMask Extension', version: VERSION },
  page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
  referrer: undefined,
  userAgent: window.navigator.userAgent,
}

const DEFAULT_SHARED_PROPERTIES = {
  chain_id: '0x1',
  locale: LOCALE.replace('_', '-'),
  network: NETWORK,
  environment_type: 'background',
}

const DEFAULT_EVENT_PROPERTIES = {
  category: 'Unit Test',
  revenue: undefined,
  value: undefined,
  currency: undefined,
  ...DEFAULT_SHARED_PROPERTIES,
}

const DEFAULT_PAGE_PROPERTIES = {
  ...DEFAULT_SHARED_PROPERTIES,
}

function getMetaMetricsController({
  chainId = '0x1',
  providerConfig = { type: NETWORK },
  participateInMetaMetrics = true,
  metaMetricsId = TEST_META_METRICS_ID,
} = {}) {
  return new MetaMetricsController({
    isDevOrTestEnvironment: true,
    segmentMock: segment,
    segmentLegacyMock: segmentLegacy,
    getCurrentChainId: () => chainId,
    getProviderConfig: () => providerConfig,
    flushAt: 2,
    flushInterval: 1000,
    preferencesStore: {
      getState() {
        return {
          participateInMetaMetrics,
          metaMetricsId,
          currentLocale: 'en_US',
        }
      },
    },
    version: '0.0.1',
    environment: 'test',
  })
}
describe('MetaMetricsController', function () {
  describe('constructor', function () {
    it('should properly initialize', function () {
      const metaMetricsController = getMetaMetricsController()
      assert.strictEqual(metaMetricsController.version, '0.0.1-test')
      assert.strictEqual(metaMetricsController.network, 'Mainnet')
      assert.strictEqual(metaMetricsController.chainId, '0x1')
      assert.strictEqual(metaMetricsController.participateInMetaMetrics, true)
      assert.strictEqual(metaMetricsController.metaMetricsId, '0xabc')
      assert.strictEqual(metaMetricsController.locale, 'en-US')
    })
  })

  describe('trackEvent', function () {
    it('should not track an event if user is not participating in metametrics', function () {
      const mock = sinon.mock(segment)
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: false,
      })
      mock.expects('track').never()
      metaMetricsController.trackEvent({
        event: 'Fake Event',
        category: 'Unit Test',
        properties: {
          test: 1,
        },
      })
      mock.restore()
      mock.verify()
    })

    it('should track an event if user has not opted in, but isOptIn is true', function () {
      const mock = sinon.mock(segment)
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: false,
      })
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
        })
      metaMetricsController.trackEvent(
        {
          event: 'Fake Event',
          category: 'Unit Test',
          properties: {
            test: 1,
          },
        },
        { isOptIn: true },
      )
      mock.restore()
      mock.verify()
    })

    it('should track an event during optin and allow for metaMetricsId override', function () {
      const mock = sinon.mock(segment)
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: false,
      })
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
        })
      metaMetricsController.trackEvent(
        {
          event: 'Fake Event',
          category: 'Unit Test',
          properties: {
            test: 1,
          },
        },
        { isOptIn: true, metaMetricsId: 'TESTID' },
      )
      mock.restore()
      mock.verify()
    })

    it('should track a legacy event', function () {
      const mock = sinon.mock(segmentLegacy)
      const metaMetricsController = getMetaMetricsController()
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
        })
      metaMetricsController.trackEvent(
        {
          event: 'Fake Event',
          category: 'Unit Test',
          properties: {
            test: 1,
          },
        },
        { matomoEvent: true },
      )
      mock.restore()
      mock.verify()
    })

    it('should track a non legacy event', function () {
      const mock = sinon.mock(segment)
      const metaMetricsController = getMetaMetricsController()
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
        })
      metaMetricsController.trackEvent({
        event: 'Fake Event',
        category: 'Unit Test',
        properties: {
          test: 1,
        },
      })
      mock.restore()
      mock.verify()
    })

    it('should use anonymousId when metametrics send count is not trackable in send flow', function () {
      const mock = sinon.mock(segment)
      const metaMetricsController = getMetaMetricsController()
      mock
        .expects('track')
        .once()
        .withArgs({
          event: 'Send Fake Event',
          anonymousId: METAMETRICS_ANONYMOUS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            test: 1,
            ...DEFAULT_EVENT_PROPERTIES,
          },
        })
      metaMetricsController.trackEvent(
        {
          event: 'Send Fake Event',
          category: 'Unit Test',
          properties: {
            test: 1,
          },
        },
        { metaMetricsSendCount: 1 },
      )
      mock.restore()
      mock.verify()
    })

    it('should use user metametrics id when metametrics send count is trackable in send flow', function () {
      const mock = sinon.mock(segment)
      const metaMetricsController = getMetaMetricsController()
      mock
        .expects('track')
        .once()
        .withArgs({
          event: 'Send Fake Event',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: {
            test: 1,
            ...DEFAULT_EVENT_PROPERTIES,
          },
        })
      metaMetricsController.trackEvent(
        {
          event: 'Send Fake Event',
          category: 'Unit Test',
          properties: {
            test: 1,
          },
        },
        { metaMetricsSendCount: 0 },
      )
      mock.restore()
      mock.verify()
    })

    it('should immediately flush queue if flushImmediately set to true', async function () {
      const metaMetricsController = getMetaMetricsController()
      const value = await metaMetricsController.trackEvent(
        {
          event: 'Fake Event',
          category: 'Unit Test',
        },
        { flushImmediately: true },
      )
      assert.strictEqual(value, undefined)
    })

    it('should throw if event or category not provided', function () {
      const metaMetricsController = getMetaMetricsController()
      assert.rejects(
        () => metaMetricsController.trackEvent({ event: 'test' }),
        /Must specify event and category\./u,
        'must specify category',
      )

      assert.rejects(
        () => metaMetricsController.trackEvent({ category: 'test' }),
        /Must specify event and category\./u,
        'must specify event',
      )
    })

    it('should throw if provided sensitiveProperties, when excludeMetaMetricsId is true', function () {
      const metaMetricsController = getMetaMetricsController()
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
      )
    })

    it('should track sensitiveProperties in a separate, anonymous event', function () {
      const metaMetricsController = getMetaMetricsController()
      const spy = sinon.spy(segment, 'track')
      metaMetricsController.trackEvent({
        event: 'Fake Event',
        category: 'Unit Test',
        sensitiveProperties: { foo: 'bar' },
      })
      assert.ok(spy.calledTwice)
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
      )
      assert.ok(
        spy.calledWith({
          event: 'Fake Event',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: DEFAULT_EVENT_PROPERTIES,
        }),
      )
      spy.restore()
    })
  })

  describe('trackPage', function () {
    it('should track a page view', function () {
      const mock = sinon.mock(segment)
      const metaMetricsController = getMetaMetricsController()
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
        })
      metaMetricsController.trackPage({
        name: 'home',
        params: null,
        environmentType: ENVIRONMENT_TYPE_BACKGROUND,
        page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
      })
      mock.restore()
      mock.verify()
    })

    it('should not track a page view if user is not participating in metametrics', function () {
      const mock = sinon.mock(segment)
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: false,
      })
      mock.expects('page').never()
      metaMetricsController.trackPage({
        name: 'home',
        params: null,
        environmentType: ENVIRONMENT_TYPE_BACKGROUND,
        page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
      })
      mock.restore()
      mock.verify()
    })

    it('should track a page view if isOptIn is true and user not yet opted in', function () {
      const mock = sinon.mock(segment)
      const metaMetricsController = getMetaMetricsController({
        participateInMetaMetrics: null,
      })
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
        })
      metaMetricsController.trackPage(
        {
          name: 'home',
          params: null,
          environmentType: ENVIRONMENT_TYPE_BACKGROUND,
          page: METAMETRICS_BACKGROUND_PAGE_OBJECT,
        },
        { isOptInPath: true },
      )
      mock.restore()
      mock.verify()
    })
  })

  afterEach(function () {
    // flush the queues manually after each test
    segment.flush()
    segmentLegacy.flush()
  })

  after(function () {
    sinon.restore()
  })
})
