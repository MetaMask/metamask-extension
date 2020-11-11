import { strict as assert } from 'assert'
import sinon from 'sinon'
import MetaMetricsController from '../../../../app/scripts/controllers/metametrics'
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

const DEFAULT_PROPERTIES = {
  chain_id: '0x1',
  currency: undefined,
  locale: LOCALE.replace('_', '-'),
  network: NETWORK,
  revenue: undefined,
  value: undefined,
  category: 'Unit Test',
  environment_type: 'background',
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
            ...DEFAULT_PROPERTIES,
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
      mock.verify()
      mock.restore()
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
            ...DEFAULT_PROPERTIES,
          },
        })
      metaMetricsController.trackEvent({
        event: 'Fake Event',
        category: 'Unit Test',
        properties: {
          test: 1,
        },
      })
      mock.verify()
      mock.restore()
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
            ...DEFAULT_PROPERTIES,
          },
        }),
      )
      assert.ok(
        spy.calledWith({
          event: 'Fake Event',
          userId: TEST_META_METRICS_ID,
          context: DEFAULT_TEST_CONTEXT,
          properties: DEFAULT_PROPERTIES,
        }),
      )
      spy.restore()
    })
  })
})
