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
import { v4 as uuidv4 } from 'uuid';
import { NameType } from '@metamask/name-controller';
import { ENVIRONMENT_TYPE_BACKGROUND } from '../../../shared/constants/app';
import {
  METAMETRICS_ANONYMOUS_ID,
  METAMETRICS_BACKGROUND_PAGE_OBJECT,
  MetaMetricsUserTrait,
} from '../../../shared/constants/metametrics';
import { SECOND } from '../../../shared/constants/time';
import { isManifestV3 } from '../../../shared/modules/mv3.utils';
import { METAMETRICS_FINALIZE_EVENT_FRAGMENT_ALARM } from '../../../shared/constants/alarms';
import { checkAlarmExists, generateRandomId, isValidDate } from '../lib/util';
import {
  AnonymousTransactionMetaMetricsEvent,
  TransactionMetaMetricsEvent,
} from '../../../shared/constants/transaction';

const EXTENSION_UNINSTALL_URL = 'https://metamask.io/uninstalled';

export const overrideAnonymousEventNames = {
  [TransactionMetaMetricsEvent.added]:
    AnonymousTransactionMetaMetricsEvent.added,
  [TransactionMetaMetricsEvent.approved]:
    AnonymousTransactionMetaMetricsEvent.approved,
  [TransactionMetaMetricsEvent.finalized]:
    AnonymousTransactionMetaMetricsEvent.finalized,
  [TransactionMetaMetricsEvent.rejected]:
    AnonymousTransactionMetaMetricsEvent.rejected,
  [TransactionMetaMetricsEvent.submitted]:
    AnonymousTransactionMetaMetricsEvent.submitted,
};

const defaultCaptureException = (err) => {
  // throw error on clean stack so its captured by platform integrations (eg sentry)
  // but does not interrupt the call stack
  setTimeout(() => {
    throw err;
  });
};

