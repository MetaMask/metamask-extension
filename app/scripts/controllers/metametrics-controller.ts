import { getErrorMessage } from '@metamask/utils';
import type {
  AnalyticsControllerActions,
  AnalyticsControllerState,
} from '@metamask/analytics-controller';
import type {
  NetworkClientId,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
  NetworkControllerNetworkDidChangeEvent,
} from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type { MultichainNetworkControllerGetStateAction } from '@metamask/multichain-network-controller';
import type { Browser } from 'webextension-polyfill';
import {
  BaseController,
  type ControllerGetStateAction,
  type ControllerStateChangeEvent,
  type StateMetadata,
} from '@metamask/base-controller';
import type { Messenger } from '@metamask/messenger';
import type { Json, Hex } from '@metamask/utils';
import type { MetaMetricsUserTraits } from '../../../shared/constants/metametrics';
import {
  trace,
  endTrace,
  type TraceRequest,
  type EndTraceRequest,
  type TraceCallback,
} from '../../../shared/lib/trace';
import { ENVIRONMENT } from '../../../shared/constants/build';
import type { captureException } from '../../../shared/lib/sentry';
import { registerABTestAnalyticsMapping } from '../../../shared/lib/ab-testing/ab-test-analytics';
import { CHAIN_VALUE_ORDER_AB_TEST_ANALYTICS_MAPPING } from '../../../shared/lib/ab-testing/configs/chain-value-order';
import { PERPS_TAB_BADGE_AB_TEST_ANALYTICS_MAPPING } from '../../../shared/lib/ab-testing/configs/perps-tab-badge';
import { isMain } from '../../../shared/lib/build-types';
import type {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from './preferences-controller';
import { MetaMetricsControllerMethodActions } from './metametrics-controller-method-action-types';

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

/**
 * {@link MetaMetricsController}'s metadata.
 *
 * This allows us to choose if fields of the state should be persisted or not
 * using the `persist` flag; and if they can be sent to Sentry or not, using
 * the `anonymous` flag.
 */
const controllerMetadata: StateMetadata<MetaMetricsControllerState> = {
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
 * @property tracesBeforeMetricsOptIn - Array of queued traces added before a user opts into metrics.
 * @property traits - Traits that are not derived from other state keys.
 * @property dataCollectionForMarketing - Flag to determine if data collection for marketing is enabled.
 * @property marketingCampaignCookieId - The marketing campaign cookie id.
 */
export type MetaMetricsControllerState = {
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
  | MultichainNetworkControllerGetStateAction
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
    dataCollectionForMarketing: null,
    marketingCampaignCookieId: null,
    tracesBeforeMetricsOptIn: [],
    traits: {},
  });

const MESSENGER_EXPOSED_METHODS = [
  'addTraceBeforeMetricsOptIn',
  'bufferedEndTrace',
  'bufferedTrace',
  'clearTracesAfterMetricsOptIn',
  'setDataCollectionForMarketing',
  'setMarketingCampaignCookieId',
  'setParticipateInMetaMetrics',
  'trackTracesAfterMetricsOptIn',
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

    // Register A/B test analytics mappings so that matching events are
    // enriched with their `active_ab_tests` assignment.
    registerABTestAnalyticsMapping(CHAIN_VALUE_ORDER_AB_TEST_ANALYTICS_MAPPING);
    registerABTestAnalyticsMapping(PERPS_TAB_BADGE_AB_TEST_ANALYTICS_MAPPING);

    this.messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );

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
  }

  /**
   * Gets the current chain ID.
   *
   * @param networkClientId - The network client ID to get the chain ID for.
   */
  #getCurrentChainId(networkClientId?: NetworkClientId): Hex {
    const selectedNetworkClientId =
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

  // It sets an uninstall URL ("Sorry to see you go!" page),
  // which is opened if a user uninstalls the extension.
  // This method should only be called after the user has made a decision about MetaMetrics participation.
  updateExtensionUninstallUrl(
    participateInMetaMetrics: boolean,
    analyticsId: string,
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
      query.mmi = Buffer.from(analyticsId).toString('base64');
      query.env = this.#environment;
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
    participateInMetaMetrics: boolean | null,
  ): Promise<string | null> {
    const { analyticsId } = this.#analyticsGetState();

    // Opt-in/out and the undecided reset are owned by AnalyticsController, which
    // also replays/clears its pre-consent event queue. Traces remain buffered
    // here (out of scope) and are flushed/cleared alongside.
    if (participateInMetaMetrics === true) {
      this.messenger.call('AnalyticsController:optIn');
      this.trackTracesAfterMetricsOptIn();
      this.clearTracesAfterMetricsOptIn();
    } else {
      if (participateInMetaMetrics === false) {
        this.messenger.call('AnalyticsController:optOut');
        // Drop any UI-buffered pre-submit traces; they must not be sent after opt-out.
        this.clearTracesAfterMetricsOptIn();
      } else {
        // `null` returns the user to the undecided state.
        this.messenger.call('AnalyticsController:resetConsentDecision');
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
}
