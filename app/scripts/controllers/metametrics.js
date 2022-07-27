import {
  isEqual,
  memoize,
  merge,
  omit,
  omitBy,
  pickBy,
  size,
  sum,
} from 'lodash';
import { ObservableStore } from '@metamask/obs-store';
import { bufferToHex, keccak } from 'ethereumjs-util';
import { generateUUID } from 'pubnub';
import { ENVIRONMENT_TYPE_BACKGROUND } from '../../../shared/constants/app';
import {
  METAMETRICS_ANONYMOUS_ID,
  METAMETRICS_BACKGROUND_PAGE_OBJECT,
  TRAITS,
} from '../../../shared/constants/metametrics';
import { SECOND } from '../../../shared/constants/time';

const defaultCaptureException = (err) => {
  // throw error on clean stack so its captured by platform integrations (eg sentry)
  // but does not interrupt the call stack
  setTimeout(() => {
    throw err;
  });
};

const exceptionsToFilter = {
  [`You must pass either an "anonymousId" or a "userId".`]: true,
};

/**
 * @typedef {import('../../../shared/constants/metametrics').MetaMetricsContext} MetaMetricsContext
 * @typedef {import('../../../shared/constants/metametrics').MetaMetricsEventPayload} MetaMetricsEventPayload
 * @typedef {import('../../../shared/constants/metametrics').MetaMetricsEventOptions} MetaMetricsEventOptions
 * @typedef {import('../../../shared/constants/metametrics').SegmentEventPayload} SegmentEventPayload
 * @typedef {import('../../../shared/constants/metametrics').SegmentInterface} SegmentInterface
 * @typedef {import('../../../shared/constants/metametrics').MetaMetricsPagePayload} MetaMetricsPagePayload
 * @typedef {import('../../../shared/constants/metametrics').MetaMetricsPageOptions} MetaMetricsPageOptions
 * @typedef {import('../../../shared/constants/metametrics').MetaMetricsEventFragment} MetaMetricsEventFragment
 * @typedef {import('../../../shared/constants/metametrics').MetaMetricsTraits} MetaMetricsTraits
 */

/**
 * @typedef {object} MetaMetricsControllerState
 * @property {string} [metaMetricsId] - The user's metaMetricsId that will be
 *  attached to all non-anonymized event payloads
 * @property {boolean} [participateInMetaMetrics] - The user's preference for
 *  participating in the MetaMetrics analytics program. This setting controls
 *  whether or not events are tracked
 * @property {{[string]: MetaMetricsEventFragment}} [fragments] - Object keyed
 *  by UUID with stored fragments as values.
 */

