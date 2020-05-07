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


const defaultState = {
  alertEnabledness: {
    unconnectedAccount: true,
  },
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
    const { alertEnabledness } = this.store.getState()
    alertEnabledness[alertId] = enabledness
    this.store.updateState({ alertEnabledness })
  }
}
