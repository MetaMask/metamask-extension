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
    const { initState } = opts
    const state = Object.assign(
      {},
      defaultState,
      initState,
    )
    this.store = new ObservableStore(state)
  }

  setAlertEnabledness (alertId, enabledness) {
    let { alertEnabledness } = this.store.getState()
    alertEnabledness = { ...alertEnabledness }
    alertEnabledness[alertId] = enabledness
    this.store.updateState({ alertEnabledness })
  }
}
