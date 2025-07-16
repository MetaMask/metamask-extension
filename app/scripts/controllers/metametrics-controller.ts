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
import { bufferToHex, keccak } from 'ethereumjs-util';
import { v4 as uuidv4 } from 'uuid';
import { NameControllerState, NameType } from '@metamask/name-controller';
import { AccountsControllerState } from '@metamask/accounts-controller';
import {
  getErrorMessage,
  Hex,
  isErrorWithMessage,
  isErrorWithStack,
} from '@metamask/utils';
import {
  NetworkClientId,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
  NetworkControllerNetworkDidChangeEvent,
  NetworkState,
} from '@metamask/network-controller';
import { Browser } from 'webextension-polyfill';
import {
  Nft,
  NftControllerState,
  TokensControllerState,
} from '@metamask/assets-controllers';
import { captureException as sentryCaptureException } from '@sentry/browser';
import {
  BaseController,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { AddressBookControllerState } from '@metamask/address-book-controller';
import { ENVIRONMENT_TYPE_BACKGROUND } from '../../../shared/constants/app';
import {
  METAMETRICS_ANONYMOUS_ID,
  METAMETRICS_BACKGROUND_PAGE_OBJECT,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventFragment,
  MetaMetricsUserTrait,
  MetaMetricsUserTraits,
  SegmentEventPayload,
  MetaMetricsContext,
  MetaMetricsEventPayload,
  MetaMetricsEventOptions,
  MetaMetricsPagePayload,
  MetaMetricsPageOptions,
  MetaMetricsPageObject,
  MetaMetricsReferrerObject,
} from '../../../shared/constants/metametrics';
import { SECOND } from '../../../shared/constants/time';
import { isManifestV3 } from '../../../shared/modules/mv3.utils';
import { METAMETRICS_FINALIZE_EVENT_FRAGMENT_ALARM } from '../../../shared/constants/alarms';
import { checkAlarmExists, generateRandomId, isValidDate } from '../lib/util';
import {
  AnonymousTransactionMetaMetricsEvent,
  TransactionMetaMetricsEvent,
} from '../../../shared/constants/transaction';
import { LedgerTransportTypes } from '../../../shared/constants/hardware-wallets';
import Analytics from '../lib/segment/analytics';

///: BEGIN:ONLY_INCLUDE_IF(build-main)
import { ENVIRONMENT } from '../../../development/build/constants';
///: END:ONLY_INCLUDE_IF

import type {
  PreferencesControllerState,
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from './preferences-controller';

// Unique name for the controller
const controllerName = 'MetaMetricsController';

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
  [MetaMetricsEventName.SignatureRequested]:
    MetaMetricsEventName.SignatureRequestedAnon,
  [MetaMetricsEventName.SignatureApproved]:
    MetaMetricsEventName.SignatureApprovedAnon,
  [MetaMetricsEventName.SignatureRejected]:
    MetaMetricsEventName.SignatureRejectedAnon,
} as const;

const defaultCaptureException = (err: unknown) => {
  // throw error on clean stack so its captured by platform integrations (eg sentry)
  // but does not interrupt the call stack
  setTimeout(() => {
    throw err;
  });
};

// The function is used to build a unique messageId for segment messages
// It uses actionId and uniqueIdentifier from event if present
const buildUniqueMessageId = (args: {
  uniqueIdentifier?: string;
  actionId?: string;
  isDuplicateAnonymizedEvent?: boolean;
}): string => {
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

const exceptionsToFilter: Record<string, boolean> = {
  [`You must pass either an "anonymousId" or a "userId".`]: true,
};

/**
 * The type of a Segment event to create.
 *
 * Must correspond to the name of a method in {@link Analytics}.
 */
type SegmentEventType = 'identify' | 'track' | 'page';

// TODO: Complete MetaMaskState by adding the full state definition and relocate it after the background is converted to TypeScript.
export type MetaMaskState = {
  ledgerTransportType: LedgerTransportTypes;
  networkConfigurationsByChainId: NetworkState['networkConfigurationsByChainId'];
  internalAccounts: AccountsControllerState['internalAccounts'];
  allNfts: NftControllerState['allNfts'];
  allTokens: TokensControllerState['allTokens'];
  theme: string;
  participateInMetaMetrics: boolean;
  dataCollectionForMarketing: boolean;
  ShowNativeTokenAsMainBalance: boolean;
  useNftDetection: PreferencesControllerState['useNftDetection'];
  openSeaEnabled: PreferencesControllerState['openSeaEnabled'];
  securityAlertsEnabled: PreferencesControllerState['securityAlertsEnabled'];
  useTokenDetection: PreferencesControllerState['useTokenDetection'];
  tokenSortConfig: PreferencesControllerState['preferences']['tokenSortConfig'];
  names: NameControllerState['names'];
  security_providers: string[];
  addressBook: AddressBookControllerState['addressBook'];
  currentCurrency: string;
  preferences: {
    privacyMode: PreferencesControllerState['preferences']['privacyMode'];
    tokenNetworkFilter: string[];
  };
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  custodyAccountDetails: {
    [address: string]: {
      custodianName: string;
    };
  };
  ///: END:ONLY_INCLUDE_IF
};

/**
 * {@link MetaMetricsController}'s metadata.
 *
 * This allows us to choose if fields of the state should be persisted or not
 * using the `persist` flag; and if they can be sent to Sentry or not, using
 * the `anonymous` flag.
 */
const controllerMetadata = {
  metaMetricsId: {
    persist: true,
    anonymous: true,
  },
  participateInMetaMetrics: {
    persist: true,
    anonymous: true,
  },
  latestNonAnonymousEventTimestamp: {
    persist: true,
    anonymous: true,
  },
  fragments: {
    persist: true,
    anonymous: false,
  },
  eventsBeforeMetricsOptIn: {
    persist: true,
    anonymous: false,
  },
  traits: {
    persist: true,
    anonymous: false,
  },
  previousUserTraits: {
    persist: true,
    anonymous: false,
  },
  dataCollectionForMarketing: {
    persist: true,
    anonymous: false,
  },
  marketingCampaignCookieId: {
    persist: true,
    anonymous: true,
  },
  segmentApiCalls: {
    persist: true,
    anonymous: false,
  },
};

/**
 * The state that MetaMetricsController stores.
 *
 * @property metaMetricsId - The user's metaMetricsId that will be attached to all non-anonymized event payloads
 * @property participateInMetaMetrics - The user's preference for participating in the MetaMetrics analytics program.
 * This setting controls whether or not events are tracked
 * @property latestNonAnonymousEventTimestamp - The timestamp at which last non anonymous event is tracked.
 * @property fragments - Object keyed by UUID with stored fragments as values.
 * @property eventsBeforeMetricsOptIn - Array of queued events added before a user opts into metrics.
 * @property traits - Traits that are not derived from other state keys.
 * @property previousUserTraits - The user traits the last time they were computed.
 * @property dataCollectionForMarketing - Flag to determine if data collection for marketing is enabled.
 * @property marketingCampaignCookieId - The marketing campaign cookie id.
 * @property segmentApiCalls - Object keyed by messageId with segment event type and payload as values.
 */
export type MetaMetricsControllerState = {
  metaMetricsId: string | null;
  participateInMetaMetrics: boolean | null;
  latestNonAnonymousEventTimestamp: number;
  fragments: Record<string, MetaMetricsEventFragment>;
  eventsBeforeMetricsOptIn: MetaMetricsEventPayload[];
  traits: MetaMetricsUserTraits;
  previousUserTraits?: MetaMetricsUserTraits;
  dataCollectionForMarketing: boolean | null;
  marketingCampaignCookieId: string | null;
  segmentApiCalls: Record<
    string,
    {
      eventType: SegmentEventType;
      payload: SegmentEventPayload;
    }
  >;
};

/**
 * Returns the state of the {@link MetaMetricsController}.
 */
export type MetaMetricsControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  MetaMetricsControllerState
>;

/**
 * Actions exposed by the {@link MetaMetricsController}.
 */
export type MetaMetricsControllerActions = MetaMetricsControllerGetStateAction;

/**
 * Event emitted when the state of the {@link MetaMetricsController} changes.
 */
export type MetaMetricsControllerStateChangeEvent = ControllerStateChangeEvent<
  typeof controllerName,
  MetaMetricsControllerState
>;

export type MetaMetricsControllerEvents = MetaMetricsControllerStateChangeEvent;

/**
 * Actions that this controller is allowed to call.
 */
export type AllowedActions =
  | PreferencesControllerGetStateAction
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction;

/**
 * Events that this controller is allowed to subscribe.
 */
export type AllowedEvents =
  | PreferencesControllerStateChangeEvent
  | NetworkControllerNetworkDidChangeEvent;

/**
 * Messenger type for the {@link MetaMetricsController}.
 */
export type MetaMetricsControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  MetaMetricsControllerActions | AllowedActions,
  MetaMetricsControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

type CaptureException =
  | typeof sentryCaptureException
  | ((err: unknown) => void);

export type MetaMetricsControllerOptions = {
  state?: Partial<MetaMetricsControllerState>;
  messenger: MetaMetricsControllerMessenger;
  segment: Analytics;
  version: string;
  environment: string;
  extension: Browser;
  captureException?: CaptureException;
};

/**
 * Function to get default state of the {@link MetaMetricsController}.
 */
export const getDefaultMetaMetricsControllerState =
  (): MetaMetricsControllerState => ({
    participateInMetaMetrics: null,
    metaMetricsId: null,
    dataCollectionForMarketing: null,
    marketingCampaignCookieId: null,
    latestNonAnonymousEventTimestamp: 0,
    eventsBeforeMetricsOptIn: [],
    traits: {},
    previousUserTraits: {},
    fragments: {},
    segmentApiCalls: {},
  });

export default class MetaMetricsController extends BaseController<
  typeof controllerName,
  MetaMetricsControllerState,
  MetaMetricsControllerMessenger
> {
  #captureException: CaptureException;

  chainId: Hex;

  locale: string;

  version: MetaMetricsControllerOptions['version'];

  #extension: MetaMetricsControllerOptions['extension'];

  #environment: MetaMetricsControllerOptions['environment'];

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  #selectedAddress: PreferencesControllerState['selectedAddress'];
  ///: END:ONLY_INCLUDE_IF

  #segment: MetaMetricsControllerOptions['segment'];

  /**
   * @param options
   * @param options.state - Initial controller state.
   * @param options.messenger - Messenger used to communicate with BaseV2 controller.
   * @param options.segment - an instance of analytics for tracking
   * events that conform to the new MetaMetrics tracking plan.
   * @param options.version - The version of the extension
   * @param options.environment - The environment the extension is running in
   * @param options.extension - webextension-polyfill
   * @param options.captureException
   */
  constructor({
    state = {},
    messenger,
    segment,
    version,
    environment,
    extension,
    captureException = defaultCaptureException,
  }: MetaMetricsControllerOptions) {
    super({
      name: controllerName,
      metadata: controllerMetadata,
      state: {
        ...getDefaultMetaMetricsControllerState(),
        ...state,
      },
      messenger,
    });

    this.#captureException = (err: unknown) => {
      const message = getErrorMessage(err);
      // This is a temporary measure. Currently there are errors flooding sentry due to a problem in how we are tracking anonymousId
      // We intend on removing this as soon as we understand how to correctly solve that problem.
      if (!exceptionsToFilter[message]) {
        captureException(err);
      }
    };
    this.chainId = this.#getCurrentChainId();
    const preferencesControllerState = this.messagingSystem.call(
      'PreferencesController:getState',
    );
    this.locale = preferencesControllerState.currentLocale.replace('_', '-');
    this.version =
      environment === 'production' ? version : `${version}-${environment}`;
    this.#extension = extension;
    this.#environment = environment;

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    this.#selectedAddress = preferencesControllerState.selectedAddress;
    ///: END:ONLY_INCLUDE_IF

    const abandonedFragments = omitBy(state.fragments, 'persist');

    this.messagingSystem.subscribe(
      'PreferencesController:stateChange',
      ({ currentLocale }) => {
        this.locale = currentLocale?.replace('_', '-');
      },
    );

    this.messagingSystem.subscribe(
      'NetworkController:networkDidChange',
      ({ selectedNetworkClientId }) => {
        this.chainId = this.#getCurrentChainId(selectedNetworkClientId);
      },
    );
    this.#segment = segment;

    // Track abandoned fragments that weren't properly cleaned up.
    // Abandoned fragments are those that were stored in persistent memory
    // and are available at controller instance creation, but do not have the
    // 'persist' flag set. This means anytime the extension is unlocked, any
    // fragments that are not marked as persistent will be purged and the
    // failure event will be emitted.
    Object.values(abandonedFragments).forEach((fragment) => {
      this.processAbandonedFragment(fragment);
    });

    // Code below submits any pending segmentApiCalls to Segment if/when the controller is re-instantiated
    if (isManifestV3) {
      Object.values(state.segmentApiCalls || {}).forEach(
        ({ eventType, payload }) => {
          try {
            this.#submitSegmentAPICall(eventType, payload);
          } catch (error) {
            this.#captureException(error);
          }
        },
      );
    }

    // Close out event fragments that were created but not progressed. An
    // interval is used to routinely check if a fragment has not been updated
    // within the fragment's timeout window. When creating a new event fragment
    // a timeout can be specified that will cause an abandoned event to be
    // tracked if the event isn't progressed within that amount of time.
    if (isManifestV3) {
      /* eslint-disable no-undef */
      this.#extension.alarms.getAll().then((alarms) => {
        const hasAlarm = checkAlarmExists(
          alarms,
          METAMETRICS_FINALIZE_EVENT_FRAGMENT_ALARM,
        );

        if (!hasAlarm) {
          this.#extension.alarms.create(
            METAMETRICS_FINALIZE_EVENT_FRAGMENT_ALARM,
            {
              delayInMinutes: 1,
              periodInMinutes: 1,
            },
          );
        }
      });
      this.#extension.alarms.onAlarm.addListener((alarmInfo) => {
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

  /**
   * Gets the current chain ID.
   *
   * @param networkClientId - The network client ID to get the chain ID for.
   */
  #getCurrentChainId(networkClientId?: NetworkClientId): Hex {
    const selectedNetworkClientId =
      networkClientId ||
      this.messagingSystem.call('NetworkController:getState')
        .selectedNetworkClientId;
    const {
      configuration: { chainId },
    } = this.messagingSystem.call(
      'NetworkController:getNetworkClientById',
      selectedNetworkClientId,
    );
    return chainId;
  }

  finalizeAbandonedFragments(): void {
    Object.values(this.state.fragments).forEach((fragment) => {
      if (
        fragment.timeout &&
        fragment.lastUpdated &&
        Date.now() - fragment.lastUpdated / 1000 > fragment.timeout
      ) {
        this.processAbandonedFragment(fragment);
      }
    });
  }

  generateMetaMetricsId(): string {
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
   * @param options - Fragment settings and properties to initiate the fragment with.
   */
  createEventFragment(
    options: Omit<MetaMetricsEventFragment, 'id'>,
  ): MetaMetricsEventFragment {
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

    const { fragments } = this.state;

    const id = options.uniqueIdentifier ?? uuidv4();
    const fragment = {
      id,
      ...options,
      lastUpdated: Date.now(),
    };

    /**
     * HACK: "transaction-submitted-<id>" fragment hack
     * A "transaction-submitted-<id>" fragment may exist following the "Transaction Added"
     * event to persist accumulated event fragment props to the "Transaction Submitted" event
     * which fires after a user confirms a transaction. Rejecting a confirmation does not fire the
     * "Transaction Submitted" event. In this case, these abandoned fragments will be deleted
     * instead of finalized with canDeleteIfAbandoned set to true.
     */
    const hasExistingSubmittedFragment =
      options.initialEvent === TransactionMetaMetricsEvent.submitted &&
      fragments[id];

    const additionalFragmentProps = hasExistingSubmittedFragment
      ? {
          ...fragments[id],
          canDeleteIfAbandoned: false,
        }
      : {};

    this.update((state) => {
      // @ts-expect-error this is caused by a bug in Immer, not being able to handle recursive types like Json
      state.fragments[id] = merge(additionalFragmentProps, fragment);
    });

    if (fragment.initialEvent) {
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
   * @param id - id of fragment to retrieve
   */
  getEventFragmentById(id: string): MetaMetricsEventFragment {
    return this.state.fragments[id];
  }

  /**
   * Deletes to finalizes event fragment based on the canDeleteIfAbandoned property.
   *
   * @param fragment
   */
  processAbandonedFragment(fragment: MetaMetricsEventFragment): void {
    if (fragment.canDeleteIfAbandoned) {
      this.deleteEventFragment(fragment.id);
    } else {
      this.finalizeEventFragment(fragment.id, { abandoned: true });
    }
  }

  /**
   * Updates an event fragment in state
   *
   * @param id - The fragment id to update
   * @param payload - Fragment settings and properties to initiate the fragment with.
   */
  updateEventFragment(
    id: string,
    payload: Partial<MetaMetricsEventFragment>,
  ): void {
    const { fragments } = this.state;

    const fragment = fragments[id];

    /**
     * HACK: "transaction-submitted-<id>" fragment hack
     * Creates a "transaction-submitted-<id>" fragment if it does not exist to persist
     * accumulated event metrics. In the case it is unused, the abandoned fragment will
     * eventually be deleted with canDeleteIfAbandoned set to true.
     */
    const createIfNotFound = !fragment && id.includes('transaction-submitted-');

    if (createIfNotFound) {
      this.update((state) => {
        state.fragments[id] = {
          canDeleteIfAbandoned: true,
          category: MetaMetricsEventCategory.Transactions,
          successEvent: TransactionMetaMetricsEvent.finalized,
          id,
          ...payload,
          lastUpdated: Date.now(),
        };
      });
      return;
    } else if (!fragment) {
      throw new Error(`Event fragment with id ${id} does not exist.`);
    }

    this.update((state) => {
      state.fragments[id] = merge(state.fragments[id], {
        ...payload,
        lastUpdated: Date.now(),
      });
    });
  }

  /**
   * Deletes an event fragment from state
   *
   * @param id - The fragment id to delete
   */
  deleteEventFragment(id: string): void {
    if (this.state.fragments[id]) {
      this.update((state) => {
        delete state.fragments[id];
      });
    }
  }

  /**
   * Finalizes a fragment, tracking either a success event or failure Event
   * and then removes the fragment from state.
   *
   * @param id - UUID of the event fragment to be closed
   * @param options
   * @param options.abandoned - if true track the failure event instead of the success event
   * @param options.page - page the final event occurred on. This will override whatever is set on the fragment
   * @param options.referrer - Dapp that originated the fragment. This is for fallback only, the fragment referrer
   * property will take precedence.
   */
  finalizeEventFragment(
    id: string,
    {
      abandoned = false,
      page,
      referrer,
    }: {
      abandoned?: boolean;
      page?: MetaMetricsPageObject;
      referrer?: MetaMetricsReferrerObject;
    } = {},
  ): void {
    const fragment = this.state.fragments[id];
    if (!fragment) {
      throw new Error(`Funnel with id ${id} does not exist.`);
    }

    const eventName = abandoned ? fragment.failureEvent : fragment.successEvent;

    this.trackEvent({
      event: eventName ?? '',
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
    this.update((state) => {
      delete state.fragments[id];
    });
  }

  /**
   * Calls this._identify with validated metaMetricsId and user traits if user is participating
   * in the MetaMetrics analytics program
   *
   * @param userTraits
   */
  identify(userTraits: Partial<MetaMetricsUserTraits>): void {
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

    const allValidTraits = this.#buildValidTraits(userTraits);

    this.#identify(allValidTraits);
  }

  // It sets an uninstall URL ("Sorry to see you go!" page),
  // which is opened if a user uninstalls the extension.
  updateExtensionUninstallUrl(
    participateInMetaMetrics: boolean,
    metaMetricsId: string,
  ): void {
    const query: {
      mmi?: string;
      env?: string;
      av?: string;
    } = {};
    if (participateInMetaMetrics) {
      // We only want to track these things if a user opted into metrics.
      query.mmi = Buffer.from(metaMetricsId).toString('base64');
      query.env = this.#environment;
      query.av = this.version;
    }
    const queryString = new URLSearchParams(query);

    // this.extension not currently defined in tests
    if (this.#extension && this.#extension.runtime) {
      this.#extension.runtime.setUninstallURL(
        `${EXTENSION_UNINSTALL_URL}?${queryString}`,
      );
    }
  }

  /**
   * Setter for the `participateInMetaMetrics` property
   *
   * @param participateInMetaMetrics - Whether or not the user wants to participate in MetaMetrics if not set
   * @returns The string of the new metametrics id, or null
   */
  async setParticipateInMetaMetrics(
    participateInMetaMetrics: boolean,
  ): Promise<string | null> {
    const { metaMetricsId: existingMetaMetricsId } = this.state;

    const metaMetricsId =
      participateInMetaMetrics && !existingMetaMetricsId
        ? this.generateMetaMetricsId()
        : existingMetaMetricsId;

    this.update((state) => {
      state.participateInMetaMetrics = participateInMetaMetrics;
      state.metaMetricsId = metaMetricsId;
    });

    if (participateInMetaMetrics) {
      this.trackEventsAfterMetricsOptIn();
      this.clearEventsAfterMetricsOptIn();
    } else if (this.state.marketingCampaignCookieId) {
      this.setMarketingCampaignCookieId(null);
    }

    ///: BEGIN:ONLY_INCLUDE_IF(build-main)
    if (
      this.#environment !== ENVIRONMENT.DEVELOPMENT &&
      metaMetricsId !== null
    ) {
      this.updateExtensionUninstallUrl(participateInMetaMetrics, metaMetricsId);
    }
    ///: END:ONLY_INCLUDE_IF

    return metaMetricsId;
  }

  setDataCollectionForMarketing(
    dataCollectionForMarketing: boolean,
  ): MetaMetricsControllerState['metaMetricsId'] {
    const { metaMetricsId } = this.state;

    this.update((state) => {
      state.dataCollectionForMarketing = dataCollectionForMarketing;
    });

    if (!dataCollectionForMarketing && this.state.marketingCampaignCookieId) {
      this.setMarketingCampaignCookieId(null);
    }

    return metaMetricsId;
  }

  setMarketingCampaignCookieId(marketingCampaignCookieId: string | null): void {
    this.update((state) => {
      state.marketingCampaignCookieId = marketingCampaignCookieId;
    });
  }

  /**
   * track a page view with Segment
   *
   * @param payload - details of the page viewed.
   * @param options - options for handling the page view.
   */
  trackPage(
    payload: MetaMetricsPagePayload,
    options?: MetaMetricsPageOptions,
  ): void {
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

      const { name, params, environmentType, page, referrer, actionId } =
        payload;
      const { metaMetricsId } = this.state;
      const idTrait = metaMetricsId ? 'userId' : 'anonymousId';
      const idValue = metaMetricsId ?? METAMETRICS_ANONYMOUS_ID;
      this.#submitSegmentAPICall('page', {
        messageId: buildUniqueMessageId({ actionId }),
        [idTrait]: idValue,
        name,
        properties: {
          params,
          locale: this.locale,
          chain_id: this.chainId,
          environment_type: environmentType,
        },
        context: this.#buildContext(referrer, page),
      });
    } catch (err) {
      this.#captureException(err);
    }
  }

  /**
   * submits a metametrics event, not waiting for it to complete or allowing its error to bubble up
   *
   * @param payload - details of the event
   * @param options - options for handling/routing the event
   */
  trackEvent(
    payload: MetaMetricsEventPayload,
    options?: MetaMetricsEventOptions,
  ): void {
    // validation is not caught and handled
    this.#validatePayload(payload);
    this.#submitEvent(payload, options).catch((err) => {
      this.#captureException(err);
    });
  }

  /**
   * submits (or queues for submission) a metametrics event, performing necessary payload manipulation and
   * routing the event to the appropriate segment source. Will split events
   * with sensitiveProperties into two events, tracking the sensitiveProperties
   * with the anonymousId only.
   *
   * @param payload - details of the event
   * @param options - options for handling/routing the event
   */
  async #submitEvent(
    payload: MetaMetricsEventPayload,
    options?: MetaMetricsEventOptions,
  ): Promise<void> {
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
        // @ts-expect-error This property may not exist. We check for it below.
        overrideAnonymousEventNames[`${payload.event}`];
      const anonymousPayload = {
        ...payload,
        event: anonymousEventName ?? payload.event,
      };

      const combinedProperties = merge(
        { ...anonymousPayload.sensitiveProperties },
        { ...anonymousPayload.properties },
      );

      events.push(
        this.#track(
          this.#buildEventPayload({
            ...anonymousPayload,
            properties: combinedProperties,
            isDuplicateAnonymizedEvent: true,
          }),
          { ...options, excludeMetaMetricsId: true },
        ),
      );
    }

    events.push(this.#track(this.#buildEventPayload(payload), options));

    await Promise.all(events);
  }

  /**
   * validates a metametrics event
   *
   * @param payload - details of the event
   */
  #validatePayload(payload: MetaMetricsEventPayload): void {
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

  handleMetaMaskStateUpdate(newState: MetaMaskState): void {
    const userTraits = this._buildUserTraitsObject(newState);
    if (userTraits) {
      this.identify(userTraits);
    }
  }

  // Track all queued events after a user opted into metrics.
  trackEventsAfterMetricsOptIn(): void {
    const { eventsBeforeMetricsOptIn } = this.state;
    eventsBeforeMetricsOptIn.forEach((eventBeforeMetricsOptIn) => {
      this.trackEvent(eventBeforeMetricsOptIn);
    });
  }

  // Once we track queued events after a user opts into metrics, we want to clear the event queue.
  clearEventsAfterMetricsOptIn(): void {
    this.update((state) => {
      state.eventsBeforeMetricsOptIn = [];
    });
  }

  // It adds an event into a queue, which is only tracked if a user opts into metrics.
  addEventBeforeMetricsOptIn(event: MetaMetricsEventPayload): void {
    this.update((state) => {
      state.eventsBeforeMetricsOptIn.push(event);
    });
  }

  // Add or update traits for tracking.
  updateTraits(newTraits: MetaMetricsUserTraits): void {
    this.update((state) => {
      state.traits = { ...state.traits, ...newTraits };
    });
  }

  // Retrieve (or generate if doesn't exist) the client metametrics id
  getMetaMetricsId(): string {
    let { metaMetricsId } = this.state;
    if (!metaMetricsId) {
      metaMetricsId = this.generateMetaMetricsId();
      this.update((state) => {
        state.metaMetricsId = metaMetricsId;
      });
    }
    return metaMetricsId;
  }

  /** PRIVATE METHODS */

  /**
   * Build the context object to attach to page and track events.
   *
   * @private
   * @param referrer - dapp origin that initialized
   * the notification window.
   * @param page - page object describing the current
   * view of the extension. Defaults to the background-process object.
   */
  #buildContext(
    referrer: MetaMetricsContext['referrer'],
    page: MetaMetricsContext['page'] = METAMETRICS_BACKGROUND_PAGE_OBJECT,
  ): MetaMetricsContext {
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    const mmiProps: {
      extensionId?: string;
    } = {};

    if (this.#extension?.runtime?.id) {
      mmiProps.extensionId = this.#extension.runtime.id;
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
      marketingCampaignCookieId: this.state.marketingCampaignCookieId,
    };
  }

  /**
   * Build's the event payload, processing all fields into a format that can be
   * fed to Segment's track method
   *
   * @private
   * @param rawPayload - raw payload provided to trackEvent
   * @returns formatted event payload for segment
   */
  #buildEventPayload(
    rawPayload: Omit<MetaMetricsEventPayload, 'sensitiveProperties'>,
  ): SegmentEventPayload {
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
    const mmiProps: {
      extensionId?: string;
      accountAddress?: string;
    } = {};

    if (this.#extension?.runtime?.id) {
      mmiProps.extensionId = this.#extension.runtime.id;
    }

    if (this.#selectedAddress) {
      mmiProps.accountAddress = this.#selectedAddress;
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
        chain_id:
          properties &&
          'chain_id' in properties &&
          typeof properties.chain_id === 'string'
            ? properties.chain_id
            : this.chainId,
        environment_type: environmentType,
        ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
        ...mmiProps,
        ///: END:ONLY_INCLUDE_IF
      },
      context: this.#buildContext(referrer, page),
    };
  }

  /**
   * This method generates the MetaMetrics user traits object, omitting any
   * traits that have not changed since the last invocation of this method.
   *
   * @param metamaskState - Full metamask state object.
   * @returns traits that have changed since last update
   */
  _buildUserTraitsObject(
    metamaskState: MetaMaskState,
  ): Partial<MetaMetricsUserTraits> | null {
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    const mmiAccountAddress =
      metamaskState.custodyAccountDetails &&
      Object.keys(metamaskState.custodyAccountDetails).length
        ? Object.keys(metamaskState.custodyAccountDetails)[0]
        : null;
    ///: END:ONLY_INCLUDE_IF
    const { traits, previousUserTraits } = this.state;

    const currentTraits = {
      [MetaMetricsUserTrait.AddressBookEntries]: sum(
        Object.values(metamaskState.addressBook).map(size),
      ),
      [MetaMetricsUserTrait.InstallDateExt]:
        traits[MetaMetricsUserTrait.InstallDateExt] || '',
      [MetaMetricsUserTrait.LedgerConnectionType]:
        metamaskState.ledgerTransportType,
      [MetaMetricsUserTrait.NetworksAdded]: Object.values(
        metamaskState.networkConfigurationsByChainId,
      ).map((networkConfiguration) => networkConfiguration.chainId),
      [MetaMetricsUserTrait.NetworksWithoutTicker]: Object.values(
        metamaskState.networkConfigurationsByChainId,
      )
        .filter(({ nativeCurrency }) => !nativeCurrency)
        .map(({ chainId }) => chainId),
      [MetaMetricsUserTrait.NftAutodetectionEnabled]:
        metamaskState.useNftDetection,
      [MetaMetricsUserTrait.NumberOfAccounts]: Object.values(
        metamaskState.internalAccounts.accounts,
      ).length,
      [MetaMetricsUserTrait.NumberOfNftCollections]:
        this.#getAllUniqueNFTAddressesLength(metamaskState.allNfts),
      [MetaMetricsUserTrait.NumberOfNfts]: this.#getAllNFTsFlattened(
        metamaskState.allNfts,
      ).length,
      [MetaMetricsUserTrait.NumberOfTokens]: this.#getNumberOfTokens(
        metamaskState.allTokens,
      ),
      [MetaMetricsUserTrait.OpenSeaApiEnabled]: metamaskState.openSeaEnabled,
      [MetaMetricsUserTrait.ThreeBoxEnabled]: false, // deprecated, hard-coded as false
      [MetaMetricsUserTrait.Theme]: metamaskState.theme || 'default',
      [MetaMetricsUserTrait.TokenDetectionEnabled]:
        metamaskState.useTokenDetection,
      [MetaMetricsUserTrait.ShowNativeTokenAsMainBalance]:
        metamaskState.ShowNativeTokenAsMainBalance,
      [MetaMetricsUserTrait.CurrentCurrency]: metamaskState.currentCurrency,
      ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
      [MetaMetricsUserTrait.MmiExtensionId]: this.#extension?.runtime?.id,
      [MetaMetricsUserTrait.MmiAccountAddress]: mmiAccountAddress ?? null,
      [MetaMetricsUserTrait.MmiIsCustodian]: Boolean(mmiAccountAddress),
      ///: END:ONLY_INCLUDE_IF
      [MetaMetricsUserTrait.SecurityProviders]:
        metamaskState.securityAlertsEnabled ? ['blockaid'] : [],
      [MetaMetricsUserTrait.PetnameAddressCount]:
        this.#getPetnameAddressCount(metamaskState),
      [MetaMetricsUserTrait.IsMetricsOptedIn]:
        metamaskState.participateInMetaMetrics,
      [MetaMetricsUserTrait.HasMarketingConsent]:
        metamaskState.dataCollectionForMarketing,
      [MetaMetricsUserTrait.TokenSortPreference]:
        metamaskState.tokenSortConfig?.key || '',
      [MetaMetricsUserTrait.PrivacyModeEnabled]:
        metamaskState.preferences.privacyMode,
      [MetaMetricsUserTrait.NetworkFilterPreference]: Object.keys(
        metamaskState.preferences.tokenNetworkFilter || {},
      ),
    };

    if (!previousUserTraits) {
      this.update((state) => {
        state.previousUserTraits = currentTraits;
      });
      return currentTraits;
    }

    if (previousUserTraits && !isEqual(previousUserTraits, currentTraits)) {
      const updates = pickBy(currentTraits, (v, k) => {
        // @ts-expect-error It's okay that `k` may not be a key of `previousUserTraits`, because we assume `isEqual` can handle it
        const previous = previousUserTraits[k];
        return !isEqual(previous, v);
      });
      this.update((state) => {
        state.previousUserTraits = currentTraits;
      });
      return updates;
    }

    return null;
  }

  /**
   * Returns a new object of all valid user traits. For dates, we transform them into ISO-8601 timestamp strings.
   *
   * @see {@link https://segment.com/docs/connections/spec/common/#timestamps}
   * @param userTraits
   */
  #buildValidTraits(
    userTraits: Partial<MetaMetricsUserTraits>,
  ): MetaMetricsUserTraits {
    return Object.entries(userTraits).reduce(
      (validTraits: MetaMetricsUserTraits, [key, value]) => {
        if (this.#isValidTraitDate(value)) {
          return {
            ...validTraits,
            [key]: value.toISOString(),
          };
        } else if (this.#isValidTrait(value)) {
          return {
            ...validTraits,
            [key]: value,
          };
        }

        console.warn(
          `MetaMetricsController: "${key}" value is not a valid trait type`,
        );
        return validTraits;
      },
      {},
    );
  }

  /**
   * Returns an array of all of the NFTs the user
   * possesses across all networks and accounts.
   *
   * @param allNfts
   */
  #getAllNFTsFlattened = memoize((allNfts: MetaMaskState['allNfts'] = {}) => {
    return Object.values(allNfts).reduce((result: Nft[], chainNFTs) => {
      return result.concat(...Object.values(chainNFTs));
    }, []);
  });

  /**
   * Returns the number of unique NFT addresses the user
   * possesses across all networks and accounts.
   *
   * @param allNfts
   */
  #getAllUniqueNFTAddressesLength(
    allNfts: MetaMaskState['allNfts'] = {},
  ): number {
    const allNFTAddresses = this.#getAllNFTsFlattened(allNfts).map(
      (nft) => nft.address,
    );
    const uniqueAddresses = new Set(allNFTAddresses);
    return uniqueAddresses.size;
  }

  /**
   * @param allTokens
   * @returns number of unique token addresses
   */
  #getNumberOfTokens(allTokens: MetaMaskState['allTokens']): number {
    return Object.values(allTokens).reduce((result, accountsByChain) => {
      return result + sum(Object.values(accountsByChain).map(size));
    }, 0);
  }

  /**
   * Calls segment.identify with given user traits
   *
   * @see {@link https://segment.com/docs/connections/sources/catalog/libraries/server/node/#identify}
   * @param userTraits
   */
  #identify(userTraits: MetaMetricsUserTraits): void {
    const { metaMetricsId } = this.state;

    if (!userTraits || Object.keys(userTraits).length === 0) {
      console.warn('MetaMetricsController#_identify: No userTraits found');
      return;
    }

    try {
      this.#submitSegmentAPICall('identify', {
        userId: metaMetricsId ?? undefined,
        traits: userTraits,
      });
    } catch (err) {
      this.#captureException(err);
    }
  }

  /**
   * Validates the trait value. Segment accepts any data type. We are adding validation here to
   * support data types for our Segment destination(s) e.g. MixPanel
   *
   * @param value
   */
  #isValidTrait(value: unknown): boolean {
    const type = typeof value;

    return (
      type === 'string' ||
      type === 'boolean' ||
      type === 'number' ||
      this.#isValidTraitArray(value) ||
      this.#isValidTraitDate(value)
    );
  }

  /**
   * Segment accepts any data type value. We have special logic to validate arrays.
   *
   * @param value
   */
  #isValidTraitArray(value: unknown): boolean {
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
  }

  /**
   * Returns true if the value is an accepted date type
   *
   * @param value
   */
  #isValidTraitDate(value: unknown): value is Date {
    return Object.prototype.toString.call(value) === '[object Date]';
  }

  /**
   * Perform validation on the payload and update the id type to use before
   * sending to Segment. Also examines the options to route and handle the
   * event appropriately.
   *
   * @private
   * @param payload - properties to attach to event
   * @param options - options for routing and handling the event
   */
  #track(
    payload: SegmentEventPayload,
    options?: MetaMetricsEventOptions,
  ): Promise<void> {
    const {
      isOptIn,
      metaMetricsId: metaMetricsIdOverride,
      matomoEvent,
      flushImmediately,
    } = options || {};
    let idType: 'userId' | 'anonymousId' = 'userId';
    let idValue = this.state.metaMetricsId;
    let excludeMetaMetricsId = options?.excludeMetaMetricsId ?? false;
    // This is carried over from the old implementation, and will likely need
    // to be updated to work with the new tracking plan. I think we should use
    // a config setting for this instead of trying to match the event name
    const isSendFlow = Boolean(payload.event.match(/^send|^confirm/iu));
    // do not filter if excludeMetaMetricsId is explicitly set to false
    if (options?.excludeMetaMetricsId !== false && isSendFlow) {
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
    payload[idType] = idValue ?? undefined;

    // If this is an event on the old matomo schema, add a key to the payload
    // to designate it as such
    if (matomoEvent === true) {
      payload.properties.legacy_event = true;
    }

    // Promises will only resolve when the event is sent to segment. For any
    // event that relies on this promise being fulfilled before performing UI
    // updates, or otherwise delaying user interaction, supply the
    // 'flushImmediately' flag to the trackEvent method.
    return new Promise<void>((resolve, reject) => {
      const callback = (err: unknown) => {
        if (err) {
          const message = isErrorWithMessage(err) ? err.message : '';
          const stack = isErrorWithStack(err) ? err.stack : undefined;
          // The error that segment gives us has some manipulation done to it
          // that seemingly breaks with lockdown enabled. Creating a new error
          // here prevents the system from freezing when the network request to
          // segment fails for any reason.
          const safeError = new Error(message);
          if (stack) {
            safeError.stack = stack;
          }
          return reject(safeError);
        }
        return resolve();
      };

      this.#submitSegmentAPICall('track', payload, callback);
      if (flushImmediately) {
        this.#segment.flush();
      }
    });
  }

  /*
   * Method below submits the request to analytics SDK.
   * It will also add event to controller store
   * and pass a callback to remove it from store once request is submitted to segment
   * Saving segmentApiCalls in controller store in MV3 ensures that events are tracked
   * even if service worker terminates before events are submitted to segment.
   */
  #submitSegmentAPICall(
    eventType: SegmentEventType,
    payload: Partial<SegmentEventPayload>,
    callback?: (result: unknown) => unknown,
  ): void {
    const {
      metaMetricsId,
      participateInMetaMetrics,
      latestNonAnonymousEventTimestamp,
    } = this.state;
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
    const modifiedPayload = {
      ...payload,
      messageId,
      timestamp,
    };
    this.update((state) => {
      state.latestNonAnonymousEventTimestamp =
        modifiedPayload.anonymousId === METAMETRICS_ANONYMOUS_ID
          ? latestNonAnonymousEventTimestamp
          : timestamp.valueOf();
      state.segmentApiCalls[messageId] = {
        eventType,
        // @ts-expect-error The reason this is needed is that the event property in the payload can be missing,
        // whereas the state expects it to be present. It's unclear how best to handle this discrepancy.
        payload: {
          ...modifiedPayload,
          timestamp: modifiedPayload.timestamp.toString(),
        },
      };
    });
    const modifiedCallback = (result: unknown) => {
      this.update((state) => {
        delete state.segmentApiCalls[messageId];
      });
      return callback?.(result);
    };
    this.#segment[eventType](modifiedPayload, modifiedCallback);
  }

  /**
   * Returns the total number of Ethereum addresses with saved petnames,
   * including all chain ID variations.
   *
   * @param metamaskState
   */
  #getPetnameAddressCount(metamaskState: MetaMaskState): number {
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
