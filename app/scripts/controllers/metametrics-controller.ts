import { getErrorMessage } from '@metamask/utils';
import type {
  AnalyticsControllerGetStateAction,
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
import {
  BaseController,
  type ControllerGetStateAction,
  type ControllerStateChangeEvent,
  type StateMetadata,
} from '@metamask/base-controller';
import type { Messenger } from '@metamask/messenger';
import type { Hex } from '@metamask/utils';
import type { captureException } from '../../../shared/lib/sentry';
import { registerABTestAnalyticsMapping } from '../../../shared/lib/ab-testing/ab-test-analytics';
import { CHAIN_VALUE_ORDER_AB_TEST_ANALYTICS_MAPPING } from '../../../shared/lib/ab-testing/configs/chain-value-order';
import { PERPS_TAB_BADGE_AB_TEST_ANALYTICS_MAPPING } from '../../../shared/lib/ab-testing/configs/perps-tab-badge';
import type {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from './preferences-controller';
import { MetaMetricsControllerMethodActions } from './metametrics-controller-method-action-types';

// Unique name for the controller
const controllerName = 'MetaMetricsController';

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
 * {@link MetaMetricsController}'s metadata.
 *
 * This allows us to choose if fields of the state should be persisted or not
 * using the `persist` flag; and if they can be sent to Sentry or not, using
 * the `anonymous` flag.
 */
const controllerMetadata: StateMetadata<MetaMetricsControllerState> = {
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
 * @property dataCollectionForMarketing - Flag to determine if data collection for marketing is enabled.
 * @property marketingCampaignCookieId - The marketing campaign cookie id.
 */
export type MetaMetricsControllerState = {
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
  | AnalyticsControllerGetStateAction;

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
  captureException?: CaptureException;
};

/**
 * Function to get default state of the {@link MetaMetricsController}.
 */
export const getDefaultMetaMetricsControllerState =
  (): MetaMetricsControllerState => ({
    dataCollectionForMarketing: null,
    marketingCampaignCookieId: null,
  });

const MESSENGER_EXPOSED_METHODS = [
  'setDataCollectionForMarketing',
  'setMarketingCampaignCookieId',
] as const;

export class MetaMetricsController extends BaseController<
  typeof controllerName,
  MetaMetricsControllerState,
  MetaMetricsControllerMessenger
> {
  #captureException: CaptureException;

  chainId: Hex;

  locale: string;

  #analyticsGetState(): AnalyticsControllerState {
    return this.messenger.call('AnalyticsController:getState');
  }

  /**
   * @param options
   * @param options.state - Initial controller state.
   * @param options.messenger - Messenger used to communicate with BaseV2 controller.
   * @param options.captureException
   */
  constructor({
    state = {},
    messenger,
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
}
