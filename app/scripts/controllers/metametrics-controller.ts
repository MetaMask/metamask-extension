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
import { v4 as uuidv4 } from 'uuid';
import { NameType } from '@metamask/name-controller';
import { getErrorMessage } from '@metamask/utils';
import type {
  AnalyticsControllerActions,
  AnalyticsControllerState,
  AnalyticsContext,
  AnalyticsEventProperties,
  AnalyticsTrackingEvent,
  AnalyticsUserTraits,
} from '@metamask/analytics-controller';
import type {
  NetworkClientId,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
  NetworkControllerNetworkDidChangeEvent,
} from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type {
  SeedlessOnboardingControllerGetStateAction,
  SeedlessOnboardingControllerState,
} from '@metamask/seedless-onboarding-controller';
import type { Browser } from 'webextension-polyfill';
import type { Nft } from '@metamask/assets-controllers';
import {
  BaseController,
  type ControllerGetStateAction,
  type ControllerStateChangeEvent,
  type StateMetadata,
} from '@metamask/base-controller';
import type { Messenger } from '@metamask/messenger';
import type { Json, Hex } from '@metamask/utils';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  ENVIRONMENT_TYPE_BACKGROUND,
  PLATFORM_FIREFOX,
} from '../../../shared/constants/app';
import {
  METAMETRICS_BACKGROUND_PAGE_OBJECT,
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../shared/constants/metametrics';
import type {
  MetaMetricsEventFragment,
  MetaMetricsUserTraits,
  SegmentEventPayload,
  MetaMetricsContext,
  MetaMetricsEventPayload,
  MetaMetricsEventOptions,
  MetaMetricsPagePayload,
  MetaMetricsPageObject,
  MetaMetricsReferrerObject,
} from '../../../shared/constants/metametrics';
import { SECOND } from '../../../shared/constants/time';
import { isManifestV3 } from '../../../shared/lib/mv3.utils';
import { METAMETRICS_FINALIZE_EVENT_FRAGMENT_ALARM } from '../../../shared/constants/alarms';
import {
  checkAlarmExists,
  getDeviceType,
  getInstallType,
  getOs,
  getPlatform,
} from '../lib/util';
import { TransactionMetaMetricsEvent } from '../../../shared/constants/transaction';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import {
  trace,
  endTrace,
  type TraceRequest,
  type EndTraceRequest,
  type TraceCallback,
} from '../../../shared/lib/trace';
import { ENVIRONMENT } from '../../../shared/constants/build';
import { KeyringType } from '../../../shared/constants/keyring';
import type { captureException } from '../../../shared/lib/sentry';
import type { FlattenedBackgroundStateProxy } from '../../../shared/types';
import {
  hasABTestAnalyticsMappingForEvent,
  enrichWithABTests,
  getRemoteFeatureFlagsWithManifestOverrides,
} from '../../../shared/lib/ab-testing/ab-test-analytics';
import { getTokensControllerAllTokens } from '../../../shared/lib/selectors/assets-migration';
import { isMain } from '../../../shared/lib/build-types';
import { trackSegmentEventWhileOptedOut } from '../lib/segment/custom-segment-tracking';
import type {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from './preferences-controller';
import { MetaMetricsControllerMethodActions } from './metametrics-controller-method-action-types';
import { ANONYMOUS_EVENT_PROPERTY } from './analytics/platform-adapter';

// Unique name for the controller
const controllerName = 'MetaMetricsController';

const EXTENSION_UNINSTALL_URL = 'https://metamask.io/uninstalled';

const defaultCaptureException = (err: unknown) => {
  // throw error on clean stack so its captured by platform integrations (eg sentry)
  // but does not interrupt the call stack
  setTimeout(() => {
    throw err;
  });
};

const exceptionsToFilter: Record<string, boolean> = {
  [`You must pass either an "anonymousId" or a "userId".`]: true,
};

/**
 * Represents a buffered trace that is stored before user consent.
 * Simplified for JSON serialization - doesn't include callback functions.
 */
type BufferedTrace = {
  type: 'start' | 'end';
  request: Record<string, Json>;
  parentTraceName?: string;
};

export type MetaMaskState = Pick<
  FlattenedBackgroundStateProxy,
  | 'ledgerTransportType'
  | 'networkConfigurationsByChainId'
  | 'internalAccounts'
  | 'allNfts'
  | 'allTokens'
  | 'theme'
  | 'dataCollectionForMarketing'
  | 'useNftDetection'
  | 'openSeaEnabled'
  | 'securityAlertsEnabled'
  | 'useTokenDetection'
  | 'names'
  | 'addressBook'
  | 'currentCurrency'
  | 'srpSessionData'
  | 'keyrings'
  | 'multichainNetworkConfigurationsByChainId'
  | 'firstTimeFlowType'
  // TODO: Remove as this is no longer a top-level property of the flattened background state object.
  // | 'security_providers'
> & {
  preferences: Pick<
    FlattenedBackgroundStateProxy['preferences'],
    | 'privacyMode'
    | 'tokenNetworkFilter'
    | 'showNativeTokenAsMainBalance'
    | 'tokenSortConfig'
  >;
} & {
  /** Legacy fields derived by `MetamaskController.getState()`. */
  participateInMetaMetrics: boolean | null;
  metaMetricsId: string | null;
};

/**
 * {@link MetaMetricsController}'s metadata.
 *
 * This allows us to choose if fields of the state should be persisted or not
 * using the `persist` flag; and if they can be sent to Sentry or not, using
 * the `anonymous` flag.
 */
const controllerMetadata: StateMetadata<MetaMetricsControllerState> = {
  completedMetaMetricsOnboarding: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  latestNonAnonymousEventTimestamp: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: true,
  },
  fragments: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: false,
    usedInUi: true,
  },
  eventsBeforeMetricsOptIn: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: false,
    usedInUi: false,
  },
  tracesBeforeMetricsOptIn: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: false,
    usedInUi: false,
  },
  traits: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: false,
    usedInUi: false,
  },
  dataCollectionForMarketing: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: false,
    usedInUi: true,
  },
  marketingCampaignCookieId: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: false,
  },
};

