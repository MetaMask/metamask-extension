import { merge, omit } from 'lodash'
import Analytics from 'analytics-node'
import { ENVIRONMENT_TYPE_BACKGROUND } from '../lib/enums'

const METAMETRICS_ANONYMOUS_ID = '0x0000000000000000'
const BACKGROUND_PROCESS_PAGE = {
  path: '/background-process',
  title: 'Background Process',
  url: '/background-process',
}

// flushAt controls how many events are sent to segment at once. Segment
// will hold onto a queue of events until it hits this number, then it sends
// them as a batch. This setting defaults to 20, but in development we likely
// want to see events in real time for debugging, so this is set to 1 to disable
// the queueing mechanism.
const flushAt =
  process.env.METAMASK_ENVIRONMENT === 'production' ? undefined : 1
// flushInterval controls how frequently the queue is flushed to segment.
// This happens regardless of the size of the queue. The default setting is
// 10,000ms (10 seconds). This default is rather high, though thankfully
// using the background process as our event handler means we don't have to
// deal with short lived sessions that happen faster than the interval
// e.g confirmations. This is set to 5,000ms (5 seconds) arbitrarily with the
// intent of having a value less than 10 seconds.
const flushInterval = 5000

const segmentNoop = {
  track(_, callback = () => undefined) {
    // Need to call the callback so that environments without a segment id still
    // resolve the promise from trackMetaMetricsEvent
    return callback()
  },
  page() {
    // noop
  },
  identify() {
    // noop
  },
}

/**
 * Used to determine whether or not to attach a user's metametrics id
 * to events that include on-chain data. This helps to prevent identifying
 * a user by being able to trace their activity on etherscan/block exploring
 */
const trackableSendCounts = {
  1: true,
  10: true,
  30: true,
  50: true,
  100: true,
  250: true,
  500: true,
  1000: true,
  2500: true,
  5000: true,
  10000: true,
  25000: true,
}

export function sendCountIsTrackable(sendCount) {
  return Boolean(trackableSendCounts[sendCount])
}

const isDevOrTestEnvironment = Boolean(
  process.env.METAMASK_DEBUG || process.env.IN_TEST,
)

// This allows us to overwrite the metric destination for testing purposes
const host = process.env.SEGMENT_HOST ?? undefined

// We do not want to track events on development builds unless specifically
// provided a SEGMENT_WRITE_KEY. This also holds true for test environments and
// E2E, which is handled in the build process by never providing the SEGMENT_WRITE_KEY
// when process.env.IN_TEST is truthy
export const segment =
  !process.env.SEGMENT_WRITE_KEY || (isDevOrTestEnvironment && !host)
    ? segmentNoop
    : new Analytics(process.env.SEGMENT_WRITE_KEY, {
        host,
        flushAt,
        flushInterval,
      })

export const segmentLegacy =
  !process.env.SEGMENT_LEGACY_WRITE_KEY || (isDevOrTestEnvironment && !host)
    ? segmentNoop
    : new Analytics(process.env.SEGMENT_LEGACY_WRITE_KEY, {
        host,
        flushAt,
        flushInterval,
      })

/**
 * We attach context to every meta metrics event that help to qualify our analytics.
 * This type has all optional values because it represents a returned object from a
 * method call. Ideally app and userAgent are defined on every event. This is confirmed
 * in the getTrackMetaMetricsEvent function, but still provides the consumer a way to
 * override these values if necessary.
 * @typedef {Object} MetaMetricsContext
 * @property {Object} app
 * @property {string} app.name - the name of the application tracking the event
 * @property {string} app.version - the version of the application
 * @property {string} userAgent - the useragent string of the user
 * @property {Object} [page]     - an object representing details of the current page
 * @property {string} [page.path] - the path of the current page (e.g /home)
 * @property {string} [page.title] - the title of the current page (e.g 'home')
 * @property {string} [page.url]  - the fully qualified url of the current page
 * @property {Object} [referrer] - for metamask, this is the dapp that triggered an interaction
 * @property {string} [referrer.url] - the origin of the dapp issuing the notification
 */

