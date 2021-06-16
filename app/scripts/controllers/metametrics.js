import { merge, omit } from 'lodash';
import { ObservableStore } from '@metamask/obs-store';
import { bufferToHex, keccak } from 'ethereumjs-util';
import { ENVIRONMENT_TYPE_BACKGROUND } from '../../../shared/constants/app';
import {
  METAMETRICS_ANONYMOUS_ID,
  METAMETRICS_BACKGROUND_PAGE_OBJECT,
} from '../../../shared/constants/metametrics';

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
 */

export default class MetaMetricsController {
  /**
   * @param {Object} segment - an instance of analytics-node for tracking
   *  events that conform to the new MetaMetrics tracking plan.
   * @param {Object} preferencesStore - The preferences controller store, used
   *  to access and subscribe to preferences that will be attached to events
   * @param {function} onNetworkDidChange - Used to attach a listener to the
   *  networkDidChange event emitted by the networkController
   * @param {function} getCurrentChainId - Gets the current chain id from the
   *  network controller
   * @param {function} getNetworkIdentifier - Gets the current network
   *  identifier from the network controller
   * @param {string} version - The version of the extension
   * @param {string} environment - The environment the extension is running in
   * @param {MetaMetricsControllerState} initState - State to initialized with
   */
  constructor({
    segment,
    preferencesStore,
    onNetworkDidChange,
    getCurrentChainId,
    getNetworkIdentifier,
    version,
    environment,
    initState,
  }) {
    const prefState = preferencesStore.getState();
    this.chainId = getCurrentChainId();
    this.network = getNetworkIdentifier();
    this.locale = prefState.currentLocale.replace('_', '-');
    this.version =
      environment === 'production' ? version : `${version}-${environment}`;

    this.store = new ObservableStore({
      participateInMetaMetrics: null,
      metaMetricsId: null,
      ...initState,
    });

    preferencesStore.subscribe(({ currentLocale }) => {
      this.locale = currentLocale.replace('_', '-');
    });

    onNetworkDidChange(() => {
      this.chainId = getCurrentChainId();
      this.network = getNetworkIdentifier();
    });
    this.segment = segment;
  }

  generateMetaMetricsId() {
    return bufferToHex(
      keccak(
        Buffer.from(
          String(Date.now()) +
            String(Math.round(Math.random() * Number.MAX_SAFE_INTEGER)),
        ),
      ),
    );
  }

  /**
   * Setter for the `participateInMetaMetrics` property
   *
   * @param {boolean} participateInMetaMetrics - Whether or not the user wants
   *  to participate in MetaMetrics
   * @returns {string|null} the string of the new metametrics id, or null
   *  if not set
   */
  setParticipateInMetaMetrics(participateInMetaMetrics) {
    let { metaMetricsId } = this.state;
    if (participateInMetaMetrics && !metaMetricsId) {
      metaMetricsId = this.generateMetaMetricsId();
    } else if (participateInMetaMetrics === false) {
      metaMetricsId = null;
    }
    this.store.updateState({ participateInMetaMetrics, metaMetricsId });
    return metaMetricsId;
  }

