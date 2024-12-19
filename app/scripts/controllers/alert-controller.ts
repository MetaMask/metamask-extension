import { ObservableStore } from '@metamask/obs-store';
import {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerSelectedAccountChangeEvent,
} from '@metamask/accounts-controller';
import { RestrictedControllerMessenger } from '@metamask/base-controller';
import {
  TOGGLEABLE_ALERT_TYPES,
  Web3ShimUsageAlertStates,
} from '../../../shared/constants/alerts';

const controllerName = 'AlertController';

/**
 * Returns the state of the {@link AlertController}.
 */
export type AlertControllerGetStateAction = {
  type: 'AlertController:getState';
  handler: () => AlertControllerState;
};

/**
 * Actions exposed by the {@link AlertController}.
 */
export type AlertControllerActions = AlertControllerGetStateAction;

/**
 * Event emitted when the state of the {@link AlertController} changes.
 */
export type AlertControllerStateChangeEvent = {
  type: 'AlertController:stateChange';
  payload: [AlertControllerState, []];
};

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
type AlertControllerOptions = {
  state?: Partial<AlertControllerState>;
  controllerMessenger: AlertControllerMessenger;
};

const defaultState: AlertControllerState = {
  alertEnabledness: TOGGLEABLE_ALERT_TYPES.reduce(
    (alertEnabledness: Record<string, boolean>, alertType: string) => {
      alertEnabledness[alertType] = true;
      return alertEnabledness;
    },
    {},
  ),
  unconnectedAccountAlertShownOrigins: {},
  web3ShimUsageOrigins: {},
};

/**
 * Controller responsible for maintaining alert-related state.
 */
export class AlertController {
  store: ObservableStore<AlertControllerState>;

  readonly #controllerMessenger: AlertControllerMessenger;

  #selectedAddress: string;

  constructor(opts: AlertControllerOptions) {
    const state: AlertControllerState = {
      ...defaultState,
      ...opts.state,
    };

    this.store = new ObservableStore(state);
    this.#controllerMessenger = opts.controllerMessenger;
    this.#controllerMessenger.registerActionHandler(
      'AlertController:getState',
      () => this.store.getState(),
    );
    this.store.subscribe((alertState: AlertControllerState) => {
      this.#controllerMessenger.publish(
        'AlertController:stateChange',
        alertState,
        [],
      );
    });

    this.#selectedAddress = this.#controllerMessenger.call(
      'AccountsController:getSelectedAccount',
    ).address;

    this.#controllerMessenger.subscribe(
      'AccountsController:selectedAccountChange',
      (account: { address: string }) => {
        const currentState = this.store.getState();
        if (
          currentState.unconnectedAccountAlertShownOrigins &&
          this.#selectedAddress !== account.address
        ) {
          this.#selectedAddress = account.address;
          this.store.updateState({ unconnectedAccountAlertShownOrigins: {} });
        }
      },
    );
  }

  setAlertEnabledness(alertId: string, enabledness: boolean): void {
    const { alertEnabledness } = this.store.getState();
    alertEnabledness[alertId] = enabledness;
    this.store.updateState({ alertEnabledness });
  }

  /**
   * Sets the "switch to connected" alert as shown for the given origin
   *
   * @param origin - The origin the alert has been shown for
   */
  setUnconnectedAccountAlertShown(origin: string): void {
    const { unconnectedAccountAlertShownOrigins } = this.store.getState();
    unconnectedAccountAlertShownOrigins[origin] = true;
    this.store.updateState({ unconnectedAccountAlertShownOrigins });
  }

  /**
   * Gets the web3 shim usage state for the given origin.
   *
   * @param origin - The origin to get the web3 shim usage state for.
   * @returns The web3 shim usage state for the given
   * origin, or undefined.
   */
  getWeb3ShimUsageState(origin: string): number | undefined {
    return this.store.getState().web3ShimUsageOrigins?.[origin];
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
    const { web3ShimUsageOrigins } = this.store.getState();
    if (web3ShimUsageOrigins) {
      web3ShimUsageOrigins[origin] = value;
      this.store.updateState({ web3ShimUsageOrigins });
    }
  }
}
