import { ObservableStore } from '@metamask/obs-store';
import {
  TOGGLEABLE_ALERT_TYPES,
  WEB3_SHIM_USAGE_ALERT_STATES,
} from '../../../shared/constants/alerts';

/**
 * @typedef {Object} AlertControllerInitState
 * @property {Object} alertEnabledness - A map of alerts IDs to booleans, where
 * `true` indicates that the alert is enabled and shown, and `false` the opposite.
 * @property {Object} unconnectedAccountAlertShownOrigins - A map of origin
 * strings to booleans indicating whether the "switch to connected" alert has
 * been shown (`true`) or otherwise (`false`).
 */

/**
 * @typedef {Object} AlertControllerOptions
 * @property {AlertControllerInitState} initState - The initial controller state
 */

const defaultState = {
  alertEnabledness: TOGGLEABLE_ALERT_TYPES.reduce(
    (alertEnabledness, alertType) => {
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
export default class AlertController {
  /**
   * @constructor
   * @param {AlertControllerOptions} [opts] - Controller configuration parameters
   */
  constructor(opts = {}) {
    const { initState = {}, preferencesStore } = opts;
    const state = {
      ...defaultState,
      alertEnabledness: {
        ...defaultState.alertEnabledness,
        ...initState.alertEnabledness,
      },
    };

    this.store = new ObservableStore(state);

    this.selectedAddress = preferencesStore.getState().selectedAddress;

    preferencesStore.subscribe(({ selectedAddress }) => {
      const currentState = this.store.getState();
      if (
        currentState.unconnectedAccountAlertShownOrigins &&
        this.selectedAddress !== selectedAddress
      ) {
        this.selectedAddress = selectedAddress;
        this.store.updateState({ unconnectedAccountAlertShownOrigins: {} });
      }
    });
  }

  setAlertEnabledness(alertId, enabledness) {
    let { alertEnabledness } = this.store.getState();
    alertEnabledness = { ...alertEnabledness };
    alertEnabledness[alertId] = enabledness;
    this.store.updateState({ alertEnabledness });
  }

  /**
   * Sets the "switch to connected" alert as shown for the given origin
   * @param {string} origin - The origin the alert has been shown for
   */
  setUnconnectedAccountAlertShown(origin) {
    let { unconnectedAccountAlertShownOrigins } = this.store.getState();
    unconnectedAccountAlertShownOrigins = {
      ...unconnectedAccountAlertShownOrigins,
    };
    unconnectedAccountAlertShownOrigins[origin] = true;
    this.store.updateState({ unconnectedAccountAlertShownOrigins });
  }

  /**
   * Gets the web3 shim usage state for the given origin.
   *
   * @param {string} origin - The origin to get the web3 shim usage state for.
   * @returns {undefined | 1 | 2} The web3 shim usage state for the given
   * origin, or undefined.
   */
  getWeb3ShimUsageState(origin) {
    return this.store.getState().web3ShimUsageOrigins[origin];
  }

  /**
   * Sets the web3 shim usage state for the given origin to RECORDED.
   *
   * @param {string} origin - The origin the that used the web3 shim.
   */
  setWeb3ShimUsageRecorded(origin) {
    this._setWeb3ShimUsageState(origin, WEB3_SHIM_USAGE_ALERT_STATES.RECORDED);
  }

  /**
   * Sets the web3 shim usage state for the given origin to DISMISSED.
   *
   * @param {string} origin - The origin that the web3 shim notification was
   * dismissed for.
   */
  setWeb3ShimUsageAlertDismissed(origin) {
    this._setWeb3ShimUsageState(origin, WEB3_SHIM_USAGE_ALERT_STATES.DISMISSED);
  }

  /**
   * @private
   * @param {string} origin - The origin to set the state for.
   * @param {number} value - The state value to set.
   */
  _setWeb3ShimUsageState(origin, value) {
    let { web3ShimUsageOrigins } = this.store.getState();
    web3ShimUsageOrigins = {
      ...web3ShimUsageOrigins,
    };
    web3ShimUsageOrigins[origin] = value;
    this.store.updateState({ web3ShimUsageOrigins });
  }
}
