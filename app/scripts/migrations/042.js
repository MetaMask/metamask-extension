const version = 42
import { cloneDeep } from 'lodash'

/**
 * set PreferencesController.advancedInlineGas to false
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
  if (state.PreferencesController) {
    if (state.PreferencesController.migratedAdvancedInlineGas) {
      return state
    }
    state.PreferencesController.featureFlags = {
      ...(state.PreferencesController.featureFlags || {}),
      advancedInlineGas: false,
    }
    state.PreferencesController.migratedAdvancedInlineGas = true
  }
  return state
}
