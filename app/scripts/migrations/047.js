const version = 47
import { cloneDeep } from 'lodash'
import { ALERT_TYPES } from '../controllers/alert'

/**
 * Initialize `AlertController.alertEnabledness` state if it hasn't yet been set
 */
export default {
  version,
  migrate: async function (originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData)
    versionedData.meta.version = version
    const state = versionedData.data
    versionedData.data = transformState(state)
    return versionedData
  },
}

function transformState (state) {
  if (typeof state?.AlertController?.alertEnabledness === 'undefined') {
    const AlertControllerState = {
      alertEnabledness: Object.keys(ALERT_TYPES)
        .reduce(
          (alertEnabledness, alertType) => {
            alertEnabledness[alertType] = true
            return alertEnabledness
          },
          {}
        ),
      unconnectedAccountAlertShownOrigins: {},
    }
    state.AlertController = AlertControllerState
  }
  return state
}