/**
 * @typedef {Object} MetaMetricsEventPayload
 * @property {string}  event - event name to track
 * @property {string}  category - category to associate event to
 * @property {string} [environmentType] - The type of environment this event occurred in. Defaults to
 *  the background process type
 * @property {boolean} [isOptIn] - happened during opt in/out workflow
 * @property {object}  [properties] - object of custom values to track, snake_case
 * @property {object}  [sensitiveProperties] - Object of sensitive values to track, snake_case.
 *  These properties will be sent in an additional event that excludes the user's metaMetricsId.
 * @property {number}  [revenue] - amount of currency that event creates in revenue for MetaMask
 * @property {string}  [currency] - ISO 4127 format currency for events with revenue, defaults to US dollars
 * @property {number}  [value] - Abstract "value" that this event has for MetaMask.
 * @property {boolean} [excludeMetaMetricsId] - whether to exclude the user's metametrics id for anonymity
 * @property {string}  [metaMetricsId] - an override for the metaMetricsId in the event one is created as part
 *  of an asynchronous workflow, such as awaiting the result of the metametrics opt-in function that generates the
 *  user's metametrics id.
 * @property {boolean} [matomoEvent] - is this event a holdover from matomo that needs further migration?
 *  when true, sends the data to a special segment source that marks the event data as not conforming to our
 *  ideal schema
 * @property {MetaMetricsDynamicContext} [eventContext] - additional context to attach to event
 */

/**
 * @typedef {Object} MetaMetricsEventOptions
 * @property {boolean} [isOptIn] - happened during opt in/out workflow
 * @property {boolean} [flushImmediately] - When true will automatically flush the segment queue after tracking
 *  the event. Recommended if the result of tracking the event must be known before UI transition or update.
 * @property {boolean} [excludeMetaMetricsId] - whether to exclude the user's metametrics id for anonymity
 * @property {string}  [metaMetricsId] - an override for the metaMetricsId in the event one is created as part
 *  of an asynchronous workflow, such as awaiting the result of the metametrics opt-in function that generates the
 *  user's metametrics id.
 * @property {boolean} [matomoEvent] - is this event a holdover from matomo that needs further migration?
 *  when true, sends the data to a special segment source that marks the event data as not conforming to our
 *  ideal schema
 * @property {number} metaMetricsSendCount - the count of the number of sends that have triggered a metrics event
 *  used to determine if we should allow the user's id to be included in the payload periodically.
 */

/**
 * @typedef {Object} SegmentEventPayload
 * @property {string} event - name of the event to track
 * @property {Object} properties - properties to attach to the event
 * @property {MetaMetricsContext} context - the context the event occurred in
 */

export default class MetaMetricsController {
  constructor({
    preferencesStore,
    getCurrentChainId,
    getProviderConfig,
    version,
  }) {
    this._previousTrackedPage = undefined
    console.log(preferencesStore.getState, preferencesStore.getState())
    this._getPreferencesState = preferencesStore.getState.bind(preferencesStore)
    this._getCurrentChainId = getCurrentChainId
    this._getProviderConfig = getProviderConfig
    this._version =
      process.env.METAMASK_ENVIRONMENT === 'production'
        ? version
        : `${version}-${process.env.METAMASK_ENVIRONMENT}`
  }

  /**
   * @private
   * @param {Pick<MetaMetricsContext, 'referrer'>} [referrer] - dapp origin that initialized
   *  the notification window.
   * @param {Pick<MetaMetricsContext, 'page'>} [page] - page object describing the current
   *  view of the extension. Defaults to the background-process object.
   * @returns {MetaMetricsContext}
   */
  _buildContext(referrer, page = BACKGROUND_PROCESS_PAGE) {
    return {
      app: {
        name: 'MetaMask Extension',
        version: this.version,
      },
      userAgent: window.navigator.userAgent,
      page,
      referrer,
    }
  }

  /**
   * @private
   * @param {MetaMetricsEventPayload} rawPayload - raw payload provided to trackEvent
   * @param {MetaMetricsEventOptions} options - options for handling/routing event
   * @returns {SegmentEventPayload} - formatted event payload for segment
   */
  _buildEventPayload(rawPayload) {
    const {
      event,
      properties,
      revenue,
      value,
      currency,
      category,
      page,
      referrer,
      environmentType = ENVIRONMENT_TYPE_BACKGROUND,
    } = rawPayload
    return {
      event,
      properties: {
        // These values are omitted from properties because they have special meaning
        // in segment. https://segment.com/docs/connections/spec/track/#properties.
        // to avoid accidentally using these inappropriately, you must add them as top
        // level properties on the event payload. We also exclude locale to prevent consumers
        // from overwriting this context level property. We track it as a property
        // because not all destinations map locale from context.
        ...omit(properties, ['revenue', 'locale', 'currency', 'value']),
        revenue,
        value,
        currency,
        category,
        network: this.network,
        locale: this.locale,
        chain_id: this.chainId,
        environment_type: environmentType,
      },
      context: this._buildContext(referrer, page),
    }
  }

