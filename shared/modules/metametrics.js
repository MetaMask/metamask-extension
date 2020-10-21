import Analytics from 'analytics-node'
import { omit, pick } from 'lodash'

// flushAt controls how many events are collected in the queue before they
// are sent to segment. I recommend a queue size of one due to an issue with
// detecting and flushing events in an extension beforeunload doesn't work in
// a notification context. Because notification windows are opened and closed
// in reaction to the very events we want to track, it is problematic to cache
// at all.
const flushAt = 1

export const METAMETRICS_ANONYMOUS_ID = '0x0000000000000000'

const segmentNoop = {
  track () {
    // noop
  },
  page () {
    // noop
  },
  identify () {
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

export function sendCountIsTrackable (sendCount) {
  return Boolean(trackableSendCounts[sendCount])
}

// We do not want to track events on development builds unless specifically
// provided a SEGMENT_WRITE_KEY. This also holds true for test environments and
// E2E, which is handled in the build process by never providing the SEGMENT_WRITE_KEY
// when process.env.IN_TEST is truthy
export const segment = process.env.SEGMENT_WRITE_KEY
  ? new Analytics(process.env.SEGMENT_WRITE_KEY, { flushAt })
  : segmentNoop

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
 * @property {string} locale    - the locale string for the user
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
 * @property {number}  [revenue] - amount of currency that event creates in revenue for MetaMask
 * @property {string}  [currency] - ISO 4127 format currency for events with revenue, defaults to US dollars
 * @property {number}  [value] - Abstract "value" that this event has for MetaMask.
 * @property {boolean} [excludeMetaMetricsId] - whether to exclude the user's metametrics id for anonymity
 * @property {MetaMetricsDynamicContext} [eventContext] - additional context to attach to event
 */

/**
 * Returns a function for tracking Segment events.
 *
 * @param {string} metamaskVersion - The current version of the MetaMask extension.
 * @param {() => MetaMetricsRequiredState} getDynamicState - A function returning required fields
 * @returns {(payload: MetaMetricsEventPayload) => Promise<void>} - function to track an event
 */
export function getTrackMetaMetricsEvent (
  metamaskVersion,
  getDynamicState,
) {
  const version = process.env.METAMASK_ENVIRONMENT === 'production'
    ? metamaskVersion
    : `${metamaskVersion}-${process.env.METAMASK_ENVIRONMENT}`

  return function trackMetaMetricsEvent ({
    event,
    category,
    isOptIn,
    properties = {},
    revenue,
    currency,
    value,
    excludeMetaMetricsId: excludeId,
    eventContext = {},
  }) {
    if (!event || !category) {
      throw new Error('Must specify event and category.')
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
    if (isSendFlow && metaMetricsSendCount && !sendCountIsTrackable(metaMetricsSendCount + 1)) {
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
      locale,
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
        // level properties on the event payload.
        ...omit(properties, ['revenue', 'currency', 'value']),
        revenue,
        value,
        currency,
        category,
        network,
        chain_id: chainId,
        environment_type: environmentType,
      },
      context,
    }

    if (excludeMetaMetricsId) {
      trackOptions.anonymousId = METAMETRICS_ANONYMOUS_ID
    } else {
      trackOptions.userId = metaMetricsId
    }

    return new Promise((resolve, reject) => {
      // This is only safe to do because we are no longer batching events through segment.
      // If flushAt is greater than one the callback won't be triggered until after a number
      // of events have been queued equal to the flushAt value OR flushInterval passes. The
      // default flushInterval is ten seconds
      segment.track(trackOptions, (err) => {
        if (err) {
          return reject(err)
        }
        return resolve()
      })
    })
  }
}
