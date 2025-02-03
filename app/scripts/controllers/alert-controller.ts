import {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerSelectedAccountChangeEvent,
} from '@metamask/accounts-controller';
import {
  BaseController,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import {
  TOGGLEABLE_ALERT_TYPES,
  Web3ShimUsageAlertStates,
} from '../../../shared/constants/alerts';

const controllerName = 'AlertController';

/**
 * Returns the state of the {@link AlertController}.
 */
export type AlertControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  AlertControllerState
>;

/**
 * Actions exposed by the {@link AlertController}.
 */
export type AlertControllerActions = AlertControllerGetStateAction;

/**
 * Event emitted when the state of the {@link AlertController} changes.
 */
export type AlertControllerStateChangeEvent = ControllerStateChangeEvent<
  typeof controllerName,
  AlertControllerState
>;

/**
 * Events emitted by {@link AlertController}.
 */
export type AlertControllerEvents = AlertControllerStateChangeEvent;

/**
 * Actions that this controller is allowed to call.
 */
export type AllowedActions = AccountsControllerGetSelectedAccountAction;

/**
 * Events that this controller is allowed to subscribe.
 */
export type AllowedEvents = AccountsControllerSelectedAccountChangeEvent;

export type AlertControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  AlertControllerActions | AllowedActions,
  AlertControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

/**
 * The alert controller state type
 *
 * @property alertEnabledness - A map of alerts IDs to booleans, where
 * `true` indicates that the alert is enabled and shown, and `false` the opposite.
 * @property unconnectedAccountAlertShownOrigins - A map of origin
 * strings to booleans indicating whether the "switch to connected" alert has
 * been shown (`true`) or otherwise (`false`).
 */
export type AlertControllerState = {
  alertEnabledness: Record<string, boolean>;
  unconnectedAccountAlertShownOrigins: Record<string, boolean>;
  web3ShimUsageOrigins?: Record<string, number>;
};

/**
 * The alert controller options
 *
 * @property state - The initial controller state
 * @property controllerMessenger - The controller messenger
 */
export type AlertControllerOptions = {
  state?: Partial<AlertControllerState>;
  messenger: AlertControllerMessenger;
};

/**
 * Function to get default state of the {@link AlertController}.
 */
export const getDefaultAlertControllerState = (): AlertControllerState => ({
  alertEnabledness: TOGGLEABLE_ALERT_TYPES.reduce(
    (alertEnabledness: Record<string, boolean>, alertType: string) => {
      alertEnabledness[alertType] = true;
      return alertEnabledness;
    },
    {},
  ),
  unconnectedAccountAlertShownOrigins: {},
  web3ShimUsageOrigins: {},
});

/**
 * {@link AlertController}'s metadata.
 *
 * This allows us to choose if fields of the state should be persisted or not
 * using the `persist` flag; and if they can be sent to Sentry or not, using
 * the `anonymous` flag.
 */
const controllerMetadata = {
  alertEnabledness: {
    persist: true,
    anonymous: true,
  },
  unconnectedAccountAlertShownOrigins: {
    persist: true,
    anonymous: false,
  },
  web3ShimUsageOrigins: {
    persist: true,
    anonymous: false,
  },
};

/**
 * Controller responsible for maintaining alert-related state.
 */
export class AlertController extends BaseController<
  typeof controllerName,
  AlertControllerState,
  AlertControllerMessenger
> {
  #selectedAddress: string;

  constructor(opts: AlertControllerOptions) {
    super({
      messenger: opts.messenger,
      metadata: controllerMetadata,
      name: controllerName,
      state: {
        ...getDefaultAlertControllerState(),
        ...opts.state,
      },
    });

    this.#selectedAddress = this.messagingSystem.call(
      'AccountsController:getSelectedAccount',
    ).address;

    this.messagingSystem.subscribe(
      'AccountsController:selectedAccountChange',
      (account: { address: string }) => {
        const currentState = this.state;
        if (
          currentState.unconnectedAccountAlertShownOrigins &&
          this.#selectedAddress !== account.address
        ) {
          this.#selectedAddress = account.address;
          this.update((state) => {
            state.unconnectedAccountAlertShownOrigins = {};
          });
        }
      },
    );
  }

  setAlertEnabledness(alertId: string, enabledness: boolean): void {
    this.update((state) => {
      state.alertEnabledness[alertId] = enabledness;
    });
  }

  /**
   * Sets the "switch to connected" alert as shown for the given origin
   *
   * @param origin - The origin the alert has been shown for
   */
  setUnconnectedAccountAlertShown(origin: string): void {
    this.update((state) => {
      state.unconnectedAccountAlertShownOrigins[origin] = true;
    });
  }

  /**
   * Gets the web3 shim usage state for the given origin.
   *
   * @param origin - The origin to get the web3 shim usage state for.
   * @returns The web3 shim usage state for the given
   * origin, or undefined.
   */
  getWeb3ShimUsageState(origin: string): number | undefined {
    return this.state.web3ShimUsageOrigins?.[origin];
  }

  /**
   * Sets the web3 shim usage state for the given origin to RECORDED.
   *
   * @param origin - The origin the that used the web3 shim.
   */
  setWeb3ShimUsageRecorded(origin: string): void {
    this.#setWeb3ShimUsageState(origin, Web3ShimUsageAlertStates.recorded);
  }

  /**
   * Sets the web3 shim usage state for the given origin to DISMISSED.
   *
   * @param origin - The origin that the web3 shim notification was
   * dismissed for.
   */
  setWeb3ShimUsageAlertDismissed(origin: string): void {
    this.#setWeb3ShimUsageState(origin, Web3ShimUsageAlertStates.dismissed);
  }

  /**
   * @param origin - The origin to set the state for.
   * @param value - The state value to set.
   */
  #setWeb3ShimUsageState(origin: string, value: number): void {
    this.update((state) => {
      if (state.web3ShimUsageOrigins) {
        state.web3ShimUsageOrigins[origin] = value;
      }
    });
  }
}
