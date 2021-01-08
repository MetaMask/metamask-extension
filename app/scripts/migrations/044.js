const version = 44
import { cloneDeep } from 'lodash'

/**
 * reset all network if not migratedToTethys
 */
export default {
  version,
  migrate: async function(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData)
    versionedData.meta.version = version
    const state = versionedData.data
    versionedData.data = transformState(state)
    return versionedData
  },
}

function transformState(state) {
  if (state.PreferencesController) {
    if (!state.PreferencesController.preferences) {
 state.PreferencesController.preferences = {}
}

    if (
      parseInt(state.PreferencesController.preferences.autoLockTimeLimit) > 0
    ) {
      return state
    }

    state.PreferencesController.preferences.autoLockTimeLimit = 5
    return state
  }
  return state
}
