import Analytics from 'analytics-node'
import { merge, omit, pick } from 'lodash'

// flushAt controls how many events are sent to segment at once. Segment
// will hold onto a queue of events until it hits this number, then it sends
// them as a batch. This setting defaults to 20, but that is too high for
// notification workflows. We also cannot send each event as singular payloads
// because it seems to bombard segment and potentially cause event loss.
// I chose 5 here because it is sufficiently high enough to optimize our network
// requests, while also being low enough to be reasonable.
const flushAt = process.env.METAMASK_ENVIRONMENT === 'production' ? 5 : 1
// flushInterval controls how frequently the queue is flushed to segment.
// This happens regardless of the size of the queue. The default setting is
// 10,000ms (10 seconds). This default is absurdly high for our typical user
// flow through confirmations. I have chosen 10 ms here because it works really
// well with our wrapped track function. The track function returns a promise
// that is only fulfilled when it has been sent to segment. A 10 ms delay is
// negligible to the user, but allows us to properly batch events that happen
// in rapid succession.
const flushInterval = 10

export const METAMETRICS_ANONYMOUS_ID = '0x0000000000000000'

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
 * page and referrer from the MetaMetricsContext are very dynamic in nature and may be
 * provided as part of the initial context payload when creating the trackMetaMetricsEvent function,
 * or at the event level when calling the trackMetaMetricsEvent function.
 * @typedef {Pick<MetaMetricsContext, 'page' | 'referrer'>} MetaMetricsDynamicContext
 */

/**
 * @typedef {import('../../app/scripts/lib/enums').EnvironmentType} EnvironmentType
 */

/**
 * @typedef {Object} MetaMetricsRequiredState
 * @property {bool} participateInMetaMetrics - has the user opted into metametrics
 * @property {string} [metaMetricsId] - the user's metaMetricsId, if they have opted in
 * @property {MetaMetricsDynamicContext} context - context about the event
 * @property {string} chainId - the chain id of the current network
 * @property {string} locale - the locale string of the current user
 * @property {string} network - the name of the current network
 * @property {EnvironmentType} environmentType - environment that the event happened in
 * @property {string} [metaMetricsSendCount] - number of transactions sent, used to add metametricsId
 *  intermittently to events with onchain data attached to them used to protect identity of users.
 */

/**
 * @typedef {Object} MetaMetricsEventPayload
 * @property {string}  event - event name to track
 * @property {string}  category - category to associate event to
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
 * Returns a function for tracking Segment events.
 *
 * @param {string} metamaskVersion - The current version of the MetaMask extension.
 * @param {() => MetaMetricsRequiredState} getDynamicState - A function returning required fields
 * @returns {(payload: MetaMetricsEventPayload) => Promise<void>} - function to track an event
 */
export function getTrackMetaMetricsEvent(metamaskVersion, getDynamicState) {
  const version =
    process.env.METAMASK_ENVIRONMENT === 'production'
      ? metamaskVersion
      : `${metamaskVersion}-${process.env.METAMASK_ENVIRONMENT}`

  return function trackMetaMetricsEvent({
    event,
    category,
    isOptIn,
    properties = {},
    sensitiveProperties,
    revenue,
    currency,
    value,
    metaMetricsId: metaMetricsIdOverride,
    excludeMetaMetricsId: excludeId,
    matomoEvent = false,
    eventContext = {},
  }) {
    if (!event || !category) {
      throw new Error('Must specify event and category.')
    }
    // Uses recursion to track a duplicate event with sensitive properties included,
    // but metaMetricsId excluded
    if (sensitiveProperties) {
      if (excludeId === true) {
        throw new Error(
          'sensitiveProperties was specified in an event payload that also set the excludeMetaMetricsId flag',
        )
      }
      trackMetaMetricsEvent({
        event,
        category,
        isOptIn,
        properties: merge(sensitiveProperties, properties),
        revenue,
        currency,
        value,
        excludeMetaMetricsId: true,
        matomoEvent,
        eventContext,
      })
    }
    const {
      participateInMetaMetrics,
      context: providedContext,
      metaMetricsId,
      environmentType,
      chainId,
      locale,
      network,
      metaMetricsSendCount,
    } = getDynamicState()

    let excludeMetaMetricsId = excludeId ?? false

    // This is carried over from the old implementation, and will likely need
    // to be updated to work with the new tracking plan. I think we should use
    // a config setting for this instead of trying to match the event name
    const isSendFlow = Boolean(event.match(/^send|^confirm/u))
    if (
      isSendFlow &&
      metaMetricsSendCount &&
      !sendCountIsTrackable(metaMetricsSendCount + 1)
    ) {
      excludeMetaMetricsId = true
    }

    if (!participateInMetaMetrics && !isOptIn) {
      return Promise.resolve()
    }

    /** @type {MetaMetricsContext} */
    const context = {
      app: {
        name: 'MetaMask Extension',
        version,
      },
      userAgent: window.navigator.userAgent,
      ...pick(providedContext, ['page', 'referrer']),
      ...pick(eventContext, ['page', 'referrer']),
    }

    const trackOptions = {
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
        network,
        locale,
        chain_id: chainId,
        environment_type: environmentType,
      },
      context,
    }

    // If we are tracking sensitive data we will always use the anonymousId property
    // as well as our METAMETRICS_ANONYMOUS_ID. This prevents us from associating potentially
    // identifiable information with a specific id. During the opt in flow we will track all
    // events, but do so with the anonymous id. The one exception to that rule is after the
    // user opts in to MetaMetrics. When that happens we receive back the user's new MetaMetrics
    // id before it is fully persisted to state. To avoid a race condition we explicitly pass the
    // new id to the track method. In that case we will track the opt in event to the user's id.
    // In all other cases we use the metaMetricsId from state.
    if (excludeMetaMetricsId) {
      trackOptions.anonymousId = METAMETRICS_ANONYMOUS_ID
    } else if (isOptIn && metaMetricsIdOverride) {
      trackOptions.userId = metaMetricsIdOverride
    } else if (isOptIn) {
      trackOptions.anonymousId = METAMETRICS_ANONYMOUS_ID
    } else {
      trackOptions.userId = metaMetricsId
    }

    return new Promise((resolve, reject) => {
      // This is only safe to do because we have set an extremely low (10ms) flushInterval.
      const callback = (err) => {
        if (err) {
          return reject(err)
        }
        return resolve()
      }

      if (matomoEvent === true) {
        segmentLegacy.track(trackOptions, callback)
      } else {
        segment.track(trackOptions, callback)
      }
    })
  }
}
