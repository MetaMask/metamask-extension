import ObservableStore from 'obs-store'

/**
 * @typedef {Object} AlertControllerInitState
 * @property {Object} alertEnabledness - A map of any alerts that were suppressed keyed by alert ID, where the value
 *   is the timestamp of when the user suppressed the alert.
 */

/**
 * @typedef {Object} AlertControllerOptions
 * @property {AlertControllerInitState} initState - The initial controller state
 */

export const ALERT_TYPES = {
  switchToConnected: 'switchToConnected',
  unconnectedAccount: 'unconnectedAccount',
}

const defaultState = {
  alertEnabledness: Object.keys(ALERT_TYPES)
    .reduce(
      (alertEnabledness, alertType) => {
        alertEnabledness[alertType] = true
        return alertEnabledness
      },
      {}
    ),
  switchToConnectedAlertShown: {},
}

/**
 * Controller responsible for maintaining
 * alert related state
 */
export default class AlertController {
  /**
   * @constructor
   * @param {AlertControllerOptions} [opts] - Controller configuration parameters
   */
  constructor (opts = {}) {
    const { initState, preferencesStore } = opts
    const state = Object.assign(
      {},
      defaultState,
      initState,
      {
        switchToConnectedAlertShown: {},
      }
    )
    this.store = new ObservableStore(state)

    const { selectedAddress } = preferencesStore.getState()
    this.selectedAddress = selectedAddress

    preferencesStore.subscribe(({ selectedAddress }) => {
      const currentState = this.store.getState()
      if (currentState.switchToConnectedAlertShown && this.selectedAddress !== selectedAddress) {
        this.selectedAddress = selectedAddress
        this.store.updateState({ switchToConnectedAlertShown: {} })
      }
    })
  }

  setAlertEnabledness (alertId, enabledness) {
    let { alertEnabledness } = this.store.getState()
    alertEnabledness = { ...alertEnabledness }
    alertEnabledness[alertId] = enabledness
    this.store.updateState({ alertEnabledness })
  }

  /**
   * Sets the "switch to connected" alert as shown for the given origin
   * @param {string} origin - The origin the alert has been shown for
   */
  setSwitchToConnectedAlertShown (origin) {
    let { switchToConnectedAlertShown } = this.store.getState()
    switchToConnectedAlertShown = { ...switchToConnectedAlertShown }
    switchToConnectedAlertShown[origin] = true
    this.store.updateState({ switchToConnectedAlertShown })
  }
}