export default class MetaMetricsController {
  /**
   * @param {object} options
   * @param {object} options.segment - an instance of analytics-node for tracking
   *  events that conform to the new MetaMetrics tracking plan.
   * @param {object} options.preferencesStore - The preferences controller store, used
   *  to access and subscribe to preferences that will be attached to events
   * @param {Function} options.onNetworkDidChange - Used to attach a listener to the
   *  networkDidChange event emitted by the networkController
   * @param {Function} options.getCurrentChainId - Gets the current chain id from the
   *  network controller
   * @param {Function} options.getNetworkIdentifier - Gets the current network
   *  identifier from the network controller
   * @param {string} options.version - The version of the extension
   * @param {string} options.environment - The environment the extension is running in
   * @param {MetaMetricsControllerState} options.initState - State to initialized with
   * @param options.captureException
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
    captureException = defaultCaptureException,
  }) {
    this._captureException = (err) => {
      // This is a temporary measure. Currently there are errors flooding sentry due to a problem in how we are tracking anonymousId
      // We intend on removing this as soon as we understand how to correctly solve that problem.
      if (!exceptionsToFilter[err.message]) {
        captureException(err);
      }
    };
    const prefState = preferencesStore.getState();
    this.chainId = getCurrentChainId();
    this.network = getNetworkIdentifier();
    this.locale = prefState.currentLocale.replace('_', '-');
    this.version =
      environment === 'production' ? version : `${version}-${environment}`;

    const abandonedFragments = omitBy(initState?.fragments, 'persist');

    this.store = new ObservableStore({
      participateInMetaMetrics: null,
      metaMetricsId: null,
      ...initState,
      fragments: {
        ...initState?.fragments,
      },
    });

    preferencesStore.subscribe(({ currentLocale }) => {
      this.locale = currentLocale.replace('_', '-');
    });

    onNetworkDidChange(() => {
      this.chainId = getCurrentChainId();
      this.network = getNetworkIdentifier();
    });
    this.segment = segment;

    // Track abandoned fragments that weren't properly cleaned up.
    // Abandoned fragments are those that were stored in persistent memory
    // and are available at controller instance creation, but do not have the
    // 'persist' flag set. This means anytime the extension is unlocked, any
    // fragments that are not marked as persistent will be purged and the
    // failure event will be emitted.
    Object.values(abandonedFragments).forEach((fragment) => {
      this.finalizeEventFragment(fragment.id, { abandoned: true });
    });

    // Close out event fragments that were created but not progressed. An
    // interval is used to routinely check if a fragment has not been updated
    // within the fragment's timeout window. When creating a new event fragment
    // a timeout can be specified that will cause an abandoned event to be
    // tracked if the event isn't progressed within that amount of time.
    setInterval(() => {
      Object.values(this.store.getState().fragments).forEach((fragment) => {
        if (
          fragment.timeout &&
          Date.now() - fragment.lastUpdated / 1000 > fragment.timeout
        ) {
          this.finalizeEventFragment(fragment.id, { abandoned: true });
        }
      });
    }, SECOND * 30);
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
   * Create an event fragment in state and returns the event fragment object.
   *
   * @param {MetaMetricsEventFragment} options - Fragment settings and properties
   *  to initiate the fragment with.
   * @returns {MetaMetricsEventFragment}
   */
  createEventFragment(options) {
    if (!options.successEvent || !options.category) {
      throw new Error(
        `Must specify success event and category. Success event was: ${
          options.event
        }. Category was: ${options.category}. Payload keys were: ${Object.keys(
          options,
        )}. ${
          typeof options.properties === 'object'
            ? `Payload property keys were: ${Object.keys(options.properties)}`
            : ''
        }`,
      );
    }
    const { fragments } = this.store.getState();

    const id = options.uniqueIdentifier ?? generateUUID();
    const fragment = {
      id,
      ...options,
      lastUpdated: Date.now(),
    };
    this.store.updateState({
      fragments: {
        ...fragments,
        [id]: fragment,
      },
    });

    if (options.initialEvent) {
      this.trackEvent({
        event: fragment.initialEvent,
        category: fragment.category,
        properties: fragment.properties,
        sensitiveProperties: fragment.sensitiveProperties,
        page: fragment.page,
        referrer: fragment.referrer,
        revenue: fragment.revenue,
        value: fragment.value,
        currency: fragment.currency,
        environmentType: fragment.environmentType,
      });
    }

    return fragment;
  }

  /**
   * Returns the fragment stored in memory with provided id or undefined if it
   * does not exist.
   *
   * @param {string} id - id of fragment to retrieve
   * @returns {[MetaMetricsEventFragment]}
   */
  getEventFragmentById(id) {
    const { fragments } = this.store.getState();

    const fragment = fragments[id];

    return fragment;
  }

  /**
   * Updates an event fragment in state
   *
   * @param {string} id - The fragment id to update
   * @param {MetaMetricsEventFragment} payload - Fragment settings and
   *  properties to initiate the fragment with.
   */
  updateEventFragment(id, payload) {
    const { fragments } = this.store.getState();

    const fragment = fragments[id];

    if (!fragment) {
      throw new Error(`Event fragment with id ${id} does not exist.`);
    }

    this.store.updateState({
      fragments: {
        ...fragments,
        [id]: merge(fragments[id], {
          ...payload,
          lastUpdated: Date.now(),
        }),
      },
    });
  }

  /**
   * Finalizes a fragment, tracking either a success event or failure Event
   * and then removes the fragment from state.
   *
   * @param {string} id - UUID of the event fragment to be closed
   * @param {object} options
   * @param {boolean} [options.abandoned] - if true track the failure
   *  event instead of the success event
   * @param {MetaMetricsContext.page} [options.page] - page the final event
   *  occurred on. This will override whatever is set on the fragment
   * @param {MetaMetricsContext.referrer} [options.referrer] - Dapp that
   *  originated the fragment. This is for fallback only, the fragment referrer
   *  property will take precedence.
   */
  finalizeEventFragment(id, { abandoned = false, page, referrer } = {}) {
    const fragment = this.store.getState().fragments[id];
    if (!fragment) {
      throw new Error(`Funnel with id ${id} does not exist.`);
    }

    const eventName = abandoned ? fragment.failureEvent : fragment.successEvent;

    this.trackEvent({
      event: eventName,
      category: fragment.category,
      properties: fragment.properties,
      sensitiveProperties: fragment.sensitiveProperties,
      page: page ?? fragment.page,
      referrer: fragment.referrer ?? referrer,
      revenue: fragment.revenue,
      value: fragment.value,
      currency: fragment.currency,
      environmentType: fragment.environmentType,
    });
    const { fragments } = this.store.getState();
    delete fragments[id];
    this.store.updateState({ fragments });
  }