  get state() {
    return this.store.getState();
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
    };
  }

  /**
   * Build's the event payload, processing all fields into a format that can be
   * fed to Segment's track method
   * @private
   * @param {
   *  Omit<MetaMetricsEventPayload, 'sensitiveProperties'>
   * } rawPayload - raw payload provided to trackEvent
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
    } = rawPayload;
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
        network: properties?.network ?? this.network,
        locale: this.locale,
        chain_id: properties?.chain_id ?? this.chainId,
        environment_type: environmentType,
      },
      context: this._buildContext(referrer, page),
    };
  }

  /**
   * Perform validation on the payload and update the id type to use before
   * sending to Segment. Also examines the options to route and handle the
   * event appropriately.
   * @private
   * @param {SegmentEventPayload} payload - properties to attach to event
   * @param {MetaMetricsEventOptions} [options] - options for routing and
   *  handling the event
   * @returns {Promise<void>}
   */
  _track(payload, options) {
    const {
      isOptIn,
      metaMetricsId: metaMetricsIdOverride,
      matomoEvent,
      flushImmediately,
    } = options || {};
    let idType = 'userId';
    let idValue = this.state.metaMetricsId;
    let excludeMetaMetricsId = options?.excludeMetaMetricsId ?? false;
    // This is carried over from the old implementation, and will likely need
    // to be updated to work with the new tracking plan. I think we should use
    // a config setting for this instead of trying to match the event name
    const isSendFlow = Boolean(payload.event.match(/^send|^confirm/iu));
    if (isSendFlow) {
      excludeMetaMetricsId = true;
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
      idType = 'anonymousId';
      idValue = METAMETRICS_ANONYMOUS_ID;
    } else if (isOptIn && metaMetricsIdOverride) {
      idValue = metaMetricsIdOverride;
    }
    payload[idType] = idValue;

    // If this is an event on the old matomo schema, add a key to the payload
    // to designate it as such
    if (matomoEvent === true) {
      payload.properties.legacy_event = true;
    }

    // Promises will only resolve when the event is sent to segment. For any
    // event that relies on this promise being fulfilled before performing UI
    // updates, or otherwise delaying user interaction, supply the
    // 'flushImmediately' flag to the trackEvent method.
    return new Promise((resolve, reject) => {
      const callback = (err) => {
        if (err) {
          // The error that segment gives us has some manipulation done to it
          // that seemingly breaks with lockdown enabled. Creating a new error
          // here prevents the system from freezing when the network request to
          // segment fails for any reason.
          const safeError = new Error(err.message);
          safeError.stack = err.stack;
          return reject(safeError);
        }
        return resolve();
      };

      this.segment.track(payload, callback);
      if (flushImmediately) {
        this.segment.flush();
      }
    });
  }

  /**
   * track a page view with Segment
   * @param {MetaMetricsPagePayload} payload - details of the page viewed
   * @param {MetaMetricsPageOptions} [options] - options for handling the page
   *  view
   */
  trackPage({ name, params, environmentType, page, referrer }, options) {
    if (this.state.participateInMetaMetrics === false) {
      return;
    }

    if (this.state.participateInMetaMetrics === null && !options?.isOptInPath) {
      return;
    }
    const { metaMetricsId } = this.state;
    const idTrait = metaMetricsId ? 'userId' : 'anonymousId';
    const idValue = metaMetricsId ?? METAMETRICS_ANONYMOUS_ID;
    this.segment.page({
      [idTrait]: idValue,
      name,
      properties: {
        params,
        locale: this.locale,
        network: this.network,
        chain_id: this.chainId,
        environment_type: environmentType,
      },
      context: this._buildContext(referrer, page),
    });
  }

  /**
   * track a metametrics event, performing necessary payload manipulation and
   * routing the event to the appropriate segment source. Will split events
   * with sensitiveProperties into two events, tracking the sensitiveProperties
   * with the anonymousId only.
   * @param {MetaMetricsEventPayload} payload - details of the event
   * @param {MetaMetricsEventOptions} [options] - options for handling/routing the event
   * @returns {Promise<void>}
   */
  async trackEvent(payload, options) {
    // event and category are required fields for all payloads
    if (!payload.event || !payload.category) {
      throw new Error(
        `Must specify event and category. Event was: ${
          payload.event
        }. Category was: ${payload.category}. Payload keys were: ${Object.keys(
          payload,
        )}. ${
          typeof payload.properties === 'object'
            ? `Payload property keys were: ${Object.keys(payload.properties)}`
            : ''
        }`,
      );
    }

    if (!this.state.participateInMetaMetrics && !options?.isOptIn) {
      return;
    }

    // We might track multiple events if sensitiveProperties is included, this array will hold
    // the promises returned from this._track.
    const events = [];

    if (payload.sensitiveProperties) {
      // sensitiveProperties will only be tracked using the anonymousId property and generic id
      // If the event options already specify to exclude the metaMetricsId we throw an error as
      // a signal to the developer that the event was implemented incorrectly
      if (options?.excludeMetaMetricsId === true) {
        throw new Error(
          'sensitiveProperties was specified in an event payload that also set the excludeMetaMetricsId flag',
        );
      }

      const combinedProperties = merge(
        payload.sensitiveProperties,
        payload.properties,
      );

      events.push(
        this._track(
          this._buildEventPayload({
            ...payload,
            properties: combinedProperties,
          }),
          { ...options, excludeMetaMetricsId: true },
        ),
      );
    }

    events.push(this._track(this._buildEventPayload(payload), options));

    await Promise.all(events);
  }
}