/**
 * The state that MetaMetricsController stores.
 *
 * @property completedMetaMetricsOnboarding - Whether the user has completed the metrics participation prompt (onboarding/settings).
 * @property latestNonAnonymousEventTimestamp - The timestamp at which the latest analytics event submission was attempted.
 * @property fragments - Object keyed by UUID with stored fragments as values.
 * @property eventsBeforeMetricsOptIn - Array of queued events added before a user opts into metrics.
 * @property tracesBeforeMetricsOptIn - Array of queued traces added before a user opts into metrics.
 * @property traits - Traits that are not derived from other state keys.
 * @property dataCollectionForMarketing - Flag to determine if data collection for marketing is enabled.
 * @property marketingCampaignCookieId - The marketing campaign cookie id.
 */
type SegmentTrackPayload = Omit<
  SegmentEventPayload,
  'properties' | 'timestamp'
> & {
  properties: AnalyticsEventProperties;
  sensitiveProperties?: Record<string, Json>;
};

type SegmentPagePayload = {
  name: string;
  properties: AnalyticsEventProperties;
  context: AnalyticsContext;
};

export type MetaMetricsControllerState = {
  completedMetaMetricsOnboarding: boolean;
  latestNonAnonymousEventTimestamp: number;
  fragments: Record<string, MetaMetricsEventFragment>;
  eventsBeforeMetricsOptIn: MetaMetricsEventPayload[];
  tracesBeforeMetricsOptIn: BufferedTrace[];
  traits: MetaMetricsUserTraits;
  dataCollectionForMarketing: boolean | null;
  marketingCampaignCookieId: string | null;
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
export type MetaMetricsControllerActions =
  | MetaMetricsControllerGetStateAction
  | MetaMetricsControllerMethodActions;

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
  | NetworkControllerGetNetworkClientByIdAction
  | RemoteFeatureFlagControllerGetStateAction
  | SeedlessOnboardingControllerGetStateAction
  | AnalyticsControllerActions;

/**
 * Events that this controller is allowed to subscribe.
 */
export type AllowedEvents =
  | PreferencesControllerStateChangeEvent
  | NetworkControllerNetworkDidChangeEvent;

/**
 * Messenger type for the {@link MetaMetricsController}.
 */
export type MetaMetricsControllerMessenger = Messenger<
  typeof controllerName,
  MetaMetricsControllerActions | AllowedActions,
  MetaMetricsControllerEvents | AllowedEvents
>;

type CaptureException = typeof captureException | ((err: unknown) => void);

export type MetaMetricsControllerOptions = {
  state?: Partial<MetaMetricsControllerState>;
  messenger: MetaMetricsControllerMessenger;
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
    completedMetaMetricsOnboarding: false,
    dataCollectionForMarketing: null,
    marketingCampaignCookieId: null,
    latestNonAnonymousEventTimestamp: 0,
    eventsBeforeMetricsOptIn: [],
    tracesBeforeMetricsOptIn: [],
    traits: {},
    fragments: {},
  });

const MESSENGER_EXPOSED_METHODS = [
  'addEventBeforeMetricsOptIn',
  'addTraceBeforeMetricsOptIn',
  'bufferedEndTrace',
  'bufferedTrace',
  'clearEventsAfterMetricsOptIn',
  'clearTracesAfterMetricsOptIn',
  'createEventFragment',
  'deleteEventFragment',
  'finalizeAbandonedFragments',
  'finalizeEventFragment',
  'getEventFragmentById',
  'getMetaMetricsId',
  'handleMetaMaskStateUpdate',
  'identify',
  'processAbandonedFragment',
  'setDataCollectionForMarketing',
  'setMarketingCampaignCookieId',
  'setParticipateInMetaMetrics',
  'trackEvent',
  'trackEventsAfterMetricsOptIn',
  'trackPage',
  'trackTracesAfterMetricsOptIn',
  'updateEventFragment',
  'updateExtensionUninstallUrl',
  'updateTraits',
] as const;

export class MetaMetricsController extends BaseController<
  typeof controllerName,
  MetaMetricsControllerState,
  MetaMetricsControllerMessenger
