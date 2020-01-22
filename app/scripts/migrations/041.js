const version = 41
import clone from 'clone'

/**
 * PreferencesController.autoLogoutTimeLimit -> autoLockTimeLimit
 */
export default {
  version,
  migrate: async function (originalVersionedData) {
    const versionedData = clone(originalVersionedData)
    versionedData.meta.version = version
    const state = versionedData.data
    versionedData.data = transformState(state)
    return versionedData
  },
}

function transformState (state) {
  if (state.PreferencesController && state.PreferencesController.preferences) {
    state.PreferencesController.preferences.autoLockTimeLimit = state.PreferencesController.preferences.autoLogoutTimeLimit
    delete state.PreferencesController.preferences.autoLogoutTimeLimit
  }
  return state
}
