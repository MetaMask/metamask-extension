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
  const { PreferencesController } = state
  if (PreferencesController && !PreferencesController.autoLockTimerMigrated) {
    const preferences = PreferencesController.preferences || {}

    if (parseInt(preferences.autoLockTimeLimit) > 0) {
      state.PreferencesController.autoLockTimerMigrated = true
      return state
    }

    preferences.autoLockTimeLimit = 5
    state.PreferencesController.autoLockTimerMigrated = true
    return state
  }
  return state
}
