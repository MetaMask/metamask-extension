import { merge, omit } from 'lodash'
import Analytics from 'analytics-node'
import ObservableStore from 'obs-store'
import { bufferToHex, sha3 } from 'ethereumjs-util'
import { ENVIRONMENT_TYPE_BACKGROUND } from '../lib/enums'
import {
  createSegmentMock,
  METAMETRICS_ANONYMOUS_ID,
  METAMETRICS_BACKGROUND_PAGE_OBJECT,
} from '../../../shared/constants/metametrics'

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

/**
 * @typedef {import('../../../shared/constants/metametrics').MetaMetricsContext} MetaMetricsContext
 * @typedef {import('../../../shared/constants/metametrics').MetaMetricsEventPayload} MetaMetricsEventPayload
 * @typedef {import('../../../shared/constants/metametrics').MetaMetricsEventOptions} MetaMetricsEventOptions
 * @typedef {import('../../../shared/constants/metametrics').SegmentEventPayload} SegmentEventPayload
 * @typedef {import('../../../shared/constants/metametrics').SegmentInterface} SegmentInterface
 * @typedef {import('../../../shared/constants/metametrics').MetaMetricsPagePayload} MetaMetricsPagePayload
 * @typedef {import('../../../shared/constants/metametrics').MetaMetricsPageOptions} MetaMetricsPageOptions
 */

/**
 * @typedef {Object} MetaMetricsControllerState
 * @property {?string} metaMetricsId - The user's metaMetricsId that will be
 *  attached to all non-anonymized event payloads
 * @property {?boolean} participateInMetaMetrics - The user's preference for
 *  participating in the MetaMetrics analytics program. This setting controls
 *  whether or not events are tracked
 * @property {number} metaMetricsSendCount - How many send transactions have
 *  been tracked through this controller. Used to prevent attaching sensitive
 *  data that can be traced through on chain data.
 */

export default class MetaMetricsController {
  /**
   * @param {boolean} isDevOrTestEnvironment - is the extension running in test
   *  of dev mode? This will impact how segment is initialized
   * @param {SegmentInterface} segmentMock - when in test or dev mode use this
   *  mocked Segment module instead of an instance of Analytics
   * @param {SegmentInterface} segmentLegacyMock - when in test or dev mode use
   *  this mocked Segment module instead of an instance of Analytics for legacy
   *  events
   * @param {string} segmentWriteKey - the write key for the Segment source to
   *  track new schema events to
   * @param {string} segmentLegacyWriteKey - the write key for the Segment
   *  source to tack legacy events to
   * @param {string} segmentHost - the host to send events to. The default
   *  host for Analytics constructor is 'https://api.segment.io'
   * @param {number} flushAt - the maximum number of events to queue before
   *  sending to Segment
   * @param {number} flushInterval - the maximum number of milliseconds to wait
   *  for before sending queued events
   * @param {Object} preferencesController - The preferences controller, used
   *  to access and subscribe to preferences that will be attached to events
   * @param {Object} networkController - The network controller, used to access
   *  the current network's chainId and network identifier. These properties
   *  are attached to events
   * @param {string} version - The version of the extension
   * @param {string} environment - The environment the extension is running in
   * @param {MetaMetricsControllerState} - State to initialized with
   */
  constructor({
    isDevOrTestEnvironment,
    segmentMock,
    segmentLegacyMock,
    segmentWriteKey,
    segmentLegacyWriteKey,
    segmentHost,
    flushAt,
    flushInterval,
    preferencesController,
    networkController,
    version,
    environment,
    initState,
  }) {
    const prefState = preferencesController.store.getState()
    this.chainId = networkController.getCurrentChainId()
    this.network = networkController.getNetworkIdentifier()
    this.locale = prefState.currentLocale.replace('_', '-')
    this.version =
      environment === 'production' ? version : `${version}-${environment}`

    this.store = new ObservableStore({
      participateInMetaMetrics: null,
      metaMetricsId: null,
      metaMetricsSendCount: 0,
      ...initState,
    })

    preferencesController.store.subscribe(({ currentLocale }) => {
      this.locale = currentLocale.replace('_', '-')
    })

    networkController.on('networkDidChange', () => {
      this.chainId = networkController.getCurrentChainId()
      this.network = networkController.getNetworkIdentifier()
    })

    // We do not want to track events on development builds unless specifically
    // provided a SEGMENT_WRITE_KEY. This also holds true for test environments and
    // E2E, which is handled in the build process by never providing the SEGMENT_WRITE_KEY
    // when process.env.IN_TEST is truthy
    this.segment =
      !segmentWriteKey || (isDevOrTestEnvironment && !segmentHost)
        ? segmentMock ?? createSegmentMock(flushAt, flushInterval)
        : new Analytics(segmentWriteKey, {
            segmentHost,
            flushAt,
            flushInterval,
          })

    this.segmentLegacy =
      !segmentLegacyWriteKey || (isDevOrTestEnvironment && !segmentHost)
        ? segmentLegacyMock ?? createSegmentMock(flushAt, flushInterval)
        : new Analytics(segmentLegacyWriteKey, {
            segmentHost,
            flushAt,
            flushInterval,
          })
  }

  generateMetaMetricsId() {
    return bufferToHex(
      sha3(
        String(Date.now()) +
          String(Math.round(Math.random() * Number.MAX_SAFE_INTEGER)),
      ),
    )
  }

