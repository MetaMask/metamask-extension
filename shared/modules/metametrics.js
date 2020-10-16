import Analytics from 'analytics-node'
import { merge, omit } from 'lodash'
import { loadLocalStorageData, saveLocalStorageData } from '../../ui/lib/local-storage-helpers'

const inDevelopment = process.env.METAMASK_DEBUG || process.env.IN_TEST

const flushAt = inDevelopment ? 1 : undefined

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
 * to events that include on chain id. This helps to prevent identifying
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
// which process.env.IN_TEST is true
export const segment = process.env.SEGMENT_WRITE_KEY
  ? new Analytics(process.env.SEGMENT_WRITE_KEY, { flushAt })
  : segmentNoop

/**
 * We attach context to every meta metrics event that help to qualify our analytics.
 * This type has all optional values because it represents a returned object from a
 * method call. Ideally app and userAgent are defined on every event. This is confirmed
 * in the getTrackSegmentEvent function, but still provides the consumer a way to
 * override these values if necessary.
 * @typedef {Object} MetaMetricsEventContext
 * @property {Object} [app]
 * @property {string} [app.name] - the name of the application tracking the event
 * @property {string} [app.version] - the version of the application
 * @property {string} [userAgent] - the useragent string of the user
 * @property {string} [locale]    - the locale string for the user
 * @property {Object} [page]      - an object representing details of the current page
 * @property {string} [page.path] - the path of the current page (e.g /home)
 * @property {string} [page.title] - the title of the current page (e.g 'home')
 * @property {string} [page.url]  - the fully qualified url of the current page
 * @property {Object} [referrer] - for metamask, this is the dapp that triggered an interaction
 * @property {string} [referrer.url] - the origin of the dapp issuing the notification
 */

/**
 * @typedef {Object} MetaMetricsRequiredState
 * @property {bool} participateInMetaMetrics - has the user opted into metametrics
 * @property {string} [metaMetricsId] - the user's metaMetricsId, if they have opted in
 * @property {MetaMetricsEventContext} context - context about the event
 * @property {string} chainId - the chain id of the current network
 * @property {string} network - the name of the current network
 * @property {string} [metaMetricsSendCount] - number of transactions sent, used to add metametricsId
 *                                        - intermittently to events with onchain data attached to them
 *                                        - used to protect identity of users.
 */

/**
 * @typedef {Object} MetaMetricsBreadCrumbSettings
 * @property {string} id - a unique identifier for the breadcrumb trail
 * @property {boolean} isComplete - if true, pulls breadcrumbs and combines into final payload
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
 * @property {MetaMetricsBreadCrumbSettings}  [breadcrumb] - used to track multiple payloads to the same event
 * @property {MetaMetricsEventContext} [additionalContext] - additional context to attach to event
 */

/**
 * Simple alias type for shortening future type signatures and preventing requirement to update
 * in multiple places in the future.
 * @typedef {(payload: MetaMetricsEventPayload) => Promise<never>} TrackMetaMetricsEventFn
 */

const breadcrumbs = new Map(loadLocalStorageData('METAMETRICS_BREADCRUMBS') ?? [])

window.addEventListener('beforeunload', () => {
  saveLocalStorageData([...breadcrumbs.entries()], 'METAMETRICS_BREADCRUMBS')
})

/**
 * Returns a function for tracking Segment events.
 *
 * @param {string} metamaskVersion - The current version of the MetaMask extension.
 * @param {() => MetaMetricsRequiredState} getDynamicState - A function returning required fields
 * @param {boolean} defaultMetaMetricsExclusion - Used to set the default state of exludeMetaMetricsId
 * @returns {TrackMetaMetricsEventFn} - function to track an event
 */
export function getTrackMetaMetricsEvent (
  metamaskVersion,
  getDynamicState,
  defaultMetaMetricsExclusion = false,
) {
  const version = process.env.METAMASK_ENVIRONMENT === 'production'
    ? metamaskVersion
    : `${metamaskVersion}-${process.env.METAMASK_ENVIRONMENT}`

  return function trackSegmentEvent ({
    event,
    category,
    isOptIn,
    properties = {},
    revenue,
    currency,
    value,
    excludeMetaMetricsId: excludeId,
    breadcrumb,
    additionalContext = {},
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
      network,
      metaMetricsSendCount,
    } = getDynamicState()

    let excludeMetaMetricsId = excludeId ?? defaultMetaMetricsExclusion

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

    const context = merge({
      app: {
        name: 'MetaMask Extension',
        version,
      },
      userAgent: window.navigator.userAgent,
    }, providedContext, additionalContext)

    const trackOptions = {
      event,
      properties: {
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
      trackOptions.userId = isOptIn ? METAMETRICS_ANONYMOUS_ID : metaMetricsId
    }

    if (breadcrumb?.id) {
      const existingProperties = breadcrumbs.get(breadcrumb.id) ?? {}
      const mergedProperties = merge(existingProperties, trackOptions.properties)
      if (breadcrumb.isComplete) {
        trackOptions.properties = mergedProperties
        breadcrumbs.delete(breadcrumb.id)
        segment.track(trackOptions)
      } else {
        breadcrumbs.set(breadcrumb.id, mergedProperties)
      }
    } else {
      segment.track(trackOptions)
    }

    /**
     * Some events will want to wait for the track before proceeding. Segment does
     * things a little differently depending on environment (flushing, vs batching)
     * so the callback option on .track may behave oddly. It is safe to add a small timeout
     * to ensure the event is at least queued in segment. This is how the .trackLink and
     * .trackForm functions on segment's analytics.js library behave.
     */
    return new Promise((resolve) => {
      setTimeout(resolve, 100)
    })
  }
}