  /**
   * Calls this._identify with validated metaMetricsId and user traits if user is participating
   * in the MetaMetrics analytics program
   *
   * @param {object} userTraits
   */
  identify(userTraits) {
    const { metaMetricsId, participateInMetaMetrics } = this.state;

    if (!participateInMetaMetrics || !metaMetricsId || !userTraits) {
      return;
    }
    if (typeof userTraits !== 'object') {
      console.warn(
        `MetaMetricsController#identify: userTraits parameter must be an object. Received type: ${typeof userTraits}`,
      );
      return;
    }

    const allValidTraits = this._buildValidTraits(userTraits);

    this._identify(allValidTraits);
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
   * track a page view with Segment
   *
   * @param {MetaMetricsPagePayload} payload - details of the page viewed
   * @param {MetaMetricsPageOptions} [options] - options for handling the page
   *  view
   */
  trackPage({ name, params, environmentType, page, referrer }, options) {
    try {
      if (this.state.participateInMetaMetrics === false) {
        return;
      }

      if (
        this.state.participateInMetaMetrics === null &&
        !options?.isOptInPath
      ) {
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
    } catch (err) {
      this._captureException(err);
    }
  }

  /**
   * submits a metametrics event, not waiting for it to complete or allowing its error to bubble up
   *
   * @param {MetaMetricsEventPayload} payload - details of the event
   * @param {MetaMetricsEventOptions} [options] - options for handling/routing the event
   */
  trackEvent(payload, options) {
    // validation is not caught and handled
    this.validatePayload(payload);
    this.submitEvent(payload, options).catch((err) =>
      this._captureException(err),
    );
  }

  /**
   * submits (or queues for submission) a metametrics event, performing necessary payload manipulation and
   * routing the event to the appropriate segment source. Will split events
   * with sensitiveProperties into two events, tracking the sensitiveProperties
   * with the anonymousId only.
   *
   * @param {MetaMetricsEventPayload} payload - details of the event
   * @param {MetaMetricsEventOptions} [options] - options for handling/routing the event
   * @returns {Promise<void>}
   */
  async submitEvent(payload, options) {
    this.validatePayload(payload);

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

  /**
   * validates a metametrics event
   *
   * @param {MetaMetricsEventPayload} payload - details of the event
   */
  validatePayload(payload) {
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
  }

  handleMetaMaskStateUpdate(newState) {
    const userTraits = this._buildUserTraitsObject(newState);
    if (userTraits) {
      this.identify(userTraits);
    }
  }

  /** PRIVATE METHODS */

  /**
   * Build the context object to attach to page and track events.
   *
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
   *
   * @private
   * @param {
   *  Omit<MetaMetricsEventPayload, 'sensitiveProperties'>
   * } rawPayload - raw payload provided to trackEvent
   * @returns {SegmentEventPayload} formatted event payload for segment
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
   * This method generates the MetaMetrics user traits object, omitting any
   * traits that have not changed since the last invocation of this method.
   *
   * @param {object} metamaskState - Full metamask state object.
   * @returns {MetaMetricsTraits | null} traits that have changed since last update
   */
  _buildUserTraitsObject(metamaskState) {
    /** @type {MetaMetricsTraits} */
    const currentTraits = {
      [TRAITS.ADDRESS_BOOK_ENTRIES]: sum(
        Object.values(metamaskState.addressBook).map(size),
      ),
      [TRAITS.LEDGER_CONNECTION_TYPE]: metamaskState.ledgerTransportType,
      [TRAITS.NETWORKS_ADDED]: metamaskState.frequentRpcListDetail.map(
        (rpc) => rpc.chainId,
      ),
      [TRAITS.NETWORKS_WITHOUT_TICKER]: metamaskState.frequentRpcListDetail.reduce(
        (networkList, currentNetwork) => {
          if (!currentNetwork.ticker) {
            networkList.push(currentNetwork.chainId);
          }
          return networkList;
        },
        [],
      ),
      [TRAITS.NFT_AUTODETECTION_ENABLED]: metamaskState.useCollectibleDetection,
      [TRAITS.NUMBER_OF_ACCOUNTS]: Object.values(metamaskState.identities)
        .length,
      [TRAITS.NUMBER_OF_NFT_COLLECTIONS]: this._getAllUniqueNFTAddressesLength(
        metamaskState.allCollectibles,
      ),
      [TRAITS.NUMBER_OF_NFTS]: this._getAllNFTsFlattened(
        metamaskState.allCollectibles,
      ).length,
      [TRAITS.NUMBER_OF_TOKENS]: this._getNumberOfTokens(metamaskState),
      [TRAITS.OPENSEA_API_ENABLED]: metamaskState.openSeaEnabled,
      [TRAITS.THREE_BOX_ENABLED]: metamaskState.threeBoxSyncingAllowed,
      [TRAITS.THEME]: metamaskState.theme || 'default',
      [TRAITS.TOKEN_DETECTION_ENABLED]: metamaskState.useTokenDetection,
    };

    if (!this.previousTraits) {
      this.previousTraits = currentTraits;
      return currentTraits;
    }

    if (this.previousTraits && !isEqual(this.previousTraits, currentTraits)) {
      const updates = pickBy(
        currentTraits,
        (v, k) => !isEqual(this.previousTraits[k], v),
      );
      this.previousTraits = currentTraits;
      return updates;
    }

    return null;
  }

  /**
   * Returns a new object of all valid user traits. For dates, we transform them into ISO-8601 timestamp strings.
   *
   * @see {@link https://segment.com/docs/connections/spec/common/#timestamps}
   * @param {object} userTraits
   * @returns {object}
   */
  _buildValidTraits(userTraits) {
    return Object.entries(userTraits).reduce((validTraits, [key, value]) => {
      if (this._isValidTraitDate(value)) {
        validTraits[key] = value.toISOString();
      } else if (this._isValidTrait(value)) {
        validTraits[key] = value;
      } else {
        console.warn(
          `MetaMetricsController: "${key}" value is not a valid trait type`,
        );
      }
      return validTraits;
    }, {});
  }

  /**
   * Returns an array of all of the collectibles/NFTs the user
   * possesses across all networks and accounts.
   *
   * @param {object} allCollectibles
   * @returns {[]}
   */
  _getAllNFTsFlattened = memoize((allCollectibles = {}) => {
    return Object.values(allCollectibles).reduce((result, chainNFTs) => {
      return result.concat(...Object.values(chainNFTs));
    }, []);
  });

  /**
   * Returns the number of unique collectible/NFT addresses the user
   * possesses across all networks and accounts.
   *
   * @param {object} allCollectibles
   * @returns {number}
   */
  _getAllUniqueNFTAddressesLength(allCollectibles = {}) {
    const allNFTAddresses = this._getAllNFTsFlattened(allCollectibles).map(
      (nft) => nft.address,
    );
    const uniqueAddresses = new Set(allNFTAddresses);
    return uniqueAddresses.size;
  }

  /**
   * @param {object} metamaskState
   * @returns number of unique token addresses
   */
  _getNumberOfTokens(metamaskState) {
    return Object.values(metamaskState.allTokens).reduce(
      (result, accountsByChain) => {
        return result + sum(Object.values(accountsByChain).map(size));
      },
      0,
    );
  }

  /**
   * Calls segment.identify with given user traits
   *
   * @see {@link https://segment.com/docs/connections/sources/catalog/libraries/server/node/#identify}
   * @private
   * @param {object} userTraits
   */
  _identify(userTraits) {
    const { metaMetricsId } = this.state;

    if (!userTraits || Object.keys(userTraits).length === 0) {
      console.warn('MetaMetricsController#_identify: No userTraits found');
      return;
    }

    try {
      this.segment.identify({
        userId: metaMetricsId,
        traits: userTraits,
      });
    } catch (err) {
      this._captureException(err);
    }
  }

  /**
   * Validates the trait value. Segment accepts any data type. We are adding validation here to
   * support data types for our Segment destination(s) e.g. MixPanel
   *
   * @param {*} value
   * @returns {boolean}
   */
  _isValidTrait(value) {
    const type = typeof value;

    return (
      type === 'string' ||
      type === 'boolean' ||
      type === 'number' ||
      this._isValidTraitArray(value) ||
      this._isValidTraitDate(value)
    );
  }

  /**
   * Segment accepts any data type value. We have special logic to validate arrays.
   *
   * @param {*} value
   * @returns {boolean}
   */
  _isValidTraitArray = (value) => {
    return (
      Array.isArray(value) &&
      (value.every((element) => {
        return typeof element === 'string';
      }) ||
        value.every((element) => {
          return typeof element === 'boolean';
        }) ||
        value.every((element) => {
          return typeof element === 'number';
        }))
    );
  };

  /**
   * Returns true if the value is an accepted date type
   *
   * @param {*} value
   * @returns {boolean}
   */
  _isValidTraitDate = (value) => {
    return Object.prototype.toString.call(value) === '[object Date]';
  };

  /**
   * Perform validation on the payload and update the id type to use before
   * sending to Segment. Also examines the options to route and handle the
   * event appropriately.
   *
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
}