// The function is used to build a unique messageId for segment messages
// It uses actionId and uniqueIdentifier from event if present
const buildUniqueMessageId = (args) => {
  const messageIdParts = [];
  if (args.uniqueIdentifier) {
    messageIdParts.push(args.uniqueIdentifier);
  }
  if (args.actionId) {
    messageIdParts.push(args.actionId);
  }
  if (messageIdParts.length && args.isDuplicateAnonymizedEvent) {
    messageIdParts.push('0x000');
  }
  if (messageIdParts.length) {
    return messageIdParts.join('-');
  }
  return generateRandomId();
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
 * @property {Array} [eventsBeforeMetricsOptIn] - Array of queued events added before
 *  a user opts into metrics.
 * @property {object} [traits] - Traits that are not derived from other state keys.
 * @property {Record<string any>} [previousUserTraits] - The user traits the last
 *  time they were computed.
 */

export default class MetaMetricsController {
  /**
   * @param {object} options
   * @param {object} options.segment - an instance of analytics for tracking
   *  events that conform to the new MetaMetrics tracking plan.
   * @param {object} options.preferencesStore - The preferences controller store, used
   *  to access and subscribe to preferences that will be attached to events
   * @param {Function} options.onNetworkDidChange - Used to attach a listener to the
   *  networkDidChange event emitted by the networkController
   * @param {Function} options.getCurrentChainId - Gets the current chain id from the
   *  network controller
   * @param {string} options.version - The version of the extension
   * @param {string} options.environment - The environment the extension is running in
   * @param {string} options.extension - webextension-polyfill
   * @param {MetaMetricsControllerState} options.initState - State to initialized with
   * @param options.captureException
   */
  constructor({
    segment,
    preferencesStore,
    onNetworkDidChange,
    getCurrentChainId,
    version,
    environment,
    initState,
    extension,
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
    this.locale = prefState.currentLocale.replace('_', '-');
    this.version =
      environment === 'production' ? version : `${version}-${environment}`;
    this.extension = extension;
    this.environment = environment;

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    this.selectedAddress = prefState.selectedAddress;
    ///: END:ONLY_INCLUDE_IF

    const abandonedFragments = omitBy(initState?.fragments, 'persist');
    const segmentApiCalls = initState?.segmentApiCalls || {};

    this.store = new ObservableStore({
      participateInMetaMetrics: null,
      metaMetricsId: null,
      eventsBeforeMetricsOptIn: [],
      traits: {},
      previousUserTraits: {},
      ...initState,
      fragments: {
        ...initState?.fragments,
      },
      segmentApiCalls: {
        ...segmentApiCalls,
      },
    });

    preferencesStore.subscribe(({ currentLocale }) => {
      this.locale = currentLocale.replace('_', '-');
    });

    onNetworkDidChange(() => {
      this.chainId = getCurrentChainId();
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

    // Code below submits any pending segmentApiCalls to Segment if/when the controller is re-instantiated
    if (isManifestV3) {
      Object.values(segmentApiCalls).forEach(({ eventType, payload }) => {
        this._submitSegmentAPICall(eventType, payload);
      });
    }

    // Close out event fragments that were created but not progressed. An
    // interval is used to routinely check if a fragment has not been updated
    // within the fragment's timeout window. When creating a new event fragment
    // a timeout can be specified that will cause an abandoned event to be
    // tracked if the event isn't progressed within that amount of time.
    if (isManifestV3) {
      /* eslint-disable no-undef */
      this.extension.alarms.getAll().then((alarms) => {
        const hasAlarm = checkAlarmExists(
          alarms,
          METAMETRICS_FINALIZE_EVENT_FRAGMENT_ALARM,
        );

        if (!hasAlarm) {
          this.extension.alarms.create(
            METAMETRICS_FINALIZE_EVENT_FRAGMENT_ALARM,
            {
              delayInMinutes: 1,
              periodInMinutes: 1,
            },
          );
        }
      });
      this.extension.alarms.onAlarm.addListener((alarmInfo) => {
        if (alarmInfo.name === METAMETRICS_FINALIZE_EVENT_FRAGMENT_ALARM) {
          this.finalizeAbandonedFragments();
        }
      });
    } else {
      setInterval(() => {
        this.finalizeAbandonedFragments();
      }, SECOND * 30);
    }
  }

  finalizeAbandonedFragments() {
    Object.values(this.store.getState().fragments).forEach((fragment) => {
      if (
        fragment.timeout &&
        Date.now() - fragment.lastUpdated / 1000 > fragment.timeout
      ) {
        this.finalizeEventFragment(fragment.id, { abandoned: true });
      }
    });
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

    const id = options.uniqueIdentifier ?? uuidv4();
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
        actionId: options.actionId,
        uniqueIdentifier: options.uniqueIdentifier,
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
      actionId: fragment.actionId,
      // We append success or failure to the unique-identifier so that the
      // messageId can still be idempotent, but so that it differs from the
      // initial event fired. The initial event was preventing new events from
      // making it to mixpanel because they were using the same unique ID as
      // the events processed in other parts of the fragment lifecycle.
      uniqueIdentifier: fragment.uniqueIdentifier
        ? `${fragment.uniqueIdentifier}-${abandoned ? 'failure' : 'success'}`
        : undefined,
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

  // It sets an uninstall URL ("Sorry to see you go!" page),
  // which is opened if a user uninstalls the extension.
  updateExtensionUninstallUrl(participateInMetaMetrics, metaMetricsId) {
    const query = {};
    if (participateInMetaMetrics) {
      // We only want to track these things if a user opted into metrics.
      query.mmi = Buffer.from(metaMetricsId).toString('base64');
      query.env = this.environment;
      query.av = this.version;
    }
    const queryString = new URLSearchParams(query);

    // this.extension not currently defined in tests
    if (this.extension && this.extension.runtime) {
      this.extension.runtime.setUninstallURL(
        `${EXTENSION_UNINSTALL_URL}?${queryString}`,
      );
    }
  }

  /**
   * Setter for the `participateInMetaMetrics` property
   *
   * @param {boolean} participateInMetaMetrics - Whether or not the user wants
   *  to participate in MetaMetrics
   * @returns {Promise<string|null>} the string of the new metametrics id, or null
   *  if not set
   */
  async setParticipateInMetaMetrics(participateInMetaMetrics) {
    let { metaMetricsId } = this.state;
    if (participateInMetaMetrics && !metaMetricsId) {
      // We also need to start sentry automatic session tracking at this point
      await globalThis.sentry?.startSession();
      metaMetricsId = this.generateMetaMetricsId();
    } else if (participateInMetaMetrics === false) {
      // We also need to stop sentry automatic session tracking at this point
      await globalThis.sentry?.endSession();
    }
    this.store.updateState({ participateInMetaMetrics, metaMetricsId });
    if (participateInMetaMetrics) {
      this.trackEventsAfterMetricsOptIn();
      this.clearEventsAfterMetricsOptIn();
    }

    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    this.updateExtensionUninstallUrl(participateInMetaMetrics, metaMetricsId);
    ///: END:ONLY_INCLUDE_IF

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
  trackPage(
    { name, params, environmentType, page, referrer, actionId },
    options,
  ) {
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
      this._submitSegmentAPICall('page', {
        messageId: buildUniqueMessageId({ actionId }),
        [idTrait]: idValue,
        name,
        properties: {
          params,
          locale: this.locale,
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

      // change anonymous event names
      const anonymousEventName =
        overrideAnonymousEventNames[`${payload.event}`];
      const anonymousPayload = {
        ...payload,
        event: anonymousEventName ?? payload.event,
      };

      const combinedProperties = merge(
        anonymousPayload.sensitiveProperties,
        anonymousPayload.properties,
      );

      events.push(
        this._track(
          this._buildEventPayload({
            ...anonymousPayload,
            properties: combinedProperties,
            isDuplicateAnonymizedEvent: true,
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

  // Track all queued events after a user opted into metrics.
  trackEventsAfterMetricsOptIn() {
    const { eventsBeforeMetricsOptIn } = this.store.getState();
    eventsBeforeMetricsOptIn.forEach((eventBeforeMetricsOptIn) => {
      this.trackEvent(eventBeforeMetricsOptIn);
    });
  }

  // Once we track queued events after a user opts into metrics, we want to clear the event queue.
  clearEventsAfterMetricsOptIn() {
    this.store.updateState({
      eventsBeforeMetricsOptIn: [],
    });
  }

  // It adds an event into a queue, which is only tracked if a user opts into metrics.
  addEventBeforeMetricsOptIn(event) {
    const prevState = this.store.getState().eventsBeforeMetricsOptIn;
    this.store.updateState({
      eventsBeforeMetricsOptIn: [...prevState, event],
    });
  }

  // Add or update traits for tracking.
  updateTraits(newTraits) {
    const { traits } = this.store.getState();
    this.store.updateState({
      traits: { ...traits, ...newTraits },
    });
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
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    const mmiProps = {};

    if (this.extension?.runtime?.id) {
      mmiProps.extensionId = this.extension.runtime.id;
    }
    ///: END:ONLY_INCLUDE_IF

    return {
      app: {
        name: 'MetaMask Extension',
        version: this.version,
        ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
        ...mmiProps,
        ///: END:ONLY_INCLUDE_IF
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

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    const mmiProps = {};

    if (this.extension?.runtime?.id) {
      mmiProps.extensionId = this.extension.runtime.id;
    }

    if (this.selectedAddress) {
      mmiProps.accountAddress = this.selectedAddress;
    }
    ///: END:ONLY_INCLUDE_IF

    return {
      event,
      messageId: buildUniqueMessageId(rawPayload),
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
        locale: this.locale,
        chain_id: properties?.chain_id ?? this.chainId,
        environment_type: environmentType,
        ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
        ...mmiProps,
        ///: END:ONLY_INCLUDE_IF
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
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    const mmiAccountAddress =
      metamaskState.custodyAccountDetails &&
      Object.keys(metamaskState.custodyAccountDetails).length
        ? Object.keys(metamaskState.custodyAccountDetails)[0]
        : null;
    ///: END:ONLY_INCLUDE_IF
    const { traits, previousUserTraits } = this.store.getState();
    let securityProvider;
    if (metamaskState.securityAlertsEnabled) {
      securityProvider = 'blockaid';
    }
    if (metamaskState.transactionSecurityCheckEnabled) {
      securityProvider = 'opensea';
    }
    /** @type {MetaMetricsTraits} */
    const currentTraits = {
      [MetaMetricsUserTrait.AddressBookEntries]: sum(
        Object.values(metamaskState.addressBook).map(size),
      ),
      [MetaMetricsUserTrait.InstallDateExt]:
        traits[MetaMetricsUserTrait.InstallDateExt] || '',
      [MetaMetricsUserTrait.LedgerConnectionType]:
        metamaskState.ledgerTransportType,
      [MetaMetricsUserTrait.NetworksAdded]: Object.values(
        metamaskState.networkConfigurations,
      ).map((networkConfiguration) => networkConfiguration.chainId),
      [MetaMetricsUserTrait.NetworksWithoutTicker]: Object.values(
        metamaskState.networkConfigurations,
      )
        .filter(({ ticker }) => !ticker)
        .map(({ chainId }) => chainId),
      [MetaMetricsUserTrait.NftAutodetectionEnabled]:
        metamaskState.useNftDetection,
      [MetaMetricsUserTrait.NumberOfAccounts]: Object.values(
        metamaskState.internalAccounts.accounts,
      ).length,
      [MetaMetricsUserTrait.NumberOfNftCollections]:
        this._getAllUniqueNFTAddressesLength(metamaskState.allNfts),
      [MetaMetricsUserTrait.NumberOfNfts]: this._getAllNFTsFlattened(
        metamaskState.allNfts,
      ).length,
      [MetaMetricsUserTrait.NumberOfTokens]:
        this._getNumberOfTokens(metamaskState),
      [MetaMetricsUserTrait.OpenseaApiEnabled]: metamaskState.openSeaEnabled,
      [MetaMetricsUserTrait.ThreeBoxEnabled]: false, // deprecated, hard-coded as false
      [MetaMetricsUserTrait.Theme]: metamaskState.theme || 'default',
      [MetaMetricsUserTrait.TokenDetectionEnabled]:
        metamaskState.useTokenDetection,
      [MetaMetricsUserTrait.UseNativeCurrencyAsPrimaryCurrency]:
        metamaskState.useNativeCurrencyAsPrimaryCurrency,
      ///: BEGIN:ONLY_INCLUDE_IF(desktop)
      [MetaMetricsUserTrait.DesktopEnabled]:
        metamaskState.desktopEnabled || false,
      ///: END:ONLY_INCLUDE_IF
      ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
      [MetaMetricsUserTrait.MmiExtensionId]: this.extension?.runtime?.id,
      [MetaMetricsUserTrait.MmiAccountAddress]: mmiAccountAddress,
      [MetaMetricsUserTrait.MmiIsCustodian]: Boolean(mmiAccountAddress),
      ///: END:ONLY_INCLUDE_IF
      [MetaMetricsUserTrait.SecurityProviders]: securityProvider
        ? [securityProvider]
        : [],
      [MetaMetricsUserTrait.PetnameAddressCount]:
        this._getPetnameAddressCount(metamaskState),
    };

    if (!previousUserTraits) {
      this.store.updateState({ previousUserTraits: currentTraits });
      return currentTraits;
    }

    if (previousUserTraits && !isEqual(previousUserTraits, currentTraits)) {
      const updates = pickBy(
        currentTraits,
        (v, k) => !isEqual(previousUserTraits[k], v),
      );
      this.store.updateState({ previousUserTraits: currentTraits });
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
   * Returns an array of all of the NFTs the user
   * possesses across all networks and accounts.
   *
   * @param {object} allNfts
   * @returns {[]}
   */
  _getAllNFTsFlattened = memoize((allNfts = {}) => {
    return Object.values(allNfts).reduce((result, chainNFTs) => {
      return result.concat(...Object.values(chainNFTs));
    }, []);
  });

  /**
   * Returns the number of unique NFT addresses the user
   * possesses across all networks and accounts.
   *
   * @param {object} allNfts
   * @returns {number}
   */
  _getAllUniqueNFTAddressesLength(allNfts = {}) {
    const allNFTAddresses = this._getAllNFTsFlattened(allNfts).map(
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
      this._submitSegmentAPICall('identify', {
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

      this._submitSegmentAPICall('track', payload, callback);
      if (flushImmediately) {
        this.segment.flush();
      }
    });
  }

  // Method below submits the request to analytics SDK.
  // It will also add event to controller store
  // and pass a callback to remove it from store once request is submitted to segment
  // Saving segmentApiCalls in controller store in MV3 ensures that events are tracked
  // even if service worker terminates before events are submiteed to segment.
  _submitSegmentAPICall(eventType, payload, callback) {
    const { metaMetricsId, participateInMetaMetrics } = this.state;
    if (!participateInMetaMetrics || !metaMetricsId) {
      return;
    }

    const messageId = payload.messageId || generateRandomId();
    let timestamp = new Date();
    if (payload.timestamp) {
      const payloadDate = new Date(payload.timestamp);
      if (isValidDate(payloadDate)) {
        timestamp = payloadDate;
      }
    }
    const modifiedPayload = { ...payload, messageId, timestamp };
    this.store.updateState({
      segmentApiCalls: {
        ...this.store.getState().segmentApiCalls,
        [messageId]: {
          eventType,
          payload: {
            ...modifiedPayload,
            timestamp: modifiedPayload.timestamp.toString(),
          },
        },
      },
    });
    const modifiedCallback = (result) => {
      const { segmentApiCalls } = this.store.getState();
      delete segmentApiCalls[messageId];
      this.store.updateState({
        segmentApiCalls,
      });
      return callback?.(result);
    };
    this.segment[eventType](modifiedPayload, modifiedCallback);
  }

  /**
   * Returns the total number of Ethereum addresses with saved petnames,
   * including all chain ID variations.
   *
   * @param {object} metamaskState
   * @returns {number}
   */
  _getPetnameAddressCount(metamaskState) {
    const addressNames = metamaskState.names?.[NameType.ETHEREUM_ADDRESS] ?? {};

    return Object.keys(addressNames).reduce((totalCount, address) => {
      const addressEntry = addressNames[address];

      const addressNameCount = Object.keys(addressEntry).reduce(
        (count, chainId) => {
          const hasName = Boolean(addressEntry[chainId].name?.length);
          return count + (hasName ? 1 : 0);
        },
        0,
      );

      return totalCount + addressNameCount;
    }, 0);
  }
}
