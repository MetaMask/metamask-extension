const version = 42
import { cloneDeep } from 'lodash'

/**
 * PreferencesController.autoLogoutTimeLimit -> autoLockTimeLimit
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
  if (state.AppStateController) {
    state.AppStateController.connectedStatusPopoverHasBeenShown = false
  } else {
    state.AppStateController = {
      connectedStatusPopoverHasBeenShown: false,
    }
  }
  return state
}