  /**
   * Setter for the `participateInMetaMetrics` property
   *
   * @param {boolean} bool - Whether or not the user wants to participate in MetaMetrics
   * @returns {string|null} the string of the new metametrics id, or null if not set
   *
   */
  setParticipateInMetaMetrics(bool) {
    this.store.updateState({ participateInMetaMetrics: bool })
    if (bool && !this.metaMetricsId) {
      this.metaMetricsId = this.generateMetaMetricsId()
    } else if (bool === false) {
      this.metaMetricsId = null
    }
    return this.metaMetricsId
  }

  /**
   * retrieve the user's preference for participating in MetaMetrics
   */
  get participateInMetaMetrics() {
    return this.store.getState().participateInMetaMetrics
  }

  setMetaMetricsSendCount(val) {
    this.store.updateState({ metaMetricsSendCount: val })
  }

  get metaMetricsSendCount() {
    return this.store.getState().metaMetricsSendCount
  }

  get metaMetricsId() {
    return this.store.getState().metaMetricsId
  }

  set metaMetricsId(metaMetricsId) {
    this.store.updateState({ metaMetricsId })
  }

  /**
   * Build the context object to attach to page and track events.
   * @private
   * @param {Pick<MetaMetricsContext, 'referrer'>} [referrer] - dapp origin that initialized
   *  the notification window.
   * @param {Pick<MetaMetricsContext, 'page'>} [page] - page object describing the current
   *  view of the extension. Defaults to the background-process object.
   * @returns {MetaMetricsContext}
   */
  _buildContext(referrer, page = METAMETRICS_BACKGROUND_PAGE_OBJECT) {
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
   * Build's the event payload, processing all fields into a format that can be
   * fed to Segment's track method
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
   * Perform validation on the payload and update the id type to use before
   * sending to Segment. Also examines the options to route and handle the
   * event appropriately.
   * @private
   * @param {SegmentEventPayload} payload - properties to attach to event
   * @param {MetaMetricsEventOptions} options - options for routing and
   *  handling the event
   * @returns {Promise<void>}
   */
  _track(payload, options) {
    const {
      isOptIn,
      metaMetricsId: metaMetricsIdOverride,
      matomoEvent,
      flushImmediately,
    } = options
    let idType = 'userId'
    let idValue = this.metaMetricsId
    let excludeMetaMetricsId = options.excludeMetaMetricsId ?? false
    // This is carried over from the old implementation, and will likely need
    // to be updated to work with the new tracking plan. I think we should use
    // a config setting for this instead of trying to match the event name
    const isSendFlow = Boolean(payload.event.match(/^send|^confirm/iu))
    if (
      isSendFlow &&
      this.metaMetricsSendCount &&
      !sendCountIsTrackable(this.metaMetricsSendCount + 1)
    ) {
      excludeMetaMetricsId = true
    }
    // If we are tracking sensitive data we will always use the anonymousId
    // property as well as our METAMETRICS_ANONYMOUS_ID. This prevents us from
    // associating potentially identifiable information with a specific id.
    // During the opt in flow we will track all events, but do so with the
    // anonymous id. The one exception to that rule is after the user opts in
    // to MetaMetrics. When that happens we receive back the user's new
    // MetaMetrics id before it is fully persisted to state. To avoid a race
    // condition we explicitly pass the new id to the track method. In that
    // case we will track the opt in event to the user's id. In all other cases
    // we use the metaMetricsId from state.
    if (excludeMetaMetricsId || (isOptIn && !metaMetricsIdOverride)) {
      idType = 'anonymousId'
      idValue = METAMETRICS_ANONYMOUS_ID
    } else if (isOptIn && metaMetricsIdOverride) {
      idValue = metaMetricsIdOverride
    }
    payload[idType] = idValue

    // Promises will only resolve when the event is sent to segment. For any
    // event that relies on this promise being fulfilled before performing UI
    // updates, or otherwise delaying user interaction, supply the
    // 'flushImmediately' flag to the trackEvent method.
    return new Promise((resolve, reject) => {
      const callback = (err) => {
        if (err) {
          return reject(err)
        }
        return resolve()
      }

      const target = matomoEvent === true ? this.segmentLegacy : this.segment

      target.track(payload, callback)
      if (flushImmediately) {
        target.flush()
      }
    })
  }

  /**
   * track a page view with Segment
   * @param {MetaMetricsPagePayload} payload - details of the page viewed
   * @param {MetaMetricsPageOptions} options - options for handling the page
   *  view
   */
  trackPage({ name, params, environmentType, page, referrer }, options = {}) {
    if (this.participateInMetaMetrics === false) {
      return
    }

    if (this.participateInMetaMetrics === null && !options.isOptInPath) {
      return
    }
    const idTrait = this.metaMetricsId ? 'userId' : 'anonymousId'
    const idValue = this.metaMetricsId ?? METAMETRICS_ANONYMOUS_ID
    this.segment.page({
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
    })
  }

  /**
   * track a metametrics event, performing necessary payload manipulation and
   * routing the event to the appropriate segment source. Will split events
   * with sensitiveProperties into two events, tracking the sensitiveProperties
   * with the anonymousId only.
   * @param {MetaMetricsEventPayload} payload - details of the event
   * @param {MetaMetricsEventOptions} options - options for handling/routing the event
   * @returns {Promise<void>}
   */
  async trackEvent(payload, options = {}) {
    // event and category are required fields for all payloads
    if (!payload.event || !payload.category) {
      throw new Error('Must specify event and category.')
    }

    if (!this.participateInMetaMetrics && !options.isOptIn) {
      return
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

    await Promise.all(events)
  }
}