  /**
   * @private
   * @param {Object} payload
   * @param {string} payload.event - name of the event to track
   * @param {SegmentEventPayload} payload - properties to attach to event
   * @returns {Promise<void>}
   */
  _track(payload, options) {
    console.log('payload', payload)
    const {
      isOptIn,
      metaMetricsIdOverride,
      matomoEvent,
      flushImmediately,
      metaMetricsSendCount,
    } = options
    let idType = 'userId'
    let idValue = this.metaMetricsId
    let excludeMetaMetricsId = options.excludeMetaMetricsId ?? false
    // This is carried over from the old implementation, and will likely need
    // to be updated to work with the new tracking plan. I think we should use
    // a config setting for this instead of trying to match the event name
    const isSendFlow = Boolean(payload.event.match(/^send|^confirm/u))
    if (
      isSendFlow &&
      metaMetricsSendCount &&
      !sendCountIsTrackable(metaMetricsSendCount + 1)
    ) {
      excludeMetaMetricsId = true
    }
    // If we are tracking sensitive data we will always use the anonymousId property
    // as well as our METAMETRICS_ANONYMOUS_ID. This prevents us from associating potentially
    // identifiable information with a specific id. During the opt in flow we will track all
    // events, but do so with the anonymous id. The one exception to that rule is after the
    // user opts in to MetaMetrics. When that happens we receive back the user's new MetaMetrics
    // id before it is fully persisted to state. To avoid a race condition we explicitly pass the
    // new id to the track method. In that case we will track the opt in event to the user's id.
    // In all other cases we use the metaMetricsId from state.
    if (excludeMetaMetricsId || (isOptIn && !metaMetricsIdOverride)) {
      idType = 'anonymousId'
      idValue = METAMETRICS_ANONYMOUS_ID
    } else if (isOptIn && metaMetricsIdOverride) {
      idValue = metaMetricsIdOverride
    }
    payload[idType] = idValue

    // Promises will only resolve when the event is sent to segment. For any
    // event that relies on this promise being fulfilled before performing UI
    // updates, or otherwise delaying user interaction, supply the 'flushImmediately'
    // flag to the trackEvent method.
    return new Promise((resolve, reject) => {
      const callback = (err) => {
        if (err) {
          return reject(err)
        }
        return resolve()
      }

      const target = matomoEvent === true ? segmentLegacy : segment

      target.track(payload, callback)
      if (flushImmediately) {
        target.flush()
      }
    })
  }

  trackPage(name, params, environmentType, page, referrer) {
    const idTrait = this.participateInMetaMetrics ? 'userId' : 'anonymousId'
    const idValue = this.participateInMetaMetrics
      ? this.metaMetricsId
      : METAMETRICS_ANONYMOUS_ID
    console.log(idTrait, idValue)
    segment.page(
      {
        [idTrait]: idValue,
        name,
        properties: {
          // We do not want to send addresses or accounts in any events
          // Some routes include these as params.
          params,
          locale: this.locale,
          network: this.network,
          chain_id: this.chainId,
          environment_type: environmentType,
        },
        context: this._buildContext(referrer, page),
      },
      (err, data) => {
        console.log(err, data)
      },
    )
  }

  /**
   *
   * @param {MetaMetricsEventPayload} payload - details of the event
   * @param {MetaMetricsEventOptions} options - options for handling/routing the event
   * @returns {Promise<void>}
   */
  trackEvent(payload, options) {
    // event and category are required fields for all payloads
    if (!payload.event || !payload.category) {
      throw new Error('Must specify event and category.')
    }

    if (!this.participateInMetaMetrics && !options.isOptIn) {
      return Promise.resolve()
    }

    // We might track multiple events if sensitiveProperties is included, this array will hold
    // the promises returned from this._track.
    const events = []

    if (payload.sensitiveProperties) {
      // sensitiveProperties will only be tracked using the anonymousId property and generic id
      // If the event options already specify to exclude the metaMetricsId we throw an error as
      // a signal to the developer that the event was implemented incorrectly
      if (options.excludeMetaMetricsId === true) {
        throw new Error(
          'sensitiveProperties was specified in an event payload that also set the excludeMetaMetricsId flag',
        )
      }

      const combinedProperties = merge(
        payload.sensitiveProperties,
        payload.properties,
      )

      events.push(
        this._track(
          this._buildEventPayload({
            ...payload,
            properties: combinedProperties,
          }),
          { ...options, excludeMetaMetricsId: true },
        ),
      )
    }

    events.push(this._track(this._buildEventPayload(payload), options))

    return Promise.all(events)
  }

  get version() {
    return this._version
  }

  get network() {
    const provider = this._getProviderConfig()
    return provider.type === 'rpc' ? provider.rpcUrl : provider.type
  }

  get chainId() {
    return this._getCurrentChainId()
  }

  get locale() {
    const { currentLocale } = this._getPreferencesState()
    return currentLocale.replace('_', '-')
  }

  get metaMetricsId() {
    return this._getPreferencesState()?.metaMetricsId
  }

  get participateInMetaMetrics() {
    return this._getPreferencesState()?.participateInMetaMetrics
  }
}