> {
  #captureException: CaptureException;

  chainId: Hex;

  locale: string;

  previousUserTraits?: MetaMetricsUserTraits;

  version: MetaMetricsControllerOptions['version'];

  #extension: MetaMetricsControllerOptions['extension'];

  #environment: MetaMetricsControllerOptions['environment'];

  #analyticsGetState(): AnalyticsControllerState {
    return this.messenger.call('AnalyticsController:getState');
  }

  /**
   * @param options
   * @param options.state - Initial controller state.
   * @param options.messenger - Messenger used to communicate with BaseV2 controller.
   * @param options.version - The version of the extension
   * @param options.environment - The environment the extension is running in
   * @param options.extension - webextension-polyfill
   * @param options.captureException
   */
  constructor({
    state = {},
    messenger,
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
    const preferencesControllerState = this.messenger.call(
      'PreferencesController:getState',
    );
    this.locale = preferencesControllerState.currentLocale.replace('_', '-');
    this.version =
      environment === 'production' ? version : `${version}-${environment}`;
    this.#extension = extension;
    this.#environment = environment;

    this.messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );

    const abandonedFragments = omitBy(state.fragments, 'persist');

    this.messenger.subscribe(
      'PreferencesController:stateChange',
      ({ currentLocale }) => {
        this.locale = currentLocale?.replace('_', '-');
      },
    );

    this.messenger.subscribe(
      'NetworkController:networkDidChange',
      ({ selectedNetworkClientId }) => {
        this.chainId = this.#getCurrentChainId(selectedNetworkClientId);
      },
    );

    // Track abandoned fragments that weren't properly cleaned up.
    // Abandoned fragments are those that were stored in persistent memory
    // and are available at controller instance creation, but do not have the
    // 'persist' flag set. This means anytime the extension is unlocked, any
    // fragments that are not marked as persistent will be purged and the
    // failure event will be emitted.
    Object.values(abandonedFragments).forEach((fragment) => {
      this.processAbandonedFragment(fragment);
    });

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
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      networkClientId ||
      this.messenger.call('NetworkController:getState').selectedNetworkClientId;
    const {
      configuration: { chainId },
    } = this.messenger.call(
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

  /**
   * Create an event fragment in state and returns the event fragment object.
   *
   * @param options - Fragment settings and properties to initiate the fragment with.
   */
  createEventFragment(
    options: Omit<MetaMetricsEventFragment, 'id'>,
  ): MetaMetricsEventFragment {
    if (!options.successEvent) {
      throw new Error(
        `Must specify success event. Success event was: ${
          options.event
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        }. Payload keys were: ${Object.keys(options)}. ${
          typeof options.properties === 'object'
            ? // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              `Payload property keys were: ${Object.keys(options.properties)}`
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

    const additionalFragmentProps: Partial<MetaMetricsEventFragment> =
      hasExistingSubmittedFragment
        ? {
            ...fragments[id],
            canDeleteIfAbandoned: false,
          }
        : {};

    const mergeEventFragment = merge as (
      ...sources: unknown[]
    ) => MetaMetricsEventFragment;

    this.update((state) => {
      const metaMetricsState = state as unknown as MetaMetricsControllerState;
      metaMetricsState.fragments[id] = mergeEventFragment(
        {},
        additionalFragmentProps,
        fragment,
      );
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
        const metaMetricsState = state as unknown as MetaMetricsControllerState;
        metaMetricsState.fragments[id] = {
          canDeleteIfAbandoned: true,
          category: MetaMetricsEventCategory.Transactions,
          successEvent: TransactionMetaMetricsEvent.finalized,
          id,
          ...payload,
          lastUpdated: Date.now(),
        } as MetaMetricsEventFragment;
      });
      return;
    } else if (!fragment) {
      throw new Error(`Event fragment with id ${id} does not exist.`);
    }

    const mergeEventFragment = merge as (
      ...sources: unknown[]
    ) => MetaMetricsEventFragment;
    this.update((state) => {
      const metaMetricsState = state as unknown as MetaMetricsControllerState;
      metaMetricsState.fragments[id] = mergeEventFragment(
        metaMetricsState.fragments[id],
        {
          ...payload,
          lastUpdated: Date.now(),
        },
      );
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
    });
    this.update((state) => {
      delete state.fragments[id];
    });
  }

  // It sets an uninstall URL ("Sorry to see you go!" page),
  // which is opened if a user uninstalls the extension.
  // This method should only be called after the user has made a decision about MetaMetrics participation.
  updateExtensionUninstallUrl(
    participateInMetaMetrics: boolean,
    metaMetricsId: string,
  ): void {
    const query: {
      mmi?: string;
      env?: string;
      av: string;
    } = {
      av: this.version,
    };
    if (participateInMetaMetrics) {
      // We only want to track these things if a user opted into metrics.
      query.mmi = Buffer.from(metaMetricsId).toString('base64');
      query.env = this.#environment;
    }
    const queryString = new URLSearchParams(query);

    // this.extension not currently defined in tests
    if (this.#extension && this.#extension.runtime) {
      this.#extension.runtime.setUninstallURL(
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
    participateInMetaMetrics: boolean | null,
  ): Promise<string | null> {
    const analyticsId = this.getMetaMetricsId();

    if (participateInMetaMetrics === true) {
      this.messenger.call('AnalyticsController:optIn');
    } else if (participateInMetaMetrics === false) {
      this.messenger.call('AnalyticsController:optOut');
    }

    this.update((state) => {
      state.completedMetaMetricsOnboarding = participateInMetaMetrics !== null;
    });

    if (participateInMetaMetrics) {
      this.trackEventsAfterMetricsOptIn();
      this.clearEventsAfterMetricsOptIn();
      this.trackTracesAfterMetricsOptIn();
      this.clearTracesAfterMetricsOptIn();
    } else {
      if (participateInMetaMetrics === false) {
        // Drop any UI-buffered pre-submit events/traces; they must not be sent after opt-out.
        this.clearEventsAfterMetricsOptIn();
        this.clearTracesAfterMetricsOptIn();
      }
      if (this.state.marketingCampaignCookieId) {
        this.setMarketingCampaignCookieId(null);
      }
    }

    if (
      isMain() &&
      this.#environment !== ENVIRONMENT.DEVELOPMENT &&
      participateInMetaMetrics !== null
    ) {
      this.updateExtensionUninstallUrl(
        participateInMetaMetrics === true,
        analyticsId,
      );
    }

    return analyticsId;
  }

  setDataCollectionForMarketing(dataCollectionForMarketing: boolean): string {
    const { analyticsId } = this.#analyticsGetState();

    this.update((state) => {
      state.dataCollectionForMarketing = dataCollectionForMarketing;
    });

    if (!dataCollectionForMarketing && this.state.marketingCampaignCookieId) {
      this.setMarketingCampaignCookieId(null);
    }

    return analyticsId;
  }

  setMarketingCampaignCookieId(marketingCampaignCookieId: string | null): void {
    this.update((state) => {
      state.marketingCampaignCookieId = marketingCampaignCookieId;
    });
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
    this.#validateTrackEventPayload(payload);

    try {
      if (!this.#canSubmitAnalytics(payload.event)) {
        return;
      }

      const eventPayload = this.#buildTrackEventPayload(payload);

      if (payload.event === MetaMetricsEventName.MetricsOptOut) {
        this.#trackMetricsOptOutEvent(eventPayload);
        return;
      }

      this.#applyAnonymousEventOptions(eventPayload, options);
      this.#applyLegacyEventOptions(eventPayload, options);

      if (!this.#isAnonymousTrackEvent(eventPayload)) {
        this.#updateLatestAnalyticsEventTimestamp();
      }

      const sensitiveProperties = eventPayload.sensitiveProperties ?? {};

      this.messenger.call(
        'AnalyticsController:trackEvent',
        {
          name: eventPayload.event,
          properties: eventPayload.properties,
          sensitiveProperties,
          saveDataRecording: false, // Legacy property that is ignored by the analytics controller and will be removed from the type in the future.
          hasProperties:
            Object.keys(eventPayload.properties).length > 0 ||
            Object.keys(sensitiveProperties).length > 0,
        } satisfies AnalyticsTrackingEvent,
        eventPayload.context as AnalyticsContext | undefined,
      );
    } catch (err) {
      this.#captureException(err);
    }
  }

  #isAnonymousTrackEvent(eventPayload: SegmentTrackPayload): boolean {
    return eventPayload.properties[ANONYMOUS_EVENT_PROPERTY] === true;
  }

  /**
   * Identifies the user with valid user traits if they are participating in
   * the MetaMetrics analytics program.
   *
   * @param userTraits
   */
  identify(userTraits: Partial<MetaMetricsUserTraits>): void {
    const identifyPayload = this.#validateIdentifyPayload(userTraits);

    if (!identifyPayload) {
      return;
    }

    try {
      if (!this.#canSubmitAnalytics()) {
        return;
      }

      this.#updateLatestAnalyticsEventTimestamp();

      this.messenger.call(
        'AnalyticsController:identify',
        identifyPayload,
        undefined,
      );
    } catch (err) {
      this.#captureException(err);
    }
  }

  /**
   * Track a page view through AnalyticsController.
   *
   * @param payload - details of the page viewed.
   */
  trackPage(payload: MetaMetricsPagePayload): void {
    this.#validateTrackPagePayload(payload);

    try {
      if (!this.#canSubmitAnalytics()) {
        return;
      }

      const pagePayload = this.#buildTrackPagePayload(payload);

      this.#updateLatestAnalyticsEventTimestamp();

      this.messenger.call(
        'AnalyticsController:trackView',
        pagePayload.name,
        pagePayload.properties,
        pagePayload.context,
      );
    } catch (err) {
      this.#captureException(err);
    }
  }

  #validateTrackEventPayload(payload: MetaMetricsEventPayload): void {
    // event and category are required fields for all payloads
    if (!payload.event) {
      throw new Error(
        `Must specify event. Event was: ${
          payload.event
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        }. Payload keys were: ${Object.keys(payload)}. ${
          typeof payload.properties === 'object'
            ? // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              `Payload property keys were: ${Object.keys(payload.properties)}`
            : ''
        }`,
      );
    }
  }

  #validateTrackPagePayload(payload: MetaMetricsPagePayload): void {
    if (!payload || typeof payload !== 'object') {
      throw new Error(
        `MetaMetricsController#trackPage: payload parameter must be an object. Received type: ${typeof payload}`,
      );
    }
  }

  #validateIdentifyPayload(
    userTraits: Partial<MetaMetricsUserTraits>,
  ): AnalyticsUserTraits | undefined {
    if (!userTraits) {
      return undefined;
    }
    if (typeof userTraits !== 'object') {
      console.warn(
        `MetaMetricsController#identify: userTraits parameter must be an object. Received type: ${typeof userTraits}`,
      );
      return undefined;
    }

    const validTraits: Record<string, string> = {};

    for (const [key, value] of Object.entries(userTraits)) {
      if (this.#isValidTraitDate(value)) {
        validTraits[key] = value.toISOString();
      } else if (this.#isValidTrait(value)) {
        (validTraits as Record<string, typeof value>)[key] = value;
      } else {
        console.warn(
          `MetaMetricsController: "${key}" value is not a valid trait type`,
        );
      }
    }

    if (Object.keys(validTraits).length === 0) {
      return undefined;
    }

    return validTraits as AnalyticsUserTraits;
  }

  /**
   * Builds the event payload, processing all fields into a format that can be
   * routed through AnalyticsController.
   *
   * @private
   * @param rawPayload - raw payload provided to trackEvent
   * @returns formatted analytics track event payload
   */
  #buildTrackEventPayload(
    rawPayload: MetaMetricsEventPayload,
  ): SegmentTrackPayload {
    const enrichedPayload = this.#enrichWithABTestAnalytics(rawPayload);

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
      sensitiveProperties,
    } = enrichedPayload;

    let chainId;
    if (
      properties &&
      'chain_id_caip' in properties &&
      typeof properties.chain_id_caip === 'string'
    ) {
      chainId = null;
    } else if (
      properties &&
      'chain_id' in properties &&
      typeof properties.chain_id === 'string'
    ) {
      chainId = properties.chain_id;
    } else {
      chainId = this.chainId;
    }

    return {
      event,
      properties: omitBy(
        {
          // These values are omitted from properties because they have special meaning
          // in the Segment track spec: https://segment.com/docs/connections/spec/track/#properties.
          // To avoid accidentally using these inappropriately,
          // add them as top level properties on the event payload. We also exclude locale
          // to prevent consumers from overwriting this context level property. We track it
          // as a property because not all destinations map locale from context.
          ...omit(properties, ['revenue', 'locale', 'currency', 'value']),
          revenue,
          value,
          currency,
          category,
          locale: this.locale,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: chainId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: environmentType,
        },
        (propertyValue) => propertyValue === undefined,
      ) as AnalyticsEventProperties,
      context: this.#buildContext(referrer, page),
      sensitiveProperties,
    };
  }

  #buildTrackPagePayload(payload: MetaMetricsPagePayload): SegmentPagePayload {
    const { name, params, environmentType, page, referrer } = payload;

    return {
      name: name ?? '',
      properties: pickBy({
        params,
        locale: this.locale,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: this.chainId,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        environment_type: environmentType,
      }) as AnalyticsEventProperties,
      context: this.#buildContext(referrer, page) as AnalyticsContext,
    };
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
      const metaMetricsState = state as unknown as MetaMetricsControllerState;
      metaMetricsState.eventsBeforeMetricsOptIn = [];
    });
  }

  // It adds an event into a queue, which is only tracked if a user opts into metrics.
  addEventBeforeMetricsOptIn(event: MetaMetricsEventPayload): void {
    this.update((state) => {
      const metaMetricsState = state as unknown as MetaMetricsControllerState;
      metaMetricsState.eventsBeforeMetricsOptIn.push(event);
    });
  }

  // Track all queued traces after a user opted into metrics.
  trackTracesAfterMetricsOptIn(): void {
    const { tracesBeforeMetricsOptIn } = this.state;
    tracesBeforeMetricsOptIn.forEach((bufferedTrace) => {
      if (bufferedTrace.type === 'start') {
        trace(bufferedTrace.request as TraceRequest);
      } else if (bufferedTrace.type === 'end') {
        endTrace(bufferedTrace.request as EndTraceRequest);
      }
    });
  }

  // Once we track queued traces after a user opts into metrics, we want to clear the trace queue.
  clearTracesAfterMetricsOptIn(): void {
    this.update((state) => {
      const metaMetricsState = state as unknown as MetaMetricsControllerState;
      metaMetricsState.tracesBeforeMetricsOptIn = [];
    });
  }

  // It adds a trace into a queue, which is only tracked if a user opts into metrics.
  addTraceBeforeMetricsOptIn(traceData: BufferedTrace): void {
    this.update((state) => {
      const metaMetricsState = state as unknown as MetaMetricsControllerState;
      metaMetricsState.tracesBeforeMetricsOptIn.push(traceData);
    });
  }

  /**
   * Buffered trace method that checks consent and either buffers or executes immediately
   *
   * @param request - The trace request
   * @param fn - Optional callback function to trace
   * @returns The result of the trace callback or undefined if buffered
   */
  bufferedTrace<TraceResultType>(
    request: TraceRequest,
    fn?: TraceCallback<TraceResultType>,
  ): TraceResultType | undefined {
    if (this.#analyticsGetState().optedIn) {
      return fn ? trace(request, fn) : (trace(request) as TraceResultType);
    }

    // Extract parent trace name if parentContext exists
    let parentTraceName: string | undefined;
    if (request.parentContext && typeof request.parentContext === 'object') {
      const parentSpan = request.parentContext as { _name?: string };
      parentTraceName = parentSpan?._name;
    }

    this.addTraceBeforeMetricsOptIn({
      type: 'start',
      request: {
        ...request,
        parentContext: undefined as unknown as Json, // Remove original parentContext to avoid invalid references
        // Use Date.now() as performance.timeOrigin is only valid for measuring durations within
        // the same session; it won't produce valid event times for Sentry if buffered and flushed later
        startTime: request.startTime ?? Date.now(),
      },
      parentTraceName, // Store the parent trace name for later reconnection
    });

    return undefined;
  }

  /**
   * Buffered end trace method that checks consent and either buffers or executes immediately
   *
   * @param request - The end trace request
   */
  bufferedEndTrace(request: EndTraceRequest): void {
    if (this.#analyticsGetState().optedIn) {
      endTrace(request);
    } else {
      this.addTraceBeforeMetricsOptIn({
        type: 'end',
        request: {
          ...request,
          // Use Date.now() as performance.timeOrigin is only valid for measuring durations within
          // the same session; it won't produce valid event times for Sentry if buffered and flushed later
          timestamp: request.timestamp ?? Date.now(),
        },
      });
    }
  }

  // Add or update traits for tracking.
  updateTraits(newTraits: MetaMetricsUserTraits): void {
    this.update((state) => {
      state.traits = { ...state.traits, ...newTraits };
    });
  }

  // Retrieve the client metametrics id from AnalyticsController state
  getMetaMetricsId(): string {
    const { analyticsId } = this.#analyticsGetState();
    return analyticsId;
  }

  #isBasicFunctionalityEnabled(): boolean {
    const { useExternalServices } = this.messenger.call(
      'PreferencesController:getState',
    );
    return useExternalServices;
  }

  #canSubmitAnalytics(eventName?: string): boolean {
    if (!this.#isBasicFunctionalityEnabled()) {
      return false;
    }

    if (eventName === MetaMetricsEventName.MetricsOptOut) {
      return true;
    }

    const { analyticsId, optedIn } = this.#analyticsGetState();
    return optedIn && analyticsId.length > 0;
  }

  #updateLatestAnalyticsEventTimestamp(): void {
    this.update((state) => {
      state.latestNonAnonymousEventTimestamp = Date.now();
    });
  }

  #enrichWithABTestAnalytics(
    payload: MetaMetricsEventPayload,
  ): MetaMetricsEventPayload {
    let normalizedPayload = payload;

    if (payload.properties?.active_ab_tests !== undefined) {
      try {
        normalizedPayload = enrichWithABTests(payload, null, []);
      } catch {
        normalizedPayload = payload;
      }
    }

    if (!hasABTestAnalyticsMappingForEvent(payload.event)) {
      return normalizedPayload;
    }

    try {
      return enrichWithABTests(
        normalizedPayload,
        this.#getRemoteFeatureFlags(),
      );
    } catch {
      return normalizedPayload;
    }
  }

  #applyAnonymousEventOptions(
    eventPayload: SegmentTrackPayload,
    options?: MetaMetricsEventOptions,
  ): void {
    if (
      eventPayload.sensitiveProperties &&
      options?.excludeMetaMetricsId === true
    ) {
      throw new Error(
        'sensitiveProperties was specified in an event payload that also set the excludeMetaMetricsId flag',
      );
    }

    let excludeMetaMetricsId = options?.excludeMetaMetricsId ?? false;
    // This is carried over from the old implementation, and will likely need
    // to be updated to work with the new tracking plan. I think we should use
    // a config setting for this instead of trying to match the event name
    const isSendFlow = Boolean(eventPayload.event.match(/^send|^confirm/iu));
    // do not filter if excludeMetaMetricsId is explicitly set to false
    if (options?.excludeMetaMetricsId !== false && isSendFlow) {
      excludeMetaMetricsId = true;
    }

    // The platform adapter reads the "anonymous" marker from track `properties`
    // and swaps the user id for the shared anonymous id when marked is true.
    if (excludeMetaMetricsId) {
      (eventPayload.properties as Record<string, Json>)[
        ANONYMOUS_EVENT_PROPERTY
      ] = true;
    }
  }

  #applyLegacyEventOptions(
    eventPayload: SegmentTrackPayload,
    options?: MetaMetricsEventOptions,
  ): void {
    if (options?.matomoEvent === true) {
      eventPayload.properties.legacy_event = true;
    }
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
    return {
      app: {
        name: 'MetaMask Extension',
        version: this.version,
      },
      userAgent: window.navigator.userAgent,
      page,
      referrer,
      marketingCampaignCookieId: this.state.marketingCampaignCookieId,
    };
  }

  #getRemoteFeatureFlags(): Record<string, unknown> {
    return getRemoteFeatureFlagsWithManifestOverrides(
      this.messenger.call('RemoteFeatureFlagController:getState')
        ?.remoteFeatureFlags as Record<string, unknown> | undefined,
    );
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
    const { traits } = this.state;
    const storageKindTrait = traits[MetaMetricsUserTrait.StorageKind];
    const cookieIdTrait = traits[MetaMetricsUserTrait.CookieId];
    const gaClientIdTrait = traits[MetaMetricsUserTrait.GaClientId];

    const currentTraits: MetaMetricsUserTraits = {
      [MetaMetricsUserTrait.AddressBookEntries]: sum(
        Object.values(metamaskState.addressBook).map(size),
      ),
      [MetaMetricsUserTrait.InstallDateExt]:
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        traits[MetaMetricsUserTrait.InstallDateExt] || '',
      ...(storageKindTrait
        ? { [MetaMetricsUserTrait.StorageKind]: storageKindTrait }
        : {}),
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
      // caip-2 formatted
      [MetaMetricsUserTrait.ChainIdList]: [
        ...Object.keys(metamaskState.networkConfigurationsByChainId).map(
          (hexChainId) => `eip155:${parseInt(hexChainId, 16)}`,
        ),
        ...Object.keys(
          metamaskState?.multichainNetworkConfigurationsByChainId || {},
        ), // the state here is already caip-2 formatted
      ],
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
        getTokensControllerAllTokens({ metamask: metamaskState }),
      ),
      [MetaMetricsUserTrait.OpenSeaApiEnabled]: metamaskState.openSeaEnabled,
      [MetaMetricsUserTrait.ThreeBoxEnabled]: false, // deprecated, hard-coded as false
      [MetaMetricsUserTrait.Theme]: metamaskState.theme || 'default',
      [MetaMetricsUserTrait.TokenDetectionEnabled]:
        metamaskState.useTokenDetection,
      [MetaMetricsUserTrait.ShowNativeTokenAsMainBalance]:
        metamaskState.preferences?.showNativeTokenAsMainBalance ?? false,
      [MetaMetricsUserTrait.CurrentCurrency]: metamaskState.currentCurrency,
      [MetaMetricsUserTrait.SecurityProviders]:
        metamaskState.securityAlertsEnabled ? ['blockaid'] : [],
      [MetaMetricsUserTrait.PetnameAddressCount]:
        this.#getPetnameAddressCount(metamaskState),
      [MetaMetricsUserTrait.IsMetricsOptedIn]:
        metamaskState.participateInMetaMetrics,
      [MetaMetricsUserTrait.HasMarketingConsent]:
        metamaskState.dataCollectionForMarketing,
      [MetaMetricsUserTrait.TokenSortPreference]:
        metamaskState.preferences?.tokenSortConfig?.key || '',
      [MetaMetricsUserTrait.PrivacyModeEnabled]:
        metamaskState.preferences?.privacyMode ?? false,
      [MetaMetricsUserTrait.NetworkFilterPreference]: Object.keys(
        metamaskState.preferences?.tokenNetworkFilter || {},
      ),
      [MetaMetricsUserTrait.ProfileId]: Object.entries(
        metamaskState.srpSessionData || {},
      )?.[0]?.[1]?.profile?.profileId,
      [MetaMetricsUserTrait.AccountType]: this.#getAccountTypeTrait(
        metamaskState.firstTimeFlowType,
      ),
      [MetaMetricsUserTrait.Platform]: getPlatform(),
      [MetaMetricsUserTrait.InstallType]: getInstallType(),
      [MetaMetricsUserTrait.DeviceType]: getDeviceType(),
      [MetaMetricsUserTrait.Os]: getOs(),
      ...this.#getAccountCompositionTraits(metamaskState),
    };

    if (cookieIdTrait !== undefined) {
      currentTraits[MetaMetricsUserTrait.CookieId] = cookieIdTrait;
    }

    if (gaClientIdTrait !== undefined) {
      currentTraits[MetaMetricsUserTrait.GaClientId] = gaClientIdTrait;
    }

    if (!this.previousUserTraits && metamaskState.participateInMetaMetrics) {
      this.previousUserTraits = currentTraits;
      return currentTraits;
    }

    if (
      this.previousUserTraits &&
      !isEqual(this.previousUserTraits, currentTraits)
    ) {
      const updates = pickBy(currentTraits, (v, k) => {
        // @ts-expect-error It's okay that `k` may not be a key of `this.previousUserTraits`, because we assume `isEqual` can handle it
        const previous = this.previousUserTraits[k];
        return !isEqual(previous, v);
      });

      if (metamaskState.participateInMetaMetrics) {
        this.previousUserTraits = currentTraits;
      }

      return updates;
    }

    return null;
  }

  #getAccountTypeTrait(
    firstTimeFlowType: MetaMaskState['firstTimeFlowType'],
  ): NonNullable<MetaMetricsUserTraits[MetaMetricsUserTrait.AccountType]> {
    switch (firstTimeFlowType) {
      case FirstTimeFlowType.import:
      case FirstTimeFlowType.restore:
        return MetaMetricsEventAccountType.Imported;
      case FirstTimeFlowType.socialImport:
        return this.#getSocialAccountType(MetaMetricsEventAccountType.Imported);
      case FirstTimeFlowType.socialCreate:
        return this.#getSocialAccountType(MetaMetricsEventAccountType.Default);
      case FirstTimeFlowType.create:
      default:
        return MetaMetricsEventAccountType.Default;
    }
  }

  #getSocialAccountType(
    baseType:
      | MetaMetricsEventAccountType.Default
      | MetaMetricsEventAccountType.Imported,
  ): NonNullable<MetaMetricsUserTraits[MetaMetricsUserTrait.AccountType]> {
    const authConnection = this.#getSeedlessOnboardingState()?.authConnection;
    return authConnection ? `${baseType}_${authConnection}` : baseType;
  }

  #getSeedlessOnboardingState():
    | Partial<SeedlessOnboardingControllerState>
    | undefined {
    try {
      return this.messenger.call('SeedlessOnboardingController:getState');
    } catch {
      return undefined;
    }
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
   * Computes wallet composition traits from internalAccounts, which is always
   * available regardless of lock state (unlike keyrings).
   *
   * number_of_account_groups deduplicates BIP44 multichain accounts by their
   * entropy source and group index so that EVM + BTC + SOL addresses derived
   * from the same SRP slot count as one account group, matching what users see
   * in the Account Management UI.
   *
   * @param metamaskState
   */
  #getAccountCompositionTraits(
    metamaskState: MetaMaskState,
  ): Partial<MetaMetricsUserTraits> {
    const accountGroupKeys = new Set<string>();
    const hdEntropyIds = new Set<string>();
    let numberOfImportedAccounts = 0;
    let numberOfLedgerAccounts = 0;
    let numberOfTrezorAccounts = 0;
    let numberOfLatticeAccounts = 0;
    let numberOfQrHardwareAccounts = 0;

    for (const [accountId, account] of Object.entries(
      metamaskState.internalAccounts.accounts,
    )) {
      const keyringType = account.metadata?.keyring?.type;

      switch (keyringType) {
        case KeyringType.imported:
          numberOfImportedAccounts += 1;
          break;
        case KeyringType.ledger:
          numberOfLedgerAccounts += 1;
          break;
        case KeyringType.trezor:
          numberOfTrezorAccounts += 1;
          break;
        case KeyringType.lattice:
          numberOfLatticeAccounts += 1;
          break;
        case KeyringType.qr:
        case KeyringType.oneKey:
          numberOfQrHardwareAccounts += 1;
          break;
        default:
          break;
      }

      // BIP44 multichain accounts share an entropy source id and group index
      // across all chains (EVM, BTC, SOL, …). Deduplicating on that key gives
      // the count of account groups rather than individual chain addresses.
      const entropy: InternalAccount['options']['entropy'] =
        account.options?.entropy;

      if (
        entropy?.type === 'mnemonic' &&
        'id' in entropy &&
        'groupIndex' in entropy
      ) {
        accountGroupKeys.add(`${entropy.id}:${entropy.groupIndex}`);
        hdEntropyIds.add(entropy.id);
      } else {
        accountGroupKeys.add(accountId);
      }
    }

    return {
      [MetaMetricsUserTrait.NumberOfHDEntropies]: hdEntropyIds.size,
      [MetaMetricsUserTrait.NumberOfAccountGroups]: accountGroupKeys.size,
      [MetaMetricsUserTrait.NumberOfImportedAccounts]: numberOfImportedAccounts,
      [MetaMetricsUserTrait.NumberOfLedgerAccounts]: numberOfLedgerAccounts,
      [MetaMetricsUserTrait.NumberOfTrezorAccounts]: numberOfTrezorAccounts,
      [MetaMetricsUserTrait.NumberOfLatticeAccounts]: numberOfLatticeAccounts,
      [MetaMetricsUserTrait.NumberOfQrHardwareAccounts]:
        numberOfQrHardwareAccounts,
      // MetaMask enforces one paired device per hardware wallet type, so
      // "types in use" equals "distinct devices".
      [MetaMetricsUserTrait.NumberOfHardwareWallets]:
        (numberOfLedgerAccounts > 0 ? 1 : 0) +
        (numberOfTrezorAccounts > 0 ? 1 : 0) +
        (numberOfLatticeAccounts > 0 ? 1 : 0) +
        (numberOfQrHardwareAccounts > 0 ? 1 : 0),
    };
  }

  /**
   * Validates the trait value so AnalyticsController receives values supported
   * by the configured analytics destinations.
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
   * Validates trait arrays.
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

  #trackMetricsOptOutEvent(payload: SegmentTrackPayload): void {
    const { analyticsId } = this.#analyticsGetState();

    if (analyticsId.length === 0 || getPlatform() === PLATFORM_FIREFOX) {
      return;
    }

    this.#updateLatestAnalyticsEventTimestamp();

    trackSegmentEventWhileOptedOut({
      analyticsId,
      event: MetaMetricsEventName.MetricsOptOut,
      properties: payload.properties as Record<string, Json> | undefined,
      context: payload.context as AnalyticsContext | undefined,
    });
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
